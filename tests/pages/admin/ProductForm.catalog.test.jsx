import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

// Phase 6 (catalog) — the admin product form's catalog behavior:
// the dynamic attribute section renders one typed input per
// resolved definition (field-storage definitions stay with the
// standard fields), a missing required attribute blocks the save,
// and the variant editor follows variantOptionKeys, locks the axes
// once variants exist, keeps SKU immutable on edit, and surfaces a
// duplicate-combination 409 verbatim.

const createProductMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const updateProductMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const createVariantMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const toastError = vi.hoisted(() => vi.fn());
const variantsFixture = vi.hoisted(() => ({ list: [] }));

const PRODUCT = {
  _id: "p1",
  name: "Server Page Sofa",
  sku: "SOFA-1",
  price: 1000,
  originalPrice: null,
  stock: 3,
  status: "active",
  category: { _id: "cat-1", name: "Sofas" },
  description: "",
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
  variantOptionKeys: ["frameMaterial"],
  catalogAttributes: {},
};

const RESOLUTION = [
  { key: "careInstructions", label: "Care Instructions", type: "string", storage: "catalogAttributes", required: true, source: "category", displayGroup: "Care" },
  { key: "frameMaterial", label: "Frame Material", type: "enum", allowedValues: ["Oak", "Pine"], storage: "catalogAttributes", required: false, source: "global" },
  { key: "foldable", label: "Foldable", type: "boolean", storage: "catalogAttributes", required: false, source: "global" },
  { key: "seatCount", label: "Seat Count", type: "integer", min: 1, max: 8, storage: "catalogAttributes", required: false, source: "global" },
  { key: "seatDepth", label: "Seat Depth", type: "measurement", unit: "cm", acceptedUnits: ["cm", "in"], storage: "catalogAttributes", required: false, source: "global" },
  { key: "finishColor", label: "Finish Color", type: "color", storage: "catalogAttributes", required: false, source: "global" },
  { key: "dimensions", label: "Dimensions", type: "dimensions", storage: "field", fieldPath: "dimensions", required: false, source: "global" },
];

const DEFINITIONS = [
  { key: "frameMaterial", label: "Frame Material", type: "enum", allowedValues: ["Oak", "Pine"], storage: "catalogAttributes", active: true },
  { key: "seatCount", label: "Seat Count", type: "integer", storage: "catalogAttributes", active: true },
  { key: "careInstructions", label: "Care Instructions", type: "string", storage: "catalogAttributes", active: true },
];

vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useProducts: (params = {}) => {
    if (params.limit === 1) {
      return {
        data: { data: { products: [], pagination: { total: 1, pages: 1, page: 1, limit: 1 } } },
        isLoading: false,
      };
    }
    return {
      data: {
        data: {
          products: [PRODUCT],
          pagination: { total: 1, pages: 1, page: params.page || 1, limit: params.limit || 10 },
        },
      },
      isLoading: false,
    };
  },
  useCreateProduct: () => ({ mutateAsync: createProductMutate, isPending: false }),
  useUpdateProduct: () => ({ mutateAsync: updateProductMutate, isPending: false }),
  useDeleteProduct: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
}));

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategories: () => ({
    data: { data: { categories: [{ _id: "cat-1", name: "Sofas" }] } },
  }),
}));

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useProductTypes: () => ({ data: { data: { productTypes: [{ key: "sofa", label: "Sofa" }] } } }),
  useRooms: () => ({ data: { data: { rooms: [{ slug: "living-room", label: "Living Room" }] } } }),
  useCategoryAttributes: () => ({ data: { data: { attributes: RESOLUTION } }, isLoading: false }),
  useProductTypeAttributes: () => ({ data: { data: { attributes: [] } }, isLoading: false }),
  useAttributeDefinitions: () => ({ data: { data: { attributeDefinitions: DEFINITIONS } }, isLoading: false }),
  useProductVariants: () => ({ data: { data: { variants: variantsFixture.list } }, isLoading: false }),
  useCreateVariant: () => ({ mutateAsync: createVariantMutate, isPending: false }),
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
  toast: { success: vi.fn(), error: toastError, warning: vi.fn() },
}));

import Products from "../../../src/pages/admin/Products.jsx";

function openCreateModal() {
  render(<Products />);
  fireEvent.click(screen.getAllByRole("button", { name: "Add Product" })[0]);
  return screen.getByRole("dialog", { name: "Product" });
}

function openEditModal() {
  render(<Products />);
  fireEvent.click(screen.getByText("Server Page Sofa"));
  return screen.getByRole("dialog", { name: "Product" });
}

// The legacy product form's labels are not htmlFor-associated, so
// its fields are located through the label's wrapper element.
function legacyFieldByLabel(root, labelText) {
  const label = within(root).getByText(labelText);
  return label.closest("div").querySelector("input, select, textarea");
}

