// FE-55 — cache invalidation is whole-domain on every mutation.
//
// Before the fix, admin mutations invalidated the domain's `all`
// key (a prefix that matches every list variant, every detail,
// stats, analytics, featured/related/applied/validate…) and then
// REDUNDANTLY invalidated detail(id), a subset already covered:
//  - src/hooks/admin/useAnnouncementTan.js (+ Contact / Discount /
//    Promotion / User hooks, and Product / Category in
//    src/hooks/product/) — invalidate all(), then detail(id).
//  - src/hooks/blog/useBlogTan.js — one like invalidated ALL blog
//    lists, details, categories, popular and featured queries.
//  - src/hooks/profile/useAddressTan.js — invalidating ["address"]
//    prefix-matched EVERY cached address detail (all ids, all users).
//
// Fix contract:
//  - Mutations invalidate the narrowest keys that actually changed:
//    the list prefix ([...all, "list"] — every list-param variant,
//    nothing else) + the mutated entity's detail + the specific
//    derived views that genuinely display the mutated entity on the
//    same screen (announcement stats on the Announcements page;
//    discount `applied` per FE-08; category tree; product
//    featured/newArrivals lists; promotion analytics on send).
//    Sibling details and unrelated domains are NEVER invalidated.
//  - Blog like: the server returns the authoritative count
//    ({ data: { likes } }), so the hook patches the affected post
//    in every cached blog surface via setQueriesData and invalidates
//    NOTHING; only when the response carries no usable count does
//    it fall back to invalidating detail + list prefix (never
//    categories/popular/featured).
//  - Address mutations invalidate the caller's list + ONLY the
//    mutated address's detail (delete removes that detail entry);
//    sibling details and other users' details are untouched.
//  - FE-08 identity scoping is preserved exactly: adminScope is
//    mocked to a fixed id here (FE-08's own suite pins the real
//    scoping); every factory key shape is used unchanged.
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../src/lib/adminScope.js", () => ({
  adminScope: () => "admin-1",
  scopedAdminKey: (resource) => [resource, "admin-1"],
}));

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn().mockRejectedValue(new Error("401")),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/api/announcementApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    publish: vi.fn(),
    schedule: vi.fn(),
    archive: vi.fn(),
    getStats: vi.fn(),
    getPublic: vi.fn(),
    getPublicById: vi.fn(),
  },
}));
vi.mock("../../src/api/contactApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    markAsRead: vi.fn(),
    respond: vi.fn(),
    delete: vi.fn(),
    bulkUpdate: vi.fn(),
    getStats: vi.fn(),
    submit: vi.fn(),
  },
}));
vi.mock("../../src/api/discountApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    apply: vi.fn(),
    validate: vi.fn(),
    preview: vi.fn(),
  },
}));
vi.mock("../../src/api/promotionApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    send: vi.fn(),
    schedule: vi.fn(),
    cancel: vi.fn(),
    getAnalytics: vi.fn(),
    preview: vi.fn(),
    trackEngagement: vi.fn(),
  },
}));
vi.mock("../../src/api/userApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    resetPassword: vi.fn(),
  },
}));
vi.mock("../../src/api/categoryApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getTree: vi.fn(),
    getById: vi.fn(),
    getProducts: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("../../src/api/productApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getFeatured: vi.fn(),
    getNewArrivals: vi.fn(),
    getRelated: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    hardDelete: vi.fn(),
    setPrimaryImage: vi.fn(),
    updateStock: vi.fn(),
  },
}));
vi.mock("../../src/api/blogApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getCategories: vi.fn(),
    getPopular: vi.fn(),
    getFeatured: vi.fn(),
    getRelated: vi.fn(),
    toggleLike: vi.fn(),
    getSources: vi.fn(),
    getStats: vi.fn(),
  },
}));
vi.mock("../../src/api/addressApi.js", () => ({
  getAllAddresses: vi.fn(),
  getAddress: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  setDefaultAddress: vi.fn(),
}));

import announcementApi from "../../src/api/announcementApi.js";
import contactApi from "../../src/api/contactApi.js";
import discountApi from "../../src/api/discountApi.js";
import promotionApi from "../../src/api/promotionApi.js";
import userApi from "../../src/api/userApi.js";
import categoryApi from "../../src/api/categoryApi.js";
import productApi from "../../src/api/productApi.js";
import blogApi from "../../src/api/blogApi.js";
import * as addressApi from "../../src/api/addressApi.js";
import useAuthStore from "../../src/store/authStore.js";

