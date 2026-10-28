import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/api/index", () => ({ default: { get: vi.fn() } }));
import api from "../../src/api/index";
import productApi from "../../src/api/productApi";
const id = "665f1c2ab3d4e5f60718293a";
const slug = "eka-nightstand-with-dual-drawers-mv46h18r";
const full = {
  data: { product: { _id: id, slug, description: "Full detail" } },
};
const rejected = (status) => ({ response: { status } });
beforeEach(() => api.get.mockReset());
describe("ID-only API compatibility for product slugs", () => {
  it("fetches full detail by a known cached ID without requesting the slug", async () => {
    api.get.mockResolvedValue({ data: full });
    expect(await productApi.getById(slug, { knownId: id })).toEqual(full);
    expect(api.get).toHaveBeenCalledWith(`/products/${id}`, {
      signal: undefined,
    });
    expect(api.get).toHaveBeenCalledOnce();
  });
  it.each([400, 404])(
    "resolves an exact slug after HTTP %s and fetches full detail",
    async (status) => {
      api.get
        .mockRejectedValueOnce(rejected(status))
        .mockResolvedValueOnce({
          data: {
            data: { products: [{ _id: id, slug }], pagination: { pages: 1 } },
          },
        })
        .mockResolvedValueOnce({ data: full });
      expect(await productApi.getById(slug)).toEqual(full);
      expect(api.get.mock.calls[2][0]).toBe(`/products/${id}`);
    },
  );
  it("preserves a slug-aware server response", async () => {
    api.get.mockResolvedValueOnce({ data: full });
    expect(await productApi.getById(slug)).toEqual(full);
    expect(api.get).toHaveBeenCalledOnce();
  });
  it("never substitutes a different product with a similar slug", async () => {
    api.get
      .mockRejectedValueOnce(rejected(400))
      .mockResolvedValueOnce({
        data: {
          data: {
            products: [{ _id: id, slug: "different" }],
            pagination: { pages: 1 },
          },
        },
      });
    await expect(productApi.getById(slug)).rejects.toHaveProperty(
      "response.status",
      404,
    );
  });
  it("checks subsequent catalogue pages", async () => {
    api.get
      .mockRejectedValueOnce(rejected(400))
      .mockResolvedValueOnce({
        data: {
          data: {
            products: [{ _id: id, slug: "other" }],
            pagination: { pages: 2 },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: { products: [{ _id: id, slug }], pagination: { pages: 2 } },
        },
      })
      .mockResolvedValueOnce({ data: full });
    expect(await productApi.getById(slug)).toEqual(full);
    expect(api.get.mock.calls[2][1].params.page).toBe(2);
  });
  it.each([401, 403, 429, 500])(
    "does not scan the catalogue on HTTP %s",
    async (status) => {
      api.get.mockRejectedValueOnce(rejected(status));
      await expect(productApi.getById(slug)).rejects.toHaveProperty(
        "response.status",
        status,
      );
      expect(api.get).toHaveBeenCalledOnce();
    },
  );
  it("does not scan for a missing ObjectId", async () => {
    api.get.mockRejectedValueOnce(rejected(404));
    await expect(productApi.getById(id)).rejects.toHaveProperty(
      "response.status",
      404,
    );
    expect(api.get).toHaveBeenCalledOnce();
  });
  it("passes cancellation through every fallback request", async () => {
    const signal = new AbortController().signal;
    api.get
      .mockRejectedValueOnce(rejected(400))
      .mockResolvedValueOnce({
        data: {
          data: { products: [{ _id: id, slug }], pagination: { pages: 1 } },
        },
      })
      .mockResolvedValueOnce({ data: full });
    await productApi.getById(slug, { signal });
    expect(
      api.get.mock.calls.every(([, config]) => config.signal === signal),
    ).toBe(true);
  });
});
