import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";

// Phase 7 characterization — written BEFORE the Products.jsx split
// against the unsplit page. Pins the create (simple) / edit submit
// payload shapes and the image-upload form-state behaviour that
// hooks/useProductFormState + the tab split must preserve
// byte-for-byte. Variant editing is already pinned by
// ProductForm.catalog.test.jsx (Phase 6 suite, unmodified).

const createMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const updateMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const PRODUCT = {
  _id: "p1",
  name: "Server Page Sofa",
  sku: "SOFA-1",
  price: 1000,
  originalPrice: 1200,
  stock: 3,
  status: "active",
  category: { _id: "cat-1", name: "Sofas" },
  description: "A sofa",
  shortDescription: "",
  modelUrl: null,
  modelFiles: [],
  images: [{ url: "https://example.com/sofa.jpg" }],
  style: "",
  isFeatured: false,
  isNewArrival: false,
  dimensions: { width: "", height: "", depth: "" },
  weight: { value: "", unit: "kg" },
  materials: [],
  colors: [],
  productType: "",
  roomSlugs: [],
  catalogAttributes: {},
};

vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useProducts: (params = {}) => {
    if (params.limit === 1) {
      return { data: { data: { products: [], pagination: { total: 1, pages: 1, page: 1, limit: 1 } } }, isLoading: false };
    }
    return {
      data: { data: { products: [PRODUCT], pagination: { total: 1, pages: 1, page: params.page || 1, limit: params.limit || 10 } } },
      isLoading: false,
    };
  },
  useCreateProduct: () => ({ mutateAsync: createMutate, isPending: false }),
  useUpdateProduct: () => ({ mutateAsync: updateMutate, isPending: false }),
  useDeleteProduct: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
}));

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategories: () => ({ data: { data: { categories: [{ _id: "cat-1", name: "Sofas" }] } } }),
}));

// Stable result objects (React Query returns cached references;
// a fresh object per call would re-fire DynamicAttributesSection's
// onChange effect forever).
const CATALOG_STABLE = vi.hoisted(() => ({
  productTypes: { data: { data: { productTypes: [{ key: "sofa", label: "Sofa" }] } } },
  rooms: { data: { data: { rooms: [{ slug: "living-room", label: "Living Room" }] } } },
  emptyAttributes: { data: { data: { attributes: [] } }, isLoading: false },
  definitions: { data: { data: { attributeDefinitions: [] } }, isLoading: false },
}));

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useProductTypes: () => CATALOG_STABLE.productTypes,
  useRooms: () => CATALOG_STABLE.rooms,
  useCategoryAttributes: () => CATALOG_STABLE.emptyAttributes,
  useProductTypeAttributes: () => CATALOG_STABLE.emptyAttributes,
  useAttributeDefinitions: () => CATALOG_STABLE.definitions,
  useProductVariants: () => ({ data: { data: { variants: [] } }, isLoading: false }),
  useCreateVariant: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useUpdateVariant: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useDeleteVariant: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
}));

vi.mock("../../../src/components/fallbacks/ImageWithFallback", () => ({
  default: () => <div>IMG</div>,
}));

vi.mock("../../../src/components/modals/ConfirmationDialog", () => ({
  default: () => null,
}));

vi.mock("../../../src/components/common/Skeleton", () => ({
  default: () => null,
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import Products from "../../../src/pages/admin/Products.jsx";

function openCreate() {
  render(<Products />);
  fireEvent.click(screen.getAllByRole("button", { name: "Add Product" })[0]);
  return screen.getByRole("dialog", { name: "Product" });
}

function openEdit() {
  render(<Products />);
  fireEvent.click(screen.getByText("Server Page Sofa"));
  return screen.getByRole("dialog", { name: "Product" });
}

function fieldByLabel(root, labelText) {
  const label = within(root).getByText(labelText);
  return label.closest("div").querySelector("input, select, textarea");
}

describe("Admin Products form submission (Phase 7 characterization)", () => {
  beforeEach(() => {
    createMutate.mockClear();
    updateMutate.mockClear();
  });

  it("creates a simple product with the exact payload shape", async () => {
    const dialog = openCreate();
    fireEvent.change(fieldByLabel(dialog, "Product Name *"), { target: { value: "New Chair" } });
    fireEvent.change(fieldByLabel(dialog, "Category *"), { target: { value: "cat-1" } });
    fireEvent.change(fieldByLabel(dialog, "Price *"), { target: { value: "2500" } });
    fireEvent.change(fieldByLabel(dialog, "Stock"), { target: { value: "7" } });

    fireEvent.click(within(dialog).getByRole("button", { name: "Add Product" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith({
      name: "New Chair",
      category: "cat-1",
      price: 2500,
      stock: 7,
      status: "active",
      isFeatured: false,
      isNewArrival: false,
      materials: [],
      colors: [],
      productType: "",
      roomSlugs: [],
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("edits a product: seeds fields and sends numeric price/stock + originalPrice", async () => {
    const dialog = openEdit();
    const price = fieldByLabel(dialog, "Price *");
    expect(price.value).toBe("1000");
    fireEvent.change(price, { target: { value: "1500" } });

    fireEvent.click(within(dialog).getByRole("button", { name: "Update Product" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const call = updateMutate.mock.calls[0][0];
    expect(call.id).toBe("p1");
    expect(call.data).toMatchObject({
      name: "Server Page Sofa",
      category: "cat-1",
      price: 1500,
      stock: 3,
      originalPrice: 1200,
      status: "active",
      description: "A sofa",
      catalogAttributes: {},
    });
    // No images were added or removed, so neither key is sent.
    expect(call.data).not.toHaveProperty("images");
    expect(call.data).not.toHaveProperty("removeImages");
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("image upload: a chosen file previews and rides the create payload as images", async () => {
    const dialog = openCreate();
    const file = new File(["fake-image"], "chair.png", { type: "image/png" });
    const input = dialog.querySelector('input[type="file"][accept="image/*"]');
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { files: [file] } });

    // FileReader preview lands in the form state (label count chip).
    await waitFor(() => expect(within(dialog).getByText(/\(1 image\)/)).toBeInTheDocument());

    fireEvent.change(fieldByLabel(dialog, "Product Name *"), { target: { value: "Imaged Chair" } });
    fireEvent.change(fieldByLabel(dialog, "Category *"), { target: { value: "cat-1" } });
    fireEvent.change(fieldByLabel(dialog, "Price *"), { target: { value: "900" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add Product" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    const payload = createMutate.mock.calls[0][0];
    expect(payload.images).toEqual([file]);
  });

  it("removing an existing image on edit sends removeImages with its original url", async () => {
    const dialog = openEdit();
    // The existing preview's remove button appears on hover (opacity-0
    // class) but is present in the DOM.
    const removeButtons = dialog.querySelectorAll('button[title="Remove image"]');
    expect(removeButtons.length).toBe(1);
    fireEvent.click(removeButtons[0]);

    fireEvent.click(within(dialog).getByRole("button", { name: "Update Product" }));
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0].data.removeImages).toEqual(["https://example.com/sofa.jpg"]);
  });
});