import {
  ANNOUNCEMENT_KEYS,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "../../src/hooks/admin/useAnnouncementTan.js";
import {
  CONTACT_KEYS,
  useUpdateContact,
  useMarkAsRead,
  useDeleteContact,
  useBulkUpdateContacts,
} from "../../src/hooks/admin/useContactTan.js";
import {
  DISCOUNT_KEYS,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
} from "../../src/hooks/admin/useDiscountTan.js";
import {
  PROMOTION_KEYS,
  useCreatePromotion,
  useUpdatePromotion,
  useSendPromotion,
} from "../../src/hooks/admin/usePromotionTan.js";
import {
  USER_KEYS,
  useUpdateUserStatus,
  useDeleteUser,
} from "../../src/hooks/admin/useUserTan.js";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../src/hooks/product/useCategoryTan.js";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateStock,
  useSetPrimaryImage,
} from "../../src/hooks/product/useProductTan.js";
import { useToggleBlogLike } from "../../src/hooks/blog/useBlogTan.js";
import {
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "../../src/hooks/profile/useAddressTan.js";

// Category / Product / Blog key factories are module-private; the
// literals below are copied from their definitions in source.
const CATEGORY_KEYS = {
  all: ["categories"],
  list: (params) => ["categories", "list", params],
  tree: () => ["categories", "tree"],
  detail: (id) => ["categories", "detail", id],
  products: (id, params) => ["categories", "products", id, params],
};
const PRODUCT_KEYS = {
  all: ["products"],
  list: (params) => ["products", "list", params],
  detail: (id) => ["products", "detail", id],
  featured: (limit) => ["products", "featured", limit],
  newArrivals: (limit) => ["products", "newArrivals", limit],
  related: (id, limit) => ["products", "related", id, limit],
};
const BLOG_KEYS = {
  all: ["blogs"],
  list: (params) => ["blogs", "list", params],
  detail: (id) => ["blogs", "detail", id],
  categories: () => ["blogs", "categories"],
  popular: (limit) => ["blogs", "popular", limit],
  featured: (limit) => ["blogs", "featured", limit],
  related: (id, limit) => ["blogs", "related", id, limit],
};

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapperFor(client) {
  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

function seed(client, entries) {
  for (const [key, data] of entries) client.setQueryData(key, data);
}

const invalidated = (client, key) =>
  client.getQueryState(key)?.isInvalidated === true;
const notInvalidated = (client, key) =>
  client.getQueryState(key)?.isInvalidated === false;

async function runMutation(client, useHook, arg) {
  const { result } = renderHook(() => useHook(), {
    wrapper: wrapperFor(client),
  });
  await act(async () => {
    await result.current.mutateAsync(arg);
  });
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const api of [
    announcementApi,
    contactApi,
    discountApi,
    promotionApi,
    userApi,
    categoryApi,
    productApi,
    blogApi,
  ]) {
    for (const fn of Object.values(api)) fn.mockResolvedValue({});
  }
  for (const fn of Object.values(addressApi))
    fn.mockResolvedValue({ data: {} });
  blogApi.toggleLike.mockResolvedValue({
    status: "success",
    data: { likes: 8 },
  });
  useAuthStore.setState({
    user: { _id: "user-1" },
    isAuthenticated: true,
    loading: false,
  });
});

