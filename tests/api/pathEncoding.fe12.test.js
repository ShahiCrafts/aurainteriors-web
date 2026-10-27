// FE-12 — path parameters were interpolated into request URLs raw
// across src/api/*.js (domain modules; src/api/index.js itself builds
// no resource paths — its only interpolation is the Authorization
// header — and is cleared below by the source scan).
//
// A value containing '/', '?', '#', '%' or '..' silently reshaped the
// route (extra segment, split query, fragment truncation, traversal).
// Every interpolated PATH segment must go through encodeURIComponent;
// axios `params` objects and URLSearchParams-built query strings are
// encoded by construction and are cleared, not rewritten.
//
// Pen-test values:
//   HOSTILE   'a/b?x=1#y'  → 'a%2Fb%3Fx%3D1%23y' — exactly ONE segment
//   TRAVERSAL '../admin'  → '..%2Fadmin' — cannot climb out
//   PERCENT   '100%'       → '100%25' — no double-decode smuggling
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/utils/guestSessionStorage.js", () => ({
  getGuestSessionId: vi.fn(() => null),
}));

import api from "../../src/api/index.js";
import * as addressApi from "../../src/api/addressApi.js";
import announcementApi from "../../src/api/announcementApi.js";
import blogApi from "../../src/api/blogApi.js";
import cartApi from "../../src/api/cartApi.js";
import categoryApi from "../../src/api/categoryApi.js";
import * as chatApi from "../../src/api/chatApi.js";
import contactApi from "../../src/api/contactApi.js";
import discountApi from "../../src/api/discountApi.js";
import * as documentApi from "../../src/api/documentApi.js";
import { getJob } from "../../src/api/jobApi.js";
import notificationApi from "../../src/api/notificationApi.js";
import orderApi from "../../src/api/orderApi.js";
import productApi from "../../src/api/productApi.js";
import promotionApi from "../../src/api/promotionApi.js";
import reviewApi from "../../src/api/reviewApi.js";
import { userApi } from "../../src/api/userApi.js";
import wishlistApi from "../../src/api/wishlistApi.js";

const HOSTILE = "a/b?x=1#y";
const HOSTILE_ENC = "a%2Fb%3Fx%3D1%23y";

beforeEach(() => {
  vi.clearAllMocks();
  const ok = { data: {} };
  api.get.mockResolvedValue(ok);
  api.post.mockResolvedValue(ok);
  api.patch.mockResolvedValue(ok);
  api.put.mockResolvedValue(ok);
  api.delete.mockResolvedValue(ok);
});

// Invoke fn, then return the URL the mocked axios instance received.
async function urlOf(fn) {
  await fn();
  const calls = [
    ...api.get.mock.calls,
    ...api.post.mock.calls,
    ...api.patch.mock.calls,
    ...api.put.mock.calls,
    ...api.delete.mock.calls,
  ];
  expect(calls).toHaveLength(1);
  return calls[0][0];
}

