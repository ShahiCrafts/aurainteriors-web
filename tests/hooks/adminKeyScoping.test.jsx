// FE-08 — admin React Query keys must be scoped to the signed-in identity.
//
// Before the fix every admin key factory used a bare resource name
// (["users"], ["contacts"], …) with no identity segment, so on a shared
// browser admin B could be served admin A's cached users/contacts/
// analytics (gcTime 10 min). The applied-discount key ["discount",
// "applied"] was additionally disjoint from the ["discounts"] CRUD keys,
// so discount create/update/delete invalidations never touched it.
//
// These tests pin:
//  - every admin factory embeds the current user's id (read from the
//    auth store at call time, wishlist precedent) and differs between
//    two identities, with a stable "guest" fallback when signed out;
//  - public announcement keys stay identity-free (public data);
//  - the applied-discount key carries the user id and sits under the
//    ["discounts", <id>] prefix the CRUD mutations invalidate, so a
//    delete invalidates the applied entry too;
//  - the newsletter admin hooks query under scoped keys.

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../src/api/index.js", () => ({
  default: { get: vi.fn(), post: vi.fn() },
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

vi.mock("../../src/api/newsletterApi.js", () => ({
  subscribeNewsletter: vi.fn(),
  unsubscribeNewsletter: vi.fn(),
  getNewsletterSubscribers: vi.fn(),
  sendTrendEmail: vi.fn(),
  getNewsletterStats: vi.fn(),
}));

const adminA = { _id: "admin-a", firstName: "Asha", role: "admin" };
const adminB = { _id: "admin-b", firstName: "Bikash", role: "admin" };

// Fresh module registry per scenario (authStore runs initialize() at
// import time against the mocked api — same pattern as
// tests/store/authStore.test.js), then the hook modules of that same
// generation so their key factories read that generation's store.
async function importFresh() {
  vi.resetModules();
  const api = (await import("../../src/api/index.js")).default;
  api.get.mockRejectedValue(new Error("401 Unauthorized"));
  api.post.mockResolvedValue({});
  const authStore = (await import("../../src/store/authStore.js")).default;
  const queryClient = (await import("../../src/lib/queryClient.js"))
    .queryClient;
  const { USER_KEYS } = await import("../../src/hooks/admin/useUserTan.js");
  const { CONTACT_KEYS } = await import(
    "../../src/hooks/admin/useContactTan.js"
  );
  const { ANNOUNCEMENT_KEYS } = await import(
    "../../src/hooks/admin/useAnnouncementTan.js"
  );
  const { PROMOTION_KEYS } = await import(
    "../../src/hooks/admin/usePromotionTan.js"
  );
  const { ANALYTICS_KEYS } = await import(
    "../../src/hooks/admin/useAnalyticsTan.js"
  );
  const discount = await import("../../src/hooks/admin/useDiscountTan.js");
  const newsletterKeys = await import(
    "../../src/hooks/newsletter/useNewsletterTan.js"
  );
  return {
    authStore,
    queryClient,
    USER_KEYS,
    CONTACT_KEYS,
    ANNOUNCEMENT_KEYS,
    PROMOTION_KEYS,
    ANALYTICS_KEYS,
    DISCOUNT_KEYS: discount.DISCOUNT_KEYS,
    useDeleteDiscount: discount.useDeleteDiscount,
    NEWSLETTER_KEYS: newsletterKeys.NEWSLETTER_KEYS,
    useNewsletterSubscribers: newsletterKeys.useNewsletterSubscribers,
    useNewsletterStats: newsletterKeys.useNewsletterStats,
  };
}

// Every admin-scoped key a factory set can produce, as [label, keyFn].
function adminKeySet(m) {
  return [
    ["users.all", () => m.USER_KEYS.all()],
    ["users.list", () => m.USER_KEYS.list({ page: 1 })],
    ["users.detail", () => m.USER_KEYS.detail("u-9")],
    ["contacts.all", () => m.CONTACT_KEYS.all()],
    ["contacts.list", () => m.CONTACT_KEYS.list({ page: 1 })],
    ["contacts.detail", () => m.CONTACT_KEYS.detail("c-9")],
    ["contacts.stats", () => m.CONTACT_KEYS.stats()],
    ["announcements.all", () => m.ANNOUNCEMENT_KEYS.all()],
    ["announcements.list", () => m.ANNOUNCEMENT_KEYS.list({ page: 1 })],
    ["announcements.detail", () => m.ANNOUNCEMENT_KEYS.detail("a-9")],
    ["announcements.stats", () => m.ANNOUNCEMENT_KEYS.stats()],
    ["promotions.all", () => m.PROMOTION_KEYS.all()],
    ["promotions.list", () => m.PROMOTION_KEYS.list({ page: 1 })],
    ["promotions.detail", () => m.PROMOTION_KEYS.detail("p-9")],
    ["promotions.analytics", () => m.PROMOTION_KEYS.analytics("p-9")],
    ["analytics.all", () => m.ANALYTICS_KEYS.all()],
    ["analytics.stats", () => m.ANALYTICS_KEYS.stats()],
    ["analytics.revenue", () => m.ANALYTICS_KEYS.revenue(30)],
    ["analytics.categories", () => m.ANALYTICS_KEYS.categories()],
    ["analytics.topProducts", () => m.ANALYTICS_KEYS.topProducts()],
    ["analytics.salesReports", () => m.ANALYTICS_KEYS.salesReports("month")],
    ["discounts.all", () => m.DISCOUNT_KEYS.all()],
    ["discounts.list", () => m.DISCOUNT_KEYS.list({ page: 1 })],
    ["discounts.detail", () => m.DISCOUNT_KEYS.detail("d-9")],
    ["discounts.applied", () => m.DISCOUNT_KEYS.applied()],
    ["discounts.validate", () => m.DISCOUNT_KEYS.validate("SAVE10")],
    ["newsletter.all", () => m.NEWSLETTER_KEYS.all()],
    ["newsletter.subscribers", () => m.NEWSLETTER_KEYS.subscribers({ page: 1 })],
    ["newsletter.stats", () => m.NEWSLETTER_KEYS.stats()],
  ];
}