describe("FE-55 announcements: narrow invalidation", () => {
  function seededClient() {
    const client = makeClient();
    seed(client, [
      [ANNOUNCEMENT_KEYS.list({ page: 1 }), { data: { announcements: [] } }],
      [ANNOUNCEMENT_KEYS.detail("ann-1"), { data: {} }],
      [ANNOUNCEMENT_KEYS.detail("ann-2"), { data: {} }],
      [ANNOUNCEMENT_KEYS.stats(), { data: {} }],
      [ANNOUNCEMENT_KEYS.public({ page: 1 }), { data: {} }],
      [USER_KEYS.list({ page: 1 }), { data: {} }],
      [CONTACT_KEYS.list({ page: 1 }), { data: {} }],
    ]);
    return client;
  }

  it("update invalidates list + its detail + stats, NOT sibling details, public or other domains", async () => {
    const client = seededClient();
    await runMutation(client, useUpdateAnnouncement, {
      id: "ann-1",
      data: { title: "New" },
    });
    expect(invalidated(client, ANNOUNCEMENT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, ANNOUNCEMENT_KEYS.detail("ann-1"))).toBe(true);
    // Stats cards sit on the same admin screen and count by status.
    expect(invalidated(client, ANNOUNCEMENT_KEYS.stats())).toBe(true);
    expect(notInvalidated(client, ANNOUNCEMENT_KEYS.detail("ann-2"))).toBe(
      true,
    );
    expect(notInvalidated(client, ANNOUNCEMENT_KEYS.public({ page: 1 }))).toBe(
      true,
    );
    expect(notInvalidated(client, USER_KEYS.list({ page: 1 }))).toBe(true);
    expect(notInvalidated(client, CONTACT_KEYS.list({ page: 1 }))).toBe(true);
  });

  it("create invalidates list + stats only (no detail exists yet)", async () => {
    const client = seededClient();
    await runMutation(client, useCreateAnnouncement, { title: "Hi" });
    expect(invalidated(client, ANNOUNCEMENT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, ANNOUNCEMENT_KEYS.stats())).toBe(true);
    expect(notInvalidated(client, ANNOUNCEMENT_KEYS.detail("ann-1"))).toBe(
      true,
    );
    expect(notInvalidated(client, ANNOUNCEMENT_KEYS.public({ page: 1 }))).toBe(
      true,
    );
  });

  it("delete invalidates list + stats, NOT sibling details", async () => {
    const client = seededClient();
    await runMutation(client, useDeleteAnnouncement, "ann-1");
    expect(invalidated(client, ANNOUNCEMENT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, ANNOUNCEMENT_KEYS.stats())).toBe(true);
    expect(notInvalidated(client, ANNOUNCEMENT_KEYS.detail("ann-2"))).toBe(
      true,
    );
  });
});

describe("FE-55 contacts: narrow invalidation", () => {
  function seededClient() {
    const client = makeClient();
    seed(client, [
      [CONTACT_KEYS.list({ page: 1 }), { data: {} }],
      [CONTACT_KEYS.detail("c-1"), { data: {} }],
      [CONTACT_KEYS.detail("c-2"), { data: {} }],
      [CONTACT_KEYS.detail("c-3"), { data: {} }],
      [CONTACT_KEYS.stats(), { data: {} }],
      [ANNOUNCEMENT_KEYS.list({ page: 1 }), { data: {} }],
    ]);
    return client;
  }

  it("update invalidates list + its detail only", async () => {
    const client = seededClient();
    await runMutation(client, useUpdateContact, { id: "c-1", data: {} });
    expect(invalidated(client, CONTACT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, CONTACT_KEYS.detail("c-1"))).toBe(true);
    expect(notInvalidated(client, CONTACT_KEYS.detail("c-2"))).toBe(true);
    // No page consumes contact stats (grep: hook defined, never used).
    expect(notInvalidated(client, CONTACT_KEYS.stats())).toBe(true);
    expect(notInvalidated(client, ANNOUNCEMENT_KEYS.list({ page: 1 }))).toBe(
      true,
    );
  });

  it("markAsRead invalidates list + that contact's detail only", async () => {
    const client = seededClient();
    await runMutation(client, useMarkAsRead, { id: "c-1", isRead: true });
    expect(invalidated(client, CONTACT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, CONTACT_KEYS.detail("c-1"))).toBe(true);
    expect(notInvalidated(client, CONTACT_KEYS.detail("c-2"))).toBe(true);
  });

  it("delete invalidates the list only", async () => {
    const client = seededClient();
    await runMutation(client, useDeleteContact, "c-1");
    expect(invalidated(client, CONTACT_KEYS.list({ page: 1 }))).toBe(true);
    expect(notInvalidated(client, CONTACT_KEYS.detail("c-2"))).toBe(true);
    expect(notInvalidated(client, CONTACT_KEYS.stats())).toBe(true);
  });

  it("bulk update invalidates the list + each affected detail, no others", async () => {
    const client = seededClient();
    await runMutation(client, useBulkUpdateContacts, {
      ids: ["c-1", "c-2"],
      isRead: true,
    });
    expect(invalidated(client, CONTACT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, CONTACT_KEYS.detail("c-1"))).toBe(true);
    expect(invalidated(client, CONTACT_KEYS.detail("c-2"))).toBe(true);
    expect(notInvalidated(client, CONTACT_KEYS.detail("c-3"))).toBe(true);
  });
});

