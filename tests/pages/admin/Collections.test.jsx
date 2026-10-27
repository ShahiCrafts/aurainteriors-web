import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

// Phase 6 (catalog) — the collections admin: a manual collection's
// product picker searches existing products, adds/removes without
// duplicates, and saves the id list through the update mutation.

const updateMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const COLLECTION = {
  slug: "editors-picks",
  label: "Editor's Picks",
  description: "",
  image: "",
  kind: "manual",
  productIds: ["p1"],
  active: true,
  sortOrder: 0,
};

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useCollections: () => ({ data: { data: { collections: [COLLECTION] } }, isLoading: false, error: null }),
  useCollection: () => ({
    data: {
      data: {
        collection: COLLECTION,
        products: [{ _id: "p1", name: "Server Page Sofa" }],
        pagination: { total: 1, pages: 1, page: 1, limit: 100 },
      },
    },
    isLoading: false,
  }),
  useCreateCollection: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useUpdateCollection: () => ({ mutateAsync: updateMutate, isPending: false }),
  useDeleteCollection: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useAttributeDefinitions: () => ({ data: { data: { attributeDefinitions: [] } }, isLoading: false }),
}));

vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useProducts: (params = {}) => {
    const products =
      params.search && params.search.toLowerCase().includes("bed")
        ? [{ _id: "p2", name: "Oak Bed", price: 800 }]
        : [];
    return {
      data: { data: { products, pagination: { total: products.length, pages: 1, page: 1, limit: 10 } } },
      isLoading: false,
    };
  },
}));

vi.mock("../../../src/components/modals/ConfirmationDialog", () => ({
  default: () => null,
}));

vi.mock("../../../src/components/common/Skeleton", () => ({
  default: () => null,
}));

vi.mock("../../../src/components/fallbacks/ImageWithFallback", () => ({
  default: (props) => <img {...props} alt={props.alt || ""} />,
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import Collections from "../../../src/pages/admin/Collections";

describe("Collections admin — manual product picker (Phase 6)", () => {
  beforeEach(() => {
    updateMutate.mockClear();
  });

  it("adds and removes products without duplicates and saves the id list", async () => {
    render(<Collections />);

    const row = screen.getByTestId("collection-row-editors-picks");
    fireEvent.click(within(row).getByTitle("Edit"));
    const dialog = await screen.findByRole("dialog", { name: /Editor's Picks/ });

    // The seeded product is listed as selected (name resolved from
    // the collection detail).
    expect(within(dialog).getByText("Server Page Sofa")).toBeInTheDocument();

    // Search and add the bed.
    fireEvent.change(within(dialog).getByLabelText("Search products"), {
      target: { value: "bed" },
    });
    fireEvent.click(await within(dialog).findByRole("button", { name: "Add Oak Bed" }));
    expect(within(dialog).getByText("Oak Bed")).toBeInTheDocument();

    // It cannot be added twice: the result no longer offers Add.
    expect(within(dialog).queryByRole("button", { name: "Add Oak Bed" })).not.toBeInTheDocument();

    // Remove it (its Add button returns — proof it left the
    // selection), re-add it, then save.
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove Oak Bed" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Add Oak Bed" }));

    fireEvent.click(within(dialog).getByRole("button", { name: "Save Changes" }));
    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(updateMutate.mock.calls[0][0]).toEqual({
      slug: "editors-picks",
      data: expect.objectContaining({ productIds: ["p1", "p2"] }),
    });
  });
});