describe("FE-12 — domain API modules encode every path segment", () => {
  it("addressApi", async () => {
    await expect(urlOf(() => addressApi.getAddress(HOSTILE))).resolves.toBe(`/addresses/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.patch.mockResolvedValue({ data: {} });
    await expect(urlOf(() => addressApi.updateAddress(HOSTILE, {}))).resolves.toBe(`/addresses/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.delete.mockResolvedValue({ data: {} });
    await expect(urlOf(() => addressApi.deleteAddress(HOSTILE))).resolves.toBe(`/addresses/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.patch.mockResolvedValue({ data: {} });
    await expect(urlOf(() => addressApi.setDefaultAddress(HOSTILE))).resolves.toBe(`/addresses/${HOSTILE_ENC}/set-default`);
  });

  it("announcementApi", async () => {
    await expect(urlOf(() => announcementApi.getById(HOSTILE))).resolves.toBe(`/announcements/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.post.mockResolvedValue({ data: {} });
    await expect(urlOf(() => announcementApi.publish(HOSTILE))).resolves.toBe(`/announcements/${HOSTILE_ENC}/publish`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => announcementApi.getPublicById(HOSTILE))).resolves.toBe(`/announcements/public/${HOSTILE_ENC}`);
  });

  it("blogApi", async () => {
    await expect(urlOf(() => blogApi.getById(HOSTILE))).resolves.toBe(`/blogs/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => blogApi.getRelated(HOSTILE))).resolves.toBe(`/blogs/${HOSTILE_ENC}/related`);
    vi.clearAllMocks(); api.post.mockResolvedValue({ data: {} });
    await expect(urlOf(() => blogApi.toggleLike(HOSTILE))).resolves.toBe(`/blogs/${HOSTILE_ENC}/like`);
  });

  it("cartApi", async () => {
    await expect(urlOf(() => cartApi.updateCartItem({ itemId: HOSTILE, quantity: 2 }))).resolves.toBe(`/cart/items/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.delete.mockResolvedValue({ data: {} });
    await expect(urlOf(() => cartApi.removeFromCart(HOSTILE))).resolves.toBe(`/cart/items/${HOSTILE_ENC}`);
  });

  it("categoryApi", async () => {
    await expect(urlOf(() => categoryApi.getById(HOSTILE))).resolves.toBe(`/categories/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => categoryApi.getProducts(HOSTILE))).resolves.toBe(`/categories/${HOSTILE_ENC}/products`);
    vi.clearAllMocks(); api.delete.mockResolvedValue({ data: {} });
    await expect(urlOf(() => categoryApi.delete(HOSTILE))).resolves.toBe(`/categories/${HOSTILE_ENC}`);
  });

  it("chatApi — single- and two-segment paths", async () => {
    await expect(urlOf(() => chatApi.getChatDetails(HOSTILE))).resolves.toBe(`/chats/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.post.mockResolvedValue({ data: {} });
    await expect(urlOf(() => chatApi.sendMessage({ chatId: HOSTILE, content: "hi" }))).resolves.toBe(`/chats/${HOSTILE_ENC}/messages`);
    vi.clearAllMocks(); api.patch.mockResolvedValue({ data: {} });
    await expect(
      urlOf(() => chatApi.updateMessageAttachments(HOSTILE, "m/n?o", []))
    ).resolves.toBe(`/chats/${HOSTILE_ENC}/messages/m%2Fn%3Fo/attachments`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    const messagesUrl = await urlOf(() => chatApi.getChatMessages({ chatId: HOSTILE, page: 1, limit: 5 }));
    expect(messagesUrl.startsWith(`/chats/${HOSTILE_ENC}/messages?`)).toBe(true);
    expect(messagesUrl).toContain("page=1");
  });

  it("contactApi", async () => {
    await expect(urlOf(() => contactApi.getById(HOSTILE))).resolves.toBe(`/contacts/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.post.mockResolvedValue({ data: {} });
    await expect(urlOf(() => contactApi.respond(HOSTILE, "hi"))).resolves.toBe(`/contacts/${HOSTILE_ENC}/respond`);
  });

  it("discountApi — including the validate CODE segment", async () => {
    await expect(urlOf(() => discountApi.getById(HOSTILE))).resolves.toBe(`/discounts/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => discountApi.validate("SAVE & MORE"))).resolves.toBe("/discounts/validate/SAVE%20%26%20MORE");
  });

  it("documentApi", async () => {
    await expect(urlOf(() => documentApi.deleteDocument(HOSTILE))).resolves.toBe(`/documents/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.post.mockResolvedValue({ data: {} });
    await expect(urlOf(() => documentApi.retryDocument(HOSTILE))).resolves.toBe(`/documents/${HOSTILE_ENC}/retry`);
  });

  it("jobApi", async () => {
    api.get.mockResolvedValue({ data: { data: { job: { id: "j", status: "completed" } } } });
    await expect(urlOf(() => getJob(HOSTILE))).resolves.toBe(`/jobs/${HOSTILE_ENC}`);
  });

  it("notificationApi — including the push-token deviceId segment", async () => {
    await expect(urlOf(() => notificationApi.getNotificationDetail(HOSTILE))).resolves.toBe(`/notifications/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.put.mockResolvedValue({ data: {} });
    await expect(urlOf(() => notificationApi.markAsRead(HOSTILE))).resolves.toBe(`/notifications/${HOSTILE_ENC}/read`);
    vi.clearAllMocks(); api.delete.mockResolvedValue({ data: {} });
    await expect(urlOf(() => notificationApi.unregisterDevice(HOSTILE))).resolves.toBe(`/notifications/push-tokens/${HOSTILE_ENC}`);
  });

  it("orderApi", async () => {
    await expect(urlOf(() => orderApi.getOrder(HOSTILE))).resolves.toBe(`/orders/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => orderApi.getOrderAdmin(HOSTILE))).resolves.toBe(`/orders/admin/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.patch.mockResolvedValue({ data: {} });
    await expect(urlOf(() => orderApi.updateOrderStatus(HOSTILE, {}))).resolves.toBe(`/orders/${HOSTILE_ENC}/status`);
    vi.clearAllMocks(); api.post.mockResolvedValue({ data: {} });
    await expect(urlOf(() => orderApi.requestReturn(HOSTILE, {}))).resolves.toBe(`/orders/${HOSTILE_ENC}/return`);
  });

  it("productApi", async () => {
    await expect(urlOf(() => productApi.getById(HOSTILE))).resolves.toBe(`/products/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => productApi.getRelated(HOSTILE))).resolves.toBe(`/products/${HOSTILE_ENC}/related`);
    vi.clearAllMocks(); api.delete.mockResolvedValue({ data: {} });
    await expect(urlOf(() => productApi.hardDelete(HOSTILE))).resolves.toBe(`/products/${HOSTILE_ENC}/permanent`);
    vi.clearAllMocks(); api.patch.mockResolvedValue({ data: {} });
    await expect(urlOf(() => productApi.updateStock(HOSTILE, 3))).resolves.toBe(`/products/${HOSTILE_ENC}/stock`);
  });

  it("promotionApi", async () => {
    await expect(urlOf(() => promotionApi.getById(HOSTILE))).resolves.toBe(`/promotions/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => promotionApi.getAnalytics(HOSTILE))).resolves.toBe(`/promotions/${HOSTILE_ENC}/analytics`);
  });

  it("reviewApi — two-segment product/review paths", async () => {
    await expect(urlOf(() => reviewApi.getProductReviews(HOSTILE))).resolves.toBe(`/products/${HOSTILE_ENC}/reviews`);
    vi.clearAllMocks(); api.patch.mockResolvedValue({ data: {} });
    await expect(
      urlOf(() => reviewApi.update(HOSTILE, "r/v?w", {}))
    ).resolves.toBe(`/products/${HOSTILE_ENC}/reviews/r%2Fv%3Fw`);
    vi.clearAllMocks(); api.post.mockResolvedValue({ data: {} });
    await expect(urlOf(() => reviewApi.addAdminResponse(HOSTILE, "ok"))).resolves.toBe(`/reviews/${HOSTILE_ENC}/response`);
    vi.clearAllMocks(); api.delete.mockResolvedValue({ data: {} });
    await expect(urlOf(() => reviewApi.adminDeleteReview(HOSTILE))).resolves.toBe(`/reviews/${HOSTILE_ENC}`);
  });

  it("userApi", async () => {
    await expect(urlOf(() => userApi.getById(HOSTILE))).resolves.toBe(`/users/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.patch.mockResolvedValue({ data: {} });
    await expect(urlOf(() => userApi.resetPassword(HOSTILE, "pw"))).resolves.toBe(`/users/${HOSTILE_ENC}/reset-password`);
  });

  it("wishlistApi", async () => {
    await expect(urlOf(() => wishlistApi.removeFromWishlist(HOSTILE))).resolves.toBe(`/wishlist/${HOSTILE_ENC}`);
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => wishlistApi.checkWishlist(HOSTILE))).resolves.toBe(`/wishlist/check/${HOSTILE_ENC}`);
  });

  it("pen: a traversal id cannot climb out of its segment", async () => {
    await expect(urlOf(() => productApi.getById("../admin"))).resolves.toBe("/products/..%2Fadmin");
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    const url = await urlOf(() => productApi.getById("../../users"));
    expect(url).toBe("/products/..%2F..%2Fusers");
    // Exactly the two real segments — no '..' segment survives.
    expect(url.split("/").filter(Boolean)).toEqual(["products", "..%2F..%2Fusers"]);
  });

  it("pen: a '%' in an id is itself encoded (no double-decode smuggling)", async () => {
    await expect(urlOf(() => productApi.getById("100%"))).resolves.toBe("/products/100%25");
    vi.clearAllMocks(); api.get.mockResolvedValue({ data: {} });
    await expect(urlOf(() => productApi.getById("%2e%2e%2fadmin"))).resolves.toBe("/products/%252e%252e%252fadmin");
  });

  it("pen: ordinary ObjectId-shaped ids pass through byte-identical", async () => {
    await expect(urlOf(() => productApi.getById("665f1c2ab3d4e5f60718293a"))).resolves.toBe(
      "/products/665f1c2ab3d4e5f60718293a"
    );
  });
});

describe("FE-12 — class guard: no raw path interpolation remains in src/api", () => {
  const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/api");

  it("every ${...} inside an api.* URL template is encodeURIComponent(...)", () => {
    const offenders = [];
    for (const name of readdirSync(apiDir)) {
      if (!name.endsWith(".js") || name === "index.js") continue;
      const source = readFileSync(path.join(apiDir, name), "utf8");
      for (const line of source.split("\n")) {
        if (!/api\.(get|post|patch|put|delete)\(/.test(line) || !line.includes("`")) continue;
        // Only the PATH portion (before any '?') is in scope. A query
        // tail interpolated after '?' in these modules is always a
        // URLSearchParams (chatApi / documentApi / notificationApi),
        // which encodes by construction — cleared, not rewritten.
        for (const tpl of line.matchAll(/`([^`]*)`/g)) {
          const pathPart = tpl[1].split("?")[0];
          if (!pathPart.startsWith("/")) continue;
          for (const m of pathPart.matchAll(/\$\{([^}]*)\}/g)) {
            if (!m[1].startsWith("encodeURIComponent(")) offenders.push(`${name}: ${line.trim()}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("src/api/index.js is cleared: it builds no resource path (only the auth header)", () => {
    const source = readFileSync(path.join(apiDir, "index.js"), "utf8");
    expect(source).not.toMatch(/api\.(get|post|patch|put|delete)\(\s*`?\//);
    expect(source).not.toMatch(/`\/[a-z-]+\/\$\{/);
  });
});