describe("FE-55 discounts: narrow invalidation, FE-08 applied preserved", () => {
  function seededClient() {
    const client = makeClient();
    seed(client, [
      [DISCOUNT_KEYS.list({ page: 1 }), { data: {} }],
      [DISCOUNT_KEYS.detail("d-1"), { data: {} }],
      [DISCOUNT_KEYS.detail("d-2"), { data: {} }],
      [DISCOUNT_KEYS.applied(), { code: "SAVE10" }],
      [DISCOUNT_KEYS.validate("SAVE10"), { data: {} }],
    ]);
    return client;
  }

  it("update invalidates list + detail + applied, NOT sibling detail or validate cache", async () => {
    const client = seededClient();
    await runMutation(client, useUpdateDiscount, { id: "d-1", data: {} });
    expect(invalidated(client, DISCOUNT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, DISCOUNT_KEYS.detail("d-1"))).toBe(true);
    expect(invalidated(client, DISCOUNT_KEYS.applied())).toBe(true);
    expect(notInvalidated(client, DISCOUNT_KEYS.detail("d-2"))).toBe(true);
    expect(notInvalidated(client, DISCOUNT_KEYS.validate("SAVE10"))).toBe(true);
  });

  it("delete invalidates list + applied (FE-08), NOT sibling detail or validate cache", async () => {
    const client = seededClient();
    await runMutation(client, useDeleteDiscount, "d-1");
    expect(invalidated(client, DISCOUNT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, DISCOUNT_KEYS.applied())).toBe(true);
    expect(notInvalidated(client, DISCOUNT_KEYS.detail("d-2"))).toBe(true);
    expect(notInvalidated(client, DISCOUNT_KEYS.validate("SAVE10"))).toBe(true);
  });

  it("create invalidates the list only", async () => {
    const client = seededClient();
    await runMutation(client, useCreateDiscount, { code: "NEW10" });
    expect(invalidated(client, DISCOUNT_KEYS.list({ page: 1 }))).toBe(true);
    expect(notInvalidated(client, DISCOUNT_KEYS.detail("d-1"))).toBe(true);
    expect(notInvalidated(client, DISCOUNT_KEYS.applied())).toBe(true);
  });
});

describe("FE-55 promotions: narrow invalidation", () => {
  function seededClient() {
    const client = makeClient();
    seed(client, [
      [PROMOTION_KEYS.list({ page: 1 }), { data: {} }],
      [PROMOTION_KEYS.detail("p-1"), { data: {} }],
      [PROMOTION_KEYS.detail("p-2"), { data: {} }],
      [PROMOTION_KEYS.analytics("p-1"), { data: {} }],
    ]);
    return client;
  }

  it("update invalidates list + detail, NOT analytics or sibling detail", async () => {
    const client = seededClient();
    await runMutation(client, useUpdatePromotion, { id: "p-1", data: {} });
    expect(invalidated(client, PROMOTION_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, PROMOTION_KEYS.detail("p-1"))).toBe(true);
    expect(notInvalidated(client, PROMOTION_KEYS.analytics("p-1"))).toBe(true);
    expect(notInvalidated(client, PROMOTION_KEYS.detail("p-2"))).toBe(true);
  });

  it("send invalidates list + detail + that promotion's analytics", async () => {
    const client = seededClient();
    await runMutation(client, useSendPromotion, "p-1");
    expect(invalidated(client, PROMOTION_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, PROMOTION_KEYS.detail("p-1"))).toBe(true);
    expect(invalidated(client, PROMOTION_KEYS.analytics("p-1"))).toBe(true);
    expect(notInvalidated(client, PROMOTION_KEYS.detail("p-2"))).toBe(true);
  });

  it("create invalidates the list only", async () => {
    const client = seededClient();
    await runMutation(client, useCreatePromotion, { title: "Sale" });
    expect(invalidated(client, PROMOTION_KEYS.list({ page: 1 }))).toBe(true);
    expect(notInvalidated(client, PROMOTION_KEYS.detail("p-1"))).toBe(true);
    expect(notInvalidated(client, PROMOTION_KEYS.analytics("p-1"))).toBe(true);
  });
});

