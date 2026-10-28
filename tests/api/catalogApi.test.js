// Phase 6 (catalog) — API-layer tests for the admin catalog surface.
//
// Server contracts (verified read-only in aurainteriors-server):
//   routes/catalog.routes.js — admin writes behind protect+restrictTo:
//     GET/POST       /catalog/attributes            (admin-only list)
//     GET/PATCH/DEL  /catalog/attributes/:key       (?hard=true on delete)
//     GET/POST       /catalog/product-types
//     GET/PATCH/DEL  /catalog/product-types/:key
//     GET/POST       /catalog/rooms
//     GET/PATCH/DEL  /catalog/rooms/:slug
//     GET/POST       /catalog/collections
//     GET/PATCH/DEL  /catalog/collections/:slug
//     GET            /catalog/categories/:ref/attributes  (public resolution)
//     GET            /catalog/product-types/:key/attributes (public resolution)
//   routes/category.routes.js (admin):
//     POST /categories/reorder { ids }
//     GET  /categories/:id/attributes  → own assignment list
//     PUT  /categories/:id/attributes  { assignments } (atomic replace)
//   routes/product.routes.js (admin):
//     GET/POST       /products/:id/variants
//     PATCH/DELETE   /products/:id/variants/:variantId
// Responses use the shared envelope { status, data: { ... } } and the
// api modules return response.data (the envelope) like every other
// module in src/api.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../../src/api/index.js";
import { catalogApi } from "../../src/api/catalogApi.js";
import { categoryApi } from "../../src/api/categoryApi.js";
import { productApi } from "../../src/api/productApi.js";

const ok = (data) => Promise.resolve({ data });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("catalogApi — attribute definitions", () => {
  it("lists definitions from the admin endpoint", async () => {
    api.get.mockReturnValue(
      ok({ status: "success", data: { attributeDefinitions: [] } }),
    );
    await catalogApi.listAttributeDefinitions();
    expect(api.get).toHaveBeenCalledWith("/catalog/attributes");
  });

  it("creates, updates and deletes by key; hard delete passes ?hard=true", async () => {
    api.post.mockReturnValue(ok({}));
    api.patch.mockReturnValue(ok({}));
    api.delete.mockReturnValue(ok({}));

    await catalogApi.createAttributeDefinition({
      key: "firmness",
      label: "Firmness",
      type: "enum",
    });
    expect(api.post).toHaveBeenCalledWith("/catalog/attributes", {
      key: "firmness",
      label: "Firmness",
      type: "enum",
    });

    await catalogApi.updateAttributeDefinition("firmness", {
      label: "Firmness Level",
    });
    expect(api.patch).toHaveBeenCalledWith("/catalog/attributes/firmness", {
      label: "Firmness Level",
    });

    await catalogApi.deleteAttributeDefinition("firmness");
    expect(api.delete).toHaveBeenCalledWith("/catalog/attributes/firmness", {
      params: {},
    });

    await catalogApi.deleteAttributeDefinition("firmness", { hard: true });
    expect(api.delete).toHaveBeenCalledWith("/catalog/attributes/firmness", {
      params: { hard: "true" },
    });
  });
});

describe("catalogApi — product types, rooms, collections", () => {
  it("uses key-addressed product type endpoints", async () => {
    api.get.mockReturnValue(ok({}));
    api.post.mockReturnValue(ok({}));
    api.patch.mockReturnValue(ok({}));
    api.delete.mockReturnValue(ok({}));

    await catalogApi.listProductTypes();
    expect(api.get).toHaveBeenCalledWith("/catalog/product-types");

    await catalogApi.createProductType({ key: "sofa", label: "Sofa" });
    expect(api.post).toHaveBeenCalledWith("/catalog/product-types", {
      key: "sofa",
      label: "Sofa",
    });

    await catalogApi.updateProductType("sofa", { label: "Sofas" });
    expect(api.patch).toHaveBeenCalledWith("/catalog/product-types/sofa", {
      label: "Sofas",
    });

    await catalogApi.deleteProductType("sofa");
    expect(api.delete).toHaveBeenCalledWith("/catalog/product-types/sofa");
  });

  it("uses slug-addressed room + collection endpoints", async () => {
    api.get.mockReturnValue(ok({}));
    api.post.mockReturnValue(ok({}));
    api.patch.mockReturnValue(ok({}));
    api.delete.mockReturnValue(ok({}));

    await catalogApi.listRooms();
    expect(api.get).toHaveBeenCalledWith("/catalog/rooms");
    await catalogApi.createRoom({ slug: "living-room", label: "Living Room" });
    expect(api.post).toHaveBeenCalledWith("/catalog/rooms", {
      slug: "living-room",
      label: "Living Room",
    });
    await catalogApi.updateRoom("living-room", { label: "Living" });
    expect(api.patch).toHaveBeenCalledWith("/catalog/rooms/living-room", {
      label: "Living",
    });
    await catalogApi.deleteRoom("living-room");
    expect(api.delete).toHaveBeenCalledWith("/catalog/rooms/living-room");

    await catalogApi.listCollections();
    expect(api.get).toHaveBeenCalledWith("/catalog/collections");
    await catalogApi.getCollection("new-in");
    expect(api.get).toHaveBeenCalledWith("/catalog/collections/new-in", {
      params: {},
    });
    await catalogApi.createCollection({
      slug: "new-in",
      label: "New In",
      kind: "manual",
      productIds: [],
    });
    expect(api.post).toHaveBeenCalledWith("/catalog/collections", {
      slug: "new-in",
      label: "New In",
      kind: "manual",
      productIds: [],
    });
    await catalogApi.updateCollection("new-in", { productIds: ["p1"] });
    expect(api.patch).toHaveBeenCalledWith("/catalog/collections/new-in", {
      productIds: ["p1"],
    });
    await catalogApi.deleteCollection("new-in");
    expect(api.delete).toHaveBeenCalledWith("/catalog/collections/new-in");
  });

  it("reads the resolution endpoints (category + product type)", async () => {
    api.get.mockReturnValue(ok({}));
    await catalogApi.getCategoryAttributes("cat-1");
    expect(api.get).toHaveBeenCalledWith(
      "/catalog/categories/cat-1/attributes",
    );
    await catalogApi.getProductTypeAttributes("sofa");
    expect(api.get).toHaveBeenCalledWith(
      "/catalog/product-types/sofa/attributes",
    );
  });
});

