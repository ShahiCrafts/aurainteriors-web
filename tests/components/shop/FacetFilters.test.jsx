// Phase 7 (catalog) — the facet filter panel renders FROM a
// facets payload: one control per attribute facet by definition
// type (checkbox+counts, color swatches, boolean toggle, range
// inputs), the room facet, and availability. Interactions report
// the exact (key, value) the URL grammar needs. Chips remove
// single filters and clear all.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterSidebar from "../../../src/components/shop/FilterSidebar.jsx";
import { FilterChips } from "../../../src/components/shop/FacetFilters.jsx";

const facets = {
  category: {
    key: "category",
    label: "Category",
    type: "category",
    options: [],
  },
  room: {
    key: "room",
    label: "Room",
    type: "enum",
    options: [
      { value: "living-room", label: "Living Room", count: 4, selected: false },
    ],
  },
  price: {
    key: "price",
    label: "Price",
    type: "money",
    min: 1000,
    max: 90000,
    selected: { min: null, max: null },
  },
  availability: {
    key: "availability",
    label: "Availability",
    type: "boolean",
    options: [{ value: "inStock", count: 3, selected: false }],
  },
  rating: {
    key: "rating",
    label: "Rating",
    type: "rating",
    options: [{ value: 4, count: 2, selected: false }],
  },
  attributes: [
    {
      key: "frameMaterial",
      label: "Frame Material",
      type: "enum",
      options: [
        { value: "oak", count: 2, selected: false },
        { value: "walnut", count: 1, selected: true },
      ],
    },
    {
      key: "assemblyRequired",
      label: "Assembly Required",
      type: "boolean",
      options: [{ value: true, count: 3, selected: false }],
    },
    {
      key: "seatingCapacity",
      label: "Seating Capacity",
      type: "integer",
      options: [
        { value: 2, count: 1, selected: false },
        { value: 6, count: 1, selected: false },
      ],
    },
    {
      key: "upholsteryColor",
      label: "Upholstery Color",
      type: "color",
      options: [{ value: "#7A4A21", count: 2, selected: false }],
    },
    // Legacy-owned keys must NOT double-render as facet sections.
    {
      key: "colors",
      label: "Colors",
      type: "multi-enum",
      options: [{ value: "red", count: 1, selected: false }],
    },
  ],
};

const handlers = {
  onAttrToggle: vi.fn(),
  onAttrRange: vi.fn(),
  onRoomToggle: vi.fn(),
  onInStockToggle: vi.fn(),
};

const renderSidebar = () =>
  render(
    <FilterSidebar
      categories={[]}
      selectedCategories={[]}
      onCategoryChange={vi.fn()}
      onPriceChange={vi.fn()}
      onColorChange={vi.fn()}
      onMaterialChange={vi.fn()}
      onRatingChange={vi.fn()}
      onResetFilters={vi.fn()}
      facets={facets}
      facetSelection={{
        frameMaterial: { values: ["walnut"], min: null, max: null },
      }}
      selectedRooms={[]}
      inStockOnly={false}
      {...handlers}
    />,
  );

describe("FacetSections via FilterSidebar (Phase 7)", () => {
  it("renders room, availability and per-type attribute controls with counts", () => {
    renderSidebar();
    expect(screen.getByText("Room")).toBeInTheDocument();
    expect(screen.getByText("Living Room")).toBeInTheDocument();
    expect(screen.getByText("In stock only")).toBeInTheDocument();
    expect(screen.getByText("Frame Material")).toBeInTheDocument();
    expect(screen.getByText("oak")).toBeInTheDocument();
    expect(screen.getByText("Assembly Required")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Seating Capacity minimum"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Seating Capacity maximum"),
    ).toBeInTheDocument();
    expect(screen.getByText("Available 2 – 6")).toBeInTheDocument();
    expect(screen.getByText("Upholstery Color")).toBeInTheDocument();
    // The colors attribute facet is owned by the legacy section.
    expect(screen.queryByText("red")).not.toBeInTheDocument();
  });

  it("checkbox facet reflects selection and reports toggles", () => {
    renderSidebar();
    const walnut = screen.getByRole("checkbox", { name: /walnut/ });
    expect(walnut).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: /oak/ }));
    expect(handlers.onAttrToggle).toHaveBeenCalledWith("frameMaterial", "oak");
  });

  it("room + availability toggles report through their handlers", () => {
    renderSidebar();
    fireEvent.click(screen.getByRole("checkbox", { name: /Living Room/ }));
    expect(handlers.onRoomToggle).toHaveBeenCalledWith("living-room");
    fireEvent.click(screen.getByRole("checkbox", { name: /In stock only/ }));
    expect(handlers.onInStockToggle).toHaveBeenCalled();
  });

  it("boolean facet toggles the 'true' value", () => {
    renderSidebar();
    fireEvent.click(screen.getByRole("checkbox", { name: /Yes/ }));
    expect(handlers.onAttrToggle).toHaveBeenCalledWith(
      "assemblyRequired",
      "true",
    );
  });

  it("range facet commits min/max on blur", () => {
    renderSidebar();
    const min = screen.getByLabelText("Seating Capacity minimum");
    fireEvent.change(min, { target: { value: "3" } });
    fireEvent.blur(min);
    expect(handlers.onAttrRange).toHaveBeenCalledWith(
      "seatingCapacity",
      "3",
      null,
    );
  });

  it("color facet renders a swatch chip that toggles its value", () => {
    renderSidebar();
    fireEvent.click(screen.getByTitle("#7A4A21 (2)"));
    expect(handlers.onAttrToggle).toHaveBeenCalledWith(
      "upholsteryColor",
      "#7A4A21",
    );
  });
});