describe("FE-55 users: narrow invalidation", () => {
  function seededClient() {
    const client = makeClient();
    seed(client, [
      [USER_KEYS.list({ page: 1 }), { data: {} }],
      [USER_KEYS.detail("u-1"), { data: {} }],
      [USER_KEYS.detail("u-2"), { data: {} }],
    ]);
    return client;
  }

  it("updateStatus invalidates list + its detail, NOT sibling detail", async () => {
    const client = seededClient();
    await runMutation(client, useUpdateUserStatus, {
      id: "u-1",
      isActive: false,
    });
    expect(invalidated(client, USER_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, USER_KEYS.detail("u-1"))).toBe(true);
    expect(notInvalidated(client, USER_KEYS.detail("u-2"))).toBe(true);
  });

  it("delete invalidates the list only", async () => {
    const client = seededClient();
    await runMutation(client, useDeleteUser, "u-1");
    expect(invalidated(client, USER_KEYS.list({ page: 1 }))).toBe(true);
    expect(notInvalidated(client, USER_KEYS.detail("u-2"))).toBe(true);
  });
});

describe("FE-55 categories: narrow invalidation", () => {
  function seededClient() {
    const client = makeClient();
    seed(client, [
      [CATEGORY_KEYS.list({ page: 1 }), { data: {} }],
      [CATEGORY_KEYS.tree(), { data: {} }],
      [CATEGORY_KEYS.detail("cat-1"), { data: {} }],
      [CATEGORY_KEYS.detail("cat-2"), { data: {} }],
      [CATEGORY_KEYS.products("cat-1", {}), { data: {} }],
    ]);
    return client;
  }

  it("update invalidates list + tree + its detail, NOT sibling detail or product lists", async () => {
    const client = seededClient();
    await runMutation(client, useUpdateCategory, { id: "cat-1", data: {} });
    expect(invalidated(client, CATEGORY_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, CATEGORY_KEYS.tree())).toBe(true);
    expect(invalidated(client, CATEGORY_KEYS.detail("cat-1"))).toBe(true);
    expect(notInvalidated(client, CATEGORY_KEYS.detail("cat-2"))).toBe(true);
    expect(notInvalidated(client, CATEGORY_KEYS.products("cat-1", {}))).toBe(
      true,
    );
  });

  it("create invalidates list + tree only", async () => {
    const client = seededClient();
    await runMutation(client, useCreateCategory, { name: "New" });
    expect(invalidated(client, CATEGORY_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, CATEGORY_KEYS.tree())).toBe(true);
    expect(notInvalidated(client, CATEGORY_KEYS.detail("cat-1"))).toBe(true);
  });

  it("delete invalidates list + tree, NOT sibling details", async () => {
    const client = seededClient();
    await runMutation(client, useDeleteCategory, "cat-1");
    expect(invalidated(client, CATEGORY_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, CATEGORY_KEYS.tree())).toBe(true);
    expect(notInvalidated(client, CATEGORY_KEYS.detail("cat-2"))).toBe(true);
  });
});