describe("FE-08 admin key factories", () => {
  it("embed the signed-in admin's id and differ between two admins", async () => {
    const m = await importFresh();
    await waitFor(() => expect(m.authStore.getState().loading).toBe(false));

    m.authStore.getState().signIn(adminA);
    const asA = adminKeySet(m).map(([label, fn]) => [label, fn()]);
    m.authStore.getState().signIn(adminB);
    const asB = adminKeySet(m).map(([label, fn]) => [label, fn()]);

    for (let i = 0; i < asA.length; i += 1) {
      const [label, keyA] = asA[i];
      const keyB = asB[i][1];
      expect(keyA, label).toContain("admin-a");
      expect(keyB, label).toContain("admin-b");
      expect(keyA, label).not.toEqual(keyB);
    }
  });

  it("fall back to a stable 'guest' segment when signed out", async () => {
    const m = await importFresh();
    await waitFor(() => expect(m.authStore.getState().loading).toBe(false));
    expect(m.authStore.getState().user).toBeNull();

    expect(m.USER_KEYS.all()).toEqual(["users", "guest"]);
    expect(m.DISCOUNT_KEYS.applied()).toEqual(["discounts", "guest", "applied"]);
    expect(m.NEWSLETTER_KEYS.stats()).toEqual(["newsletter", "guest", "stats"]);
  });

  it("keeps public announcement keys identity-free and stable across admins", async () => {
    const m = await importFresh();
    await waitFor(() => expect(m.authStore.getState().loading).toBe(false));

    m.authStore.getState().signIn(adminA);
    const pubA = m.ANNOUNCEMENT_KEYS.public({ page: 1 });
    const pubDetailA = m.ANNOUNCEMENT_KEYS.publicDetail("a-9");
    m.authStore.getState().signIn(adminB);

    expect(m.ANNOUNCEMENT_KEYS.public({ page: 1 })).toEqual(pubA);
    expect(m.ANNOUNCEMENT_KEYS.publicDetail("a-9")).toEqual(pubDetailA);
    expect(pubA).toEqual(["announcements", "public", { page: 1 }]);
    expect(pubDetailA).toEqual(["announcements", "public", "detail", "a-9"]);
  });

  it("applied-discount key carries the user id and sits under the invalidated discounts prefix", async () => {
    const m = await importFresh();
    await waitFor(() => expect(m.authStore.getState().loading).toBe(false));
    m.authStore.getState().signIn(adminA);

    const applied = m.DISCOUNT_KEYS.applied();
    const prefix = m.DISCOUNT_KEYS.all();
    expect(applied).toEqual(["discounts", "admin-a", "applied"]);
    expect(applied.slice(0, prefix.length)).toEqual(prefix);
  });
});

describe("FE-08 discount invalidation reaches the applied entry", () => {
  it("deleting a discount invalidates the applied entry for the same user", async () => {
    const m = await importFresh();
    await waitFor(() => expect(m.authStore.getState().loading).toBe(false));
    m.authStore.getState().signIn(adminA);

    const discountApi = (await import("../../src/api/discountApi.js"))
      .default;
    discountApi.delete.mockResolvedValue({});

    const client = m.queryClient;
    client.setQueryData(m.DISCOUNT_KEYS.applied(), { code: "SAVE10" });
    client.setQueryData(m.DISCOUNT_KEYS.list({}), { data: [] });
    expect(
      client.getQueryState(m.DISCOUNT_KEYS.applied()).isInvalidated,
    ).toBe(false);

    const wrapper = ({ children }) =>
      React.createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => m.useDeleteDiscount(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync("d-1");
    });

    expect(
      client.getQueryState(m.DISCOUNT_KEYS.applied()).isInvalidated,
    ).toBe(true);
    expect(client.getQueryState(m.DISCOUNT_KEYS.list({})).isInvalidated).toBe(
      true,
    );
  });
});

describe("FE-08 newsletter admin hooks", () => {
  it("query subscribers and stats under identity-scoped keys", async () => {
    const m = await importFresh();
    await waitFor(() => expect(m.authStore.getState().loading).toBe(false));
    m.authStore.getState().signIn(adminA);

    const newsletterApi = await import("../../src/api/newsletterApi.js");
    newsletterApi.getNewsletterSubscribers.mockResolvedValue({ data: [] });
    newsletterApi.getNewsletterStats.mockResolvedValue({ data: {} });

    const localClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }) =>
      React.createElement(QueryClientProvider, { client: localClient }, children);

    renderHook(() => m.useNewsletterSubscribers({ page: 1 }), { wrapper });
    renderHook(() => m.useNewsletterStats(), { wrapper });

    await waitFor(() => {
      expect(
        localClient.getQueryState(m.NEWSLETTER_KEYS.subscribers({ page: 1 }))
          ?.status,
      ).toBe("success");
      expect(
        localClient.getQueryState(m.NEWSLETTER_KEYS.stats())?.status,
      ).toBe("success");
    });
    const keys = localClient.getQueryCache().getAll().map((q) => q.queryKey);
    expect(keys).toContainEqual(["newsletter", "admin-a", "subscribers", { page: 1 }]);
    expect(keys).toContainEqual(["newsletter", "admin-a", "stats"]);
  });
});