describe("Product form — dynamic attributes (Phase 6)", () => {
  beforeEach(() => {
    createProductMutate.mockClear();
    updateProductMutate.mockClear();
    toastError.mockClear();
    variantsFixture.list = [];
  });

  it("renders one typed input per resolved definition type family", () => {
    const dialog = openCreateModal();

    const care = within(dialog).getByLabelText(/Care Instructions/);
    expect(care.tagName).toBe("INPUT");
    expect(care).toHaveAttribute("type", "text");

    expect(within(dialog).getByLabelText(/Frame Material/).tagName).toBe("SELECT");
    expect(within(dialog).getByLabelText(/Foldable/).tagName).toBe("SELECT");

    const seatCount = within(dialog).getByLabelText(/Seat Count/);
    expect(seatCount).toHaveAttribute("type", "number");

    expect(within(dialog).getByLabelText("Seat Depth value")).toHaveAttribute("type", "number");
    expect(within(dialog).getByLabelText("Seat Depth unit").tagName).toBe("SELECT");

    expect(within(dialog).getByLabelText(/Finish Color/).tagName).toBe("INPUT");

    // storage:'field' definitions are NOT duplicated as inputs —
    // the standard product fields own them.
    expect(dialog.querySelector("#attr-dimensions")).toBeNull();
    expect(within(dialog).getByText(/edited in the standard product fields/)).toBeInTheDocument();
  });

  it("blocks submit on a missing required attribute, then saves with the value", async () => {
    const dialog = openCreateModal();

    fireEvent.change(legacyFieldByLabel(dialog, "Product Name *"), {
      target: { value: "New Sofa" },
    });
    fireEvent.change(legacyFieldByLabel(dialog, "Price *"), {
      target: { value: "500" },
    });

    const saveButton = within(dialog).getByRole("button", { name: "Add Product" });
    fireEvent.click(saveButton);

    expect(createProductMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining("Care Instructions"));

    fireEvent.change(within(dialog).getByLabelText(/Care Instructions/), {
      target: { value: "Wipe with a dry cloth" },
    });
    fireEvent.click(saveButton);

    expect(createProductMutate).toHaveBeenCalledTimes(1);
    const payload = createProductMutate.mock.calls[0][0];
    expect(payload.catalogAttributes).toEqual(
      expect.objectContaining({ careInstructions: "Wipe with a dry cloth" })
    );
    expect(payload.productType).toBe("");
    expect(payload.roomSlugs).toEqual([]);
  });
});

describe("Product form — variant editor (Phase 6)", () => {
  beforeEach(() => {
    createVariantMutate.mockClear();
    createVariantMutate.mockResolvedValue({});
    variantsFixture.list = [];
  });

  it("drives option inputs from variantOptionKeys and surfaces a duplicate 409", async () => {
    const dialog = openEditModal();
    fireEvent.click(within(dialog).getByRole("button", { name: /Variants/ }));

    // The axis picker reflects the product's saved variantOptionKeys.
    expect(within(dialog).getByLabelText("Frame Material", { selector: "input" })).toBeChecked();

    fireEvent.click(within(dialog).getByRole("button", { name: "Add Variant" }));
    const variantDialog = screen.getByRole("dialog", { name: "Add variant" });

    fireEvent.change(within(variantDialog).getByLabelText(/^SKU/), {
      target: { value: "SOFA-1-OAK" },
    });
    fireEvent.change(within(variantDialog).getByLabelText(/Frame Material/), {
      target: { value: "Oak" },
    });
    fireEvent.change(within(variantDialog).getByLabelText(/^Price/), {
      target: { value: "1200" },
    });

    createVariantMutate.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: "A variant with this combination of options already exists for this product" },
      },
    });
    fireEvent.click(within(variantDialog).getByRole("button", { name: "Add Variant" }));

    expect(createVariantMutate).toHaveBeenCalledWith({
      productId: "p1",
      data: expect.objectContaining({
        sku: "SOFA-1-OAK",
        options: { frameMaterial: "Oak" },
        price: 1200,
      }),
    });
    expect(
      await within(variantDialog).findByText(/combination of options already exists/)
    ).toBeInTheDocument();
  });

  it("locks the axes while variants exist and keeps SKU immutable on edit", async () => {
    variantsFixture.list = [
      {
        _id: "v1",
        sku: "SOFA-1-OAK",
        options: { frameMaterial: "Oak" },
        price: 1200,
        compareAtPrice: 1500,
        stock: 4,
        enabled: true,
        images: [],
      },
    ];
    const dialog = openEditModal();
    fireEvent.click(within(dialog).getByRole("button", { name: /Variants/ }));

    expect(within(dialog).getByText(/Option axes are locked while variants exist/)).toBeInTheDocument();
    expect(within(dialog).getByText("SOFA-1-OAK")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByTitle("Edit variant"));
    const variantDialog = await screen.findByRole("dialog", { name: /Edit variant/ });
    const skuInput = within(variantDialog).getByLabelText(/^SKU/);
    expect(skuInput).toHaveValue("SOFA-1-OAK");
    expect(skuInput).toBeDisabled();
  });
});