// Post-delivery fix (catalog), defect 2 — attribute facet groups
// with no selectable values must not render (no header floating
// over "No matching values."); a group whose filter is active
// stays visible so it can be cleared in place.
describe("Empty attribute facet groups (post-delivery fix)", () => {
  const emptyFacets = {
    ...facets,
    attributes: [
      {
        key: "configuration",
        label: "Configuration",
        type: "enum",
        options: [],
      },
      {
        key: "frameMaterial",
        label: "Frame Material",
        type: "enum",
        options: [{ value: "oak", count: 2, selected: false }],
      },
      {
        key: "seatingCapacity",
        label: "Seating Capacity",
        type: "integer",
        options: [],
      },
      {
        key: "upholsteryColor",
        label: "Upholstery Color",
        type: "color",
        options: [],
      },
      {
        key: "assemblyRequired",
        label: "Assembly Required",
        type: "boolean",
        options: [],
      },
      {
        key: "colors",
        label: "Colors",
        type: "multi-enum",
        options: [{ value: "red", count: 1, selected: false }],
      },
    ],
  };

  const renderEmpty = (facetSelection = {}) =>
    render(
      <FilterSidebar
        categories={[]}
        selectedCategories={[]}
        onCategoryChange={vi.fn()}
        onPriceChange={vi.fn()}
        onColorChange={vi.fn()}
        onMaterialChange={vi.fn()}
        onRatingChange={vi.fn()}
        onResetFilters={vi.fn()}
        facets={emptyFacets}
        facetSelection={facetSelection}
        selectedRooms={[]}
        inStockOnly={false}
        onAttrToggle={vi.fn()}
        onAttrRange={vi.fn()}
        onRoomToggle={vi.fn()}
        onInStockToggle={vi.fn()}
      />,
    );

  it("hides attribute groups that carry no values", () => {
    renderEmpty();
    expect(screen.queryByText("Configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("Seating Capacity")).not.toBeInTheDocument();
    expect(screen.queryByText("Upholstery Color")).not.toBeInTheDocument();
    expect(screen.queryByText("Assembly Required")).not.toBeInTheDocument();
    expect(screen.queryByText("No matching values.")).not.toBeInTheDocument();
    // The group WITH values still renders.
    expect(screen.getByText("Frame Material")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /oak/ })).toBeInTheDocument();
  });

  it("keeps an active-but-empty group visible with its value checkable-off", () => {
    const onAttrToggle = vi.fn();
    render(
      <FilterSidebar
        categories={[]}
        selectedCategories={[]}
        onCategoryChange={vi.fn()}
        onPriceChange={vi.fn()}
        onColorChange={vi.fn()}
        onMaterialChange={vi.fn()}
        onRatingChange={vi.fn()}
        onResetFilters={vi.fn()}
        facets={emptyFacets}
        facetSelection={{
          configuration: { values: ["2-seater"], min: null, max: null },
        }}
        selectedRooms={[]}
        inStockOnly={false}
        onAttrToggle={onAttrToggle}
        onAttrRange={vi.fn()}
        onRoomToggle={vi.fn()}
        onInStockToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    const box = screen.getByRole("checkbox", { name: /2-seater/ });
    expect(box).toBeChecked();
    fireEvent.click(box);
    expect(onAttrToggle).toHaveBeenCalledWith("configuration", "2-seater");
  });

  it("'No matching values.' survives only as the search-within-facet empty state", () => {
    const manyValues = {
      ...facets,
      attributes: [
        {
          key: "frameMaterial",
          label: "Frame Material",
          type: "enum",
          options: Array.from({ length: 9 }, (_, i) => ({
            value: `wood-${i}`,
            count: 1,
            selected: false,
          })),
        },
      ],
    };
    render(
      <FilterSidebar
        categories={[]}
        selectedCategories={[]}
        onCategoryChange={vi.fn()}
        onPriceChange={vi.fn()}
        onColorChange={vi.fn()}
        onMaterialChange={vi.fn()}
        onRatingChange={vi.fn()}
        onResetFilters={vi.fn()}
        facets={manyValues}
        facetSelection={{}}
        selectedRooms={[]}
        inStockOnly={false}
        onAttrToggle={vi.fn()}
        onAttrRange={vi.fn()}
        onRoomToggle={vi.fn()}
        onInStockToggle={vi.fn()}
      />,
    );
    expect(screen.queryByText("No matching values.")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search Frame Material values"), {
      target: { value: "zzz-no-match" },
    });
    expect(screen.getByText("No matching values.")).toBeInTheDocument();
  });
});

describe("FilterChips (Phase 7)", () => {
  it("removes a single chip and clears all", () => {
    const onRemove = vi.fn();
    const onClearAll = vi.fn();
    const chip = {
      id: "attr:color:red",
      label: "Color: red",
      patch: { "attr.color": null },
    };
    render(
      <FilterChips
        chips={[chip]}
        onRemove={onRemove}
        onClearAll={onClearAll}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Remove filter Color: red" }),
    );
    expect(onRemove).toHaveBeenCalledWith(chip);
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("renders nothing without chips", () => {
    const { container } = render(
      <FilterChips chips={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a color dot for swatched chips and a star for rating chips", () => {
    const chips = [
      {
        id: "colors:Teal",
        label: "Teal",
        kind: "color",
        swatch: "#0d9488",
        patch: { colors: null },
      },
      {
        id: "rating",
        label: "4 & up",
        kind: "rating",
        patch: { rating: null },
      },
    ];
    const { container } = render(
      <FilterChips chips={chips} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );
    const dot = container.querySelector("[data-chip-swatch]");
    expect(dot).not.toBeNull();
    expect(dot.style.backgroundColor).toBe("rgb(13, 148, 136)");
    expect(container.querySelector("svg.lucide-star")).not.toBeNull();
  });
});
