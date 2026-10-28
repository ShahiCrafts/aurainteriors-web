import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

// Phase 6 (catalog) — the category manager renders the taxonomy as
// an expandable tree with subtree product counts, the parent picker
// excludes the category itself and its descendants (the server
// rejects cycles with a 400 too), and the up/down controls reorder
// siblings through POST /categories/reorder.

const reorderMutate = vi.hoisted(() => vi.fn());

const CATEGORIES = [
  {
    _id: "root1",
    name: "Furniture",
    slug: "furniture",
    description: "",
    parent: null,
    status: "active",
    sortOrder: 0,
    productCount: 2,
    subcategories: [],
    roomSlugs: [],
  },
  {
    _id: "child1",
    name: "Sofas",
    slug: "sofas",
    description: "",
    parent: "root1",
    status: "active",
    sortOrder: 0,
    productCount: 5,
    subcategories: [],
    roomSlugs: [],
  },
  {
    _id: "grand1",
    name: "Sectionals",
    slug: "sectionals",
    description: "",
    parent: "child1",
    status: "active",
    sortOrder: 0,
    productCount: 3,
    subcategories: [],
    roomSlugs: [],
  },
  {
    _id: "child2",
    name: "Beds",
    slug: "beds",
    description: "",
    parent: "root1",
    status: "inactive",
    sortOrder: 1,
    productCount: 1,
    subcategories: [],
    roomSlugs: [],
  },
  {
    _id: "root2",
    name: "Lighting",
    slug: "lighting",
    description: "",
    parent: null,
    status: "active",
    sortOrder: 1,
    productCount: 4,
    subcategories: [],
    roomSlugs: [],
  },
];

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategories: () => ({
    data: { data: { categories: CATEGORIES } },
    isLoading: false,
    error: null,
  }),
  useCreateCategory: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useUpdateCategory: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useDeleteCategory: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useProductTypes: () => ({
    data: { data: { productTypes: [{ key: "sofa", label: "Sofa" }] } },
    isLoading: false,
  }),
  useRooms: () => ({
    data: { data: { rooms: [{ slug: "living-room", label: "Living Room" }] } },
    isLoading: false,
  }),
  useReorderCategories: () => ({ mutate: reorderMutate, isPending: false }),
  useAttributeDefinitions: () => ({
    data: { data: { attributeDefinitions: [] } },
    isLoading: false,
  }),
  useCategoryAssignments: () => ({
    data: { data: { assignments: [] } },
    isLoading: false,
  }),
  useCategoryAttributes: () => ({
    data: { data: { attributes: [] } },
    isLoading: false,
  }),
  useSetCategoryAssignments: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock("../../../src/components/fallbacks/ImageWithFallback", () => ({
  default: (props) => <img {...props} alt={props.alt || ""} />,
}));

vi.mock("../../../src/components/modals/ConfirmationDialog", () => ({
  default: () => null,
}));

vi.mock("../../../src/components/common/Skeleton", () => ({
  default: () => null,
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import Categories from "../../../src/pages/admin/Categories";

describe("Categories admin — tree view (Phase 6)", () => {
  beforeEach(() => {
    reorderMutate.mockClear();
  });

  it("renders the hierarchy with subtree product counts", () => {
    render(<Categories />);

    expect(screen.getByTestId("category-row-furniture")).toBeInTheDocument();
    expect(screen.getByTestId("category-row-sofas")).toBeInTheDocument();
    expect(screen.getByTestId("category-row-sectionals")).toBeInTheDocument();
    expect(screen.getByTestId("category-row-beds")).toBeInTheDocument();
    expect(screen.getByTestId("category-row-lighting")).toBeInTheDocument();

    // Furniture: 2 direct + 5 + 3 + 1 below = 11 in subtree.
    const furnitureRow = screen.getByTestId("category-row-furniture");
    expect(
      within(furnitureRow).getByText(/11 incl\. subcategories/),
    ).toBeInTheDocument();
    // Sofas: 5 direct + 3 below = 8.
    const sofasRow = screen.getByTestId("category-row-sofas");
    expect(
      within(sofasRow).getByText(/8 incl\. subcategories/),
    ).toBeInTheDocument();
  });

  it("collapses and expands a subtree", () => {
    render(<Categories />);

    fireEvent.click(screen.getByRole("button", { name: "Collapse Furniture" }));
    expect(screen.queryByTestId("category-row-sofas")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("category-row-sectionals"),
    ).not.toBeInTheDocument();
    // Roots stay visible.
    expect(screen.getByTestId("category-row-lighting")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand Furniture" }));
    expect(screen.getByTestId("category-row-sofas")).toBeInTheDocument();
  });

  it("parent picker excludes the category itself and its descendants", () => {
    render(<Categories />);

    const sofasRow = screen.getByTestId("category-row-sofas");
    fireEvent.click(within(sofasRow).getByTitle("Edit"));

    const parentLabel = screen.getByText("Parent Category (Optional)");
    const parentSelect = parentLabel.closest("div").querySelector("select");
    const optionValues = [...parentSelect.querySelectorAll("option")].map(
      (o) => o.value,
    );

    expect(optionValues).toContain("");
    expect(optionValues).toContain("root1"); // its current parent stays selectable
    expect(optionValues).toContain("child2"); // a sibling is fine
    expect(optionValues).toContain("root2");
    expect(optionValues).not.toContain("child1"); // itself
    expect(optionValues).not.toContain("grand1"); // its descendant
  });

  it("reorders siblings through the reorder mutation", () => {
    render(<Categories />);

    fireEvent.click(screen.getByRole("button", { name: "Move Beds up" }));
    // Siblings under Furniture are [Sofas, Beds]; Beds moves first.
    // (mutate's second argument is the react-query options object.)
    expect(reorderMutate).toHaveBeenCalledTimes(1);
    expect(reorderMutate.mock.calls[0][0]).toEqual(["child2", "child1"]);
  });
});