describe("FE-55 products: narrow invalidation", () => {
  function seededClient() {
    const client = makeClient();
    seed(client, [
      [PRODUCT_KEYS.list({ page: 1 }), { data: {} }],
      [PRODUCT_KEYS.detail("prod-1"), { data: {} }],
      [PRODUCT_KEYS.detail("prod-2"), { data: {} }],
      [PRODUCT_KEYS.featured(8), { data: {} }],
      [PRODUCT_KEYS.newArrivals(8), { data: {} }],
      [PRODUCT_KEYS.related("prod-2", 4), { data: {} }],
    ]);
    return client;
  }

  it("update invalidates list + detail + featured/newArrivals, NOT sibling detail or related", async () => {
    const client = seededClient();
    await runMutation(client, useUpdateProduct, { id: "prod-1", data: {} });
    expect(invalidated(client, PRODUCT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.detail("prod-1"))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.featured(8))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.newArrivals(8))).toBe(true);
    expect(notInvalidated(client, PRODUCT_KEYS.detail("prod-2"))).toBe(true);
    expect(notInvalidated(client, PRODUCT_KEYS.related("prod-2", 4))).toBe(
      true,
    );
  });

  it("create invalidates list + featured/newArrivals, NOT details", async () => {
    const client = seededClient();
    await runMutation(client, useCreateProduct, { name: "New" });
    expect(invalidated(client, PRODUCT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.featured(8))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.newArrivals(8))).toBe(true);
    expect(notInvalidated(client, PRODUCT_KEYS.detail("prod-1"))).toBe(true);
  });

  it("delete invalidates list + featured/newArrivals, NOT sibling detail", async () => {
    const client = seededClient();
    await runMutation(client, useDeleteProduct, "prod-1");
    expect(invalidated(client, PRODUCT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.featured(8))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.newArrivals(8))).toBe(true);
    expect(notInvalidated(client, PRODUCT_KEYS.detail("prod-2"))).toBe(true);
  });

  it("updateStock invalidates list + detail only (stock shows on list + detail)", async () => {
    const client = seededClient();
    await runMutation(client, useUpdateStock, { id: "prod-1", stock: 4 });
    expect(invalidated(client, PRODUCT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.detail("prod-1"))).toBe(true);
    expect(notInvalidated(client, PRODUCT_KEYS.featured(8))).toBe(true);
    expect(notInvalidated(client, PRODUCT_KEYS.detail("prod-2"))).toBe(true);
  });

  it("setPrimaryImage invalidates list + detail + featured/newArrivals (thumbnails everywhere), NOT sibling detail", async () => {
    const client = seededClient();
    await runMutation(client, useSetPrimaryImage, {
      productId: "prod-1",
      imageId: "img-9",
    });
    expect(invalidated(client, PRODUCT_KEYS.list({ page: 1 }))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.detail("prod-1"))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.featured(8))).toBe(true);
    expect(invalidated(client, PRODUCT_KEYS.newArrivals(8))).toBe(true);
    expect(notInvalidated(client, PRODUCT_KEYS.detail("prod-2"))).toBe(true);
  });
});

describe("FE-55 blog like: direct cache update, no domain invalidation", () => {
  function seededClient() {
    const client = makeClient();
    seed(client, [
      [
        BLOG_KEYS.detail("post-1"),
        {
          status: "success",
          data: { blog: { _id: "post-1", slug: "post-one", likes: 7 } },
        },
      ],
      [
        BLOG_KEYS.list({ page: 1 }),
        {
          status: "success",
          data: {
            blogs: [
              { _id: "post-1", likes: 7 },
              { _id: "post-2", likes: 3 },
            ],
            pagination: { page: 1, pages: 1 },
          },
        },
      ],
      [
        BLOG_KEYS.popular(5),
        { status: "success", data: { blogs: [{ _id: "post-1", likes: 7 }] } },
      ],
      [
        BLOG_KEYS.featured(3),
        { status: "success", data: { blogs: [{ _id: "post-2", likes: 3 }] } },
      ],
      [
        BLOG_KEYS.categories(),
        {
          status: "success",
          data: { categories: [{ slug: "design", count: 2 }] },
        },
      ],
      [
        BLOG_KEYS.related("post-9", 3),
        { status: "success", data: { blogs: [{ _id: "post-1", likes: 7 }] } },
      ],
    ]);
    return client;
  }

  it("a like patches the post's count in detail/list/popular/related caches and invalidates NOTHING", async () => {
    const client = seededClient();
    await runMutation(client, useToggleBlogLike, "post-1");

    expect(
      client.getQueryData(BLOG_KEYS.detail("post-1")).data.blog.likes,
    ).toBe(8);
    const list = client.getQueryData(BLOG_KEYS.list({ page: 1 }));
    expect(list.data.blogs.find((b) => b._id === "post-1").likes).toBe(8);
    expect(list.data.blogs.find((b) => b._id === "post-2").likes).toBe(3);
    expect(client.getQueryData(BLOG_KEYS.popular(5)).data.blogs[0].likes).toBe(
      8,
    );
    expect(
      client.getQueryData(BLOG_KEYS.related("post-9", 3)).data.blogs[0].likes,
    ).toBe(8);

    for (const key of [
      BLOG_KEYS.detail("post-1"),
      BLOG_KEYS.list({ page: 1 }),
      BLOG_KEYS.popular(5),
      BLOG_KEYS.featured(3),
      BLOG_KEYS.categories(),
      BLOG_KEYS.related("post-9", 3),
    ]) {
      expect(notInvalidated(client, key), JSON.stringify(key)).toBe(true);
    }
    // Untouched surfaces keep their exact data.
    expect(client.getQueryData(BLOG_KEYS.categories())).toEqual({
      status: "success",
      data: { categories: [{ slug: "design", count: 2 }] },
    });
    expect(client.getQueryData(BLOG_KEYS.featured(3)).data.blogs[0].likes).toBe(
      3,
    );
  });

  it("pen: liking a different post leaves the first post's cached counts untouched", async () => {
    const client = seededClient();
    blogApi.toggleLike.mockResolvedValue({
      status: "success",
      data: { likes: 4 },
    });
    await runMutation(client, useToggleBlogLike, "post-2");
    const list = client.getQueryData(BLOG_KEYS.list({ page: 1 }));
    expect(list.data.blogs.find((b) => b._id === "post-2").likes).toBe(4);
    expect(list.data.blogs.find((b) => b._id === "post-1").likes).toBe(7);
    expect(
      client.getQueryData(BLOG_KEYS.detail("post-1")).data.blog.likes,
    ).toBe(7);
    expect(client.getQueryData(BLOG_KEYS.featured(3)).data.blogs[0].likes).toBe(
      4,
    );
  });

  it("fallback: a response without a usable count invalidates ONLY detail + list, never categories/popular/featured", async () => {
    const client = seededClient();
    blogApi.toggleLike.mockResolvedValue({ status: "success", data: {} });
    await runMutation(client, useToggleBlogLike, "post-1");
    expect(invalidated(client, BLOG_KEYS.detail("post-1"))).toBe(true);
    expect(invalidated(client, BLOG_KEYS.list({ page: 1 }))).toBe(true);
    expect(notInvalidated(client, BLOG_KEYS.categories())).toBe(true);
    expect(notInvalidated(client, BLOG_KEYS.popular(5))).toBe(true);
    expect(notInvalidated(client, BLOG_KEYS.featured(3))).toBe(true);
  });
});

