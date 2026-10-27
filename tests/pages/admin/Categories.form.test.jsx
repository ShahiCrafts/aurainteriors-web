import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";

// Phase 7 characterization — written BEFORE the Categories.jsx split
// against the unsplit page. Pins the create/edit/delete form
// submission behaviour and the attributes-panel wiring that the
// split (CategoryFormModal / CategoryTree / CategoryAttributesPanel
// + hooks/useCategoryTree) must preserve byte-for-byte.

const createMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const updateMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const deleteMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const CATEGORIES = [
  { _id: "root1", name: "Furniture", slug: "furniture", description: "", parent: null, status: "active", sortOrder: 0, productCount: 2, subcategories: [], roomSlugs: [] },
  { _id: "child1", name: "Sofas", slug: "sofas", description: "Comfy", parent: "root1", status: "active", sortOrder: 0, productCount: 5, subcategories: [], roomSlugs: [] },
  { _id: "root2", name: "Lighting", slug: "lighting", description: "", parent: null, status: "active", sortOrder: 1, productCount: 4, subcategories: [], roomSlugs: [] },
];

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategories: () => ({ data: { data: { categories: CATEGORIES } }, isLoading: false, error: null }),
  useCreateCategory: () => ({ mutateAsync: createMutate, isPending: false }),
  useUpdateCategory: () => ({ mutateAsync: updateMutate, isPending: false }),
  useDeleteCategory: () => ({ mutateAsync: deleteMutate, isPending: false }),
}));

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useProductTypes: () => ({ data: { data: { productTypes: [{ key: "sofa", label: "Sofa" }] } }, isLoading: false }),
  useRooms: () => ({ data: { data: { rooms: [{ slug: "living-room", label: "Living Room" }] } }, isLoading: false }),
  useReorderCategories: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/components/admin/catalog/CategoryAttributesEditor", () => ({
  default: ({ category, onClose }) => (
    <div>
      <span>Attributes for {category.name}</span>
      <button onClick={onClose}>Close attributes</button>
    </div>
  ),
}));

vi.mock("../../../src/components/modals/ConfirmationDialog", () => ({
  default: ({ isOpen, onConfirm, onCancel }) =>
    isOpen ? (
      <div>
        <button onClick={onConfirm}>Confirm delete</button>
        <button onClick={onCancel}>Cancel delete</button>
      </div>
    ) : null,
}));

vi.mock("../../../src/components/common/Skeleton", () => ({
  default: () => null,
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import Categories from "../../../src/pages/admin/Categories";

function fieldByLabel(labelText) {
  const label = screen.getByText(labelText);
  return label.closest("div").querySelector("input, select, textarea");
}

describe("Categories admin — form submission (Phase 7 characterization)", () => {
  beforeEach(() => {
    createMutate.mockClear();
    updateMutate.mockClear();
    deleteMutate.mockClear();
  });

  it("creates a category with the exact payload shape (no image key without a file)", async () => {
    render(<Categories />);
    fireEvent.click(screen.getByRole("button", { name: "Add Category" }));

    fireEvent.change(fieldByLabel("Category Name *"), { target: { value: "Desks" } });
    fireEvent.change(fieldByLabel("Description"), { target: { value: "Work desks" } });
    fireEvent.click(within(screen.getByRole("dialog", { name: "Category" })).getByRole("button", { name: "Add Category" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith({
      name: "Desks",
      description: "Work desks",
      status: "active",
      sortOrder: 0,
      parent: "",
      productType: "",
      roomSlugs: [],
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("edits a category: seeds the form from the row and sends parent on update", async () => {
    render(<Categories />);
    const row = screen.getByTestId("category-row-sofas");
    fireEvent.click(within(row).getByTitle("Edit"));

    const nameField = fieldByLabel("Category Name *");
    expect(nameField.value).toBe("Sofas");
    fireEvent.change(nameField, { target: { value: "Sofas & Couches" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate).toHaveBeenCalledWith({
      id: "child1",
      data: {
        name: "Sofas & Couches",
        description: "Comfy",
        status: "active",
        sortOrder: 0,
        parent: "root1",
        productType: "",
        roomSlugs: [],
      },
    });
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("adds a subcategory with the parent preset from the tree row action", async () => {
    render(<Categories />);
    const row = screen.getByTestId("category-row-furniture");
    fireEvent.click(within(row).getByTitle("Add subcategory"));

    fireEvent.change(fieldByLabel("Category Name *"), { target: { value: "Chairs" } });
    fireEvent.click(within(screen.getByRole("dialog", { name: "Category" })).getByRole("button", { name: "Add Category" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0][0]).toMatchObject({ name: "Chairs", parent: "root1" });
  });

  it("deletes through the confirmation dialog with the row id", async () => {
    render(<Categories />);
    const row = screen.getByTestId("category-row-lighting");
    fireEvent.click(within(row).getByTitle("Delete"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(deleteMutate).toHaveBeenCalledTimes(1));
    expect(deleteMutate).toHaveBeenCalledWith("root2");
  });

  it("opens the attributes panel for the row's category and closes it", () => {
    render(<Categories />);
    const row = screen.getByTestId("category-row-sofas");
    fireEvent.click(within(row).getByTitle("Attributes"));
    expect(screen.getByText("Attributes for Sofas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close attributes" }));
    expect(screen.queryByText("Attributes for Sofas")).not.toBeInTheDocument();
  });
});