describe("categoryApi — catalog additions", () => {
  it("reorders siblings via POST /categories/reorder", async () => {
    api.post.mockReturnValue(ok({}));
    await categoryApi.reorder(["c1", "c2", "c3"]);
    expect(api.post).toHaveBeenCalledWith("/categories/reorder", {
      ids: ["c1", "c2", "c3"],
    });
  });

  it("gets and replaces a category's own attribute assignments", async () => {
    api.get.mockReturnValue(ok({}));
    api.put.mockReturnValue(ok({}));
    await categoryApi.getAttributeAssignments("c1");
    expect(api.get).toHaveBeenCalledWith("/categories/c1/attributes");
    const assignments = [{ attributeKey: "firmness", required: true }];
    await categoryApi.setAttributeAssignments("c1", assignments);
    expect(api.put).toHaveBeenCalledWith("/categories/c1/attributes", {
      assignments,
    });
  });

  it("sends roomSlugs as a JSON string inside the multipart form", async () => {
    api.post.mockReturnValue(ok({}));
    await categoryApi.create({
      name: "Sofas",
      productType: "sofa",
      roomSlugs: ["living-room", "small-spaces"],
    });
    const formData = api.post.mock.calls[0][1];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("name")).toBe("Sofas");
    expect(formData.get("productType")).toBe("sofa");
    expect(formData.get("roomSlugs")).toBe('["living-room","small-spaces"]');

    api.patch.mockReturnValue(ok({}));
    await categoryApi.update("c1", { roomSlugs: [] });
    const patchForm = api.patch.mock.calls[0][1];
    expect(patchForm.get("roomSlugs")).toBe("[]");
  });
});

describe("productApi — catalog additions", () => {
  it("JSON-stringifies catalogAttributes, roomSlugs and variantOptionKeys in the multipart form", async () => {
    api.patch.mockReturnValue(ok({}));
    await productApi.update("p1", {
      name: "Sofa",
      catalogAttributes: { seatingCapacity: 3, extendable: false },
      roomSlugs: ["living-room"],
      variantOptionKeys: ["color"],
    });
    const formData = api.patch.mock.calls[0][1];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("catalogAttributes")).toBe(
      '{"seatingCapacity":3,"extendable":false}',
    );
    expect(formData.get("roomSlugs")).toBe('["living-room"]');
    expect(formData.get("variantOptionKeys")).toBe('["color"]');
  });

  it("variant CRUD hits the nested product variant endpoints as JSON", async () => {
    api.get.mockReturnValue(ok({}));
    api.post.mockReturnValue(ok({}));
    api.patch.mockReturnValue(ok({}));
    api.delete.mockReturnValue(ok({}));

    await productApi.getVariants("p1");
    expect(api.get).toHaveBeenCalledWith("/products/p1/variants");

    const payload = {
      sku: "SOFA-RED",
      price: 100,
      options: { color: "#ff0000" },
    };
    await productApi.createVariant("p1", payload);
    expect(api.post).toHaveBeenCalledWith("/products/p1/variants", payload);

    await productApi.updateVariant("p1", "v1", { price: 120 });
    expect(api.patch).toHaveBeenCalledWith("/products/p1/variants/v1", {
      price: 120,
    });

    await productApi.deleteVariant("p1", "v1");
    expect(api.delete).toHaveBeenCalledWith("/products/p1/variants/v1");
  });
});