describe("FE-55 addresses: per-address invalidation", () => {
  const LIST_KEY = ["addresses", "user-1"];
  const DETAIL_1 = ["address", "addr-1", "user-1"];
  const DETAIL_2 = ["address", "addr-2", "user-1"];
  const DETAIL_OTHER_USER = ["address", "addr-1", "user-2"];

  function seededClient() {
    const client = makeClient();
    seed(client, [
      [LIST_KEY, [{ _id: "addr-1" }, { _id: "addr-2" }]],
      [DETAIL_1, { data: { _id: "addr-1" } }],
      [DETAIL_2, { data: { _id: "addr-2" } }],
      [DETAIL_OTHER_USER, { data: { _id: "addr-1" } }],
    ]);
    return client;
  }

  it("update invalidates the list + ONLY that address's detail", async () => {
    const client = seededClient();
    await runMutation(client, useUpdateAddress, {
      id: "addr-1",
      data: { city: "Pokhara" },
    });
    expect(invalidated(client, LIST_KEY)).toBe(true);
    expect(invalidated(client, DETAIL_1)).toBe(true);
    expect(notInvalidated(client, DETAIL_2)).toBe(true);
    expect(notInvalidated(client, DETAIL_OTHER_USER)).toBe(true);
  });

  it("create invalidates the list only — no address detail is touched", async () => {
    const client = seededClient();
    await runMutation(client, useCreateAddress, { city: "Pokhara" });
    expect(invalidated(client, LIST_KEY)).toBe(true);
    expect(notInvalidated(client, DETAIL_1)).toBe(true);
    expect(notInvalidated(client, DETAIL_2)).toBe(true);
  });

  it("delete invalidates the list, removes ONLY that detail entry, siblings untouched", async () => {
    const client = seededClient();
    await runMutation(client, useDeleteAddress, "addr-1");
    expect(invalidated(client, LIST_KEY)).toBe(true);
    expect(client.getQueryState(DETAIL_1)).toBeUndefined();
    expect(notInvalidated(client, DETAIL_2)).toBe(true);
    expect(notInvalidated(client, DETAIL_OTHER_USER)).toBe(true);
  });

  it("setDefault invalidates the list + ONLY the newly-default address's detail", async () => {
    const client = seededClient();
    await runMutation(client, useSetDefaultAddress, "addr-2");
    expect(invalidated(client, LIST_KEY)).toBe(true);
    expect(invalidated(client, DETAIL_2)).toBe(true);
    expect(notInvalidated(client, DETAIL_1)).toBe(true);
  });
});
