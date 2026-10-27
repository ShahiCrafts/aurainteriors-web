import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// FE-14 regression tests for src/components/shop/FilterSidebar.jsx.
//
// Pre-fix behaviour: materialOptions carried hardcoded counts
// (Velvet 12, Leather 19, Wood 32, Metal 11, Fabric 9) and the render fell
// back to them (`materialCounts[name] || material.count`) whenever the
// server supplied no count — which is always, since ShopPage never passes
// materialCounts. A count badge may appear only when the data actually
// supplies a count for that material.

import FilterSidebar from "../../../src/components/shop/FilterSidebar.jsx";

const baseProps = {
  categories: [],
  selectedCategories: [],
  onCategoryChange: vi.fn(),
  priceRange: { min: 0, max: 500000 },
  selectedPriceRange: { min: 0, max: 500000 },
  onPriceChange: vi.fn(),
  selectedColors: [],
  onColorChange: vi.fn(),
  selectedMaterials: [],
  onMaterialChange: vi.fn(),
  selectedRating: 0,
  onRatingChange: vi.fn(),
  onResetFilters: vi.fn(),
};

describe("FilterSidebar material counts (FE-14)", () => {
  it("renders material names with no count badge when no counts are supplied", () => {
    render(<FilterSidebar {...baseProps} />);

    expect(screen.getByText("Velvet")).toBeInTheDocument();
    expect(screen.getByText("Leather")).toBeInTheDocument();
    expect(screen.getByText("Wood")).toBeInTheDocument();
    // None of the hardcoded constants may appear.
    expect(screen.queryByText("12")).not.toBeInTheDocument();
    expect(screen.queryByText("19")).not.toBeInTheDocument();
    expect(screen.queryByText("32")).not.toBeInTheDocument();
    expect(screen.queryByText("11")).not.toBeInTheDocument();
    expect(screen.queryByText("9")).not.toBeInTheDocument();
  });

  it("renders material names with no count badge when materialCounts is empty", () => {
    render(<FilterSidebar {...baseProps} materialCounts={{}} />);

    expect(screen.getByText("Fabric")).toBeInTheDocument();
    expect(screen.queryByText("9")).not.toBeInTheDocument();
    expect(screen.queryByText("32")).not.toBeInTheDocument();
  });

  it("shows a count badge only for materials whose count is supplied", () => {
    render(
      <FilterSidebar {...baseProps} materialCounts={{ Velvet: 7, Wood: 3 }} />
    );

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    // Leather's hardcoded 19 must not leak in for an unsupplied material.
    expect(screen.queryByText("19")).not.toBeInTheDocument();
    expect(screen.queryByText("12")).not.toBeInTheDocument();
  });
});

// FE-23 regression tests: the displayed price range must be the applied
// range, the checkbox component must not be recreated per render, and
// the rating filter must be visible/clearable.
describe("FilterSidebar price range + checkbox identity (FE-23)", () => {
  const priceProps = {
    ...baseProps,
    priceRange: { min: 0, max: 500000 },
    selectedPriceRange: { min: 0, max: 500000 },
  };

  function priceInputs() {
    const boxes = screen.getAllByRole("textbox");
    return { minInput: boxes[0], maxInput: boxes[1] };
  }

  it("displays the applied (unfiltered) range, not hardcoded 5,000–200,000", () => {
    render(<FilterSidebar {...priceProps} />);
    const { minInput, maxInput } = priceInputs();
    expect(minInput.value).toBe("0");
    expect(maxInput.value).toBe("500,000");
  });

  it("blurring an unedited price input applies nothing", () => {
    const onPriceChange = vi.fn();
    render(<FilterSidebar {...priceProps} onPriceChange={onPriceChange} />);
    const { minInput, maxInput } = priceInputs();
    fireEvent.blur(minInput);
    fireEvent.blur(maxInput);
    expect(onPriceChange).not.toHaveBeenCalled();
  });

  it("resyncs the displayed range when the applied range changes (URL / back-forward)", () => {
    const { rerender } = render(<FilterSidebar {...priceProps} />);
    rerender(
      <FilterSidebar
        {...priceProps}
        selectedPriceRange={{ min: 10000, max: 50000 }}
      />
    );
    const { minInput, maxInput } = priceInputs();
    expect(minInput.value).toBe("10,000");
    expect(maxInput.value).toBe("50,000");
  });

  it("reset displays and submits the same unfiltered range", () => {
    const onPriceChange = vi.fn();
    render(
      <FilterSidebar
        {...priceProps}
        selectedPriceRange={{ min: 10000, max: 50000 }}
        onPriceChange={onPriceChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "RESET" }));
    expect(onPriceChange).toHaveBeenCalledWith({ min: 0, max: 500000 });
    const { minInput, maxInput } = priceInputs();
    expect(minInput.value).toBe("0");
    expect(maxInput.value).toBe("500,000");
  });

  it("clamps an inverted range before submitting (min never exceeds max)", () => {
    const onPriceChange = vi.fn();
    render(<FilterSidebar {...priceProps} onPriceChange={onPriceChange} />);
    const { minInput, maxInput } = priceInputs();
    fireEvent.change(minInput, { target: { value: "9000" } });
    fireEvent.change(maxInput, { target: { value: "1000" } });
    fireEvent.blur(maxInput);
    expect(onPriceChange).toHaveBeenCalled();
    const submitted = onPriceChange.mock.calls.at(-1)[0];
    expect(submitted.min).toBeLessThanOrEqual(submitted.max);
    expect(submitted).toEqual({ min: 1000, max: 9000 });
  });

  it("clamps values beyond the catalogue range before submitting", () => {
    const onPriceChange = vi.fn();
    render(
      <FilterSidebar
        {...priceProps}
        selectedPriceRange={{ min: 0, max: 100000 }}
        onPriceChange={onPriceChange}
      />
    );
    const { maxInput } = priceInputs();
    fireEvent.change(maxInput, { target: { value: "999999999" } });
    fireEvent.blur(maxInput);
    expect(onPriceChange).toHaveBeenCalledWith({ min: 0, max: 500000 });
  });

  it("does not remount checkbox rows when the sidebar re-renders (typing in the price field)", () => {
    const categories = [
      { _id: "cat-1", slug: "sofas", name: "Sofas", productCount: 3 },
    ];
    const { container } = render(
      <FilterSidebar {...priceProps} categories={categories} />
    );
    const labelBefore = [...container.querySelectorAll("label")].find(
      (el) => el.textContent.includes("Sofas")
    );
    expect(labelBefore).toBeTruthy();

    const { minInput } = priceInputs();
    fireEvent.change(minInput, { target: { value: "100" } });

    const labelAfter = [...container.querySelectorAll("label")].find(
      (el) => el.textContent.includes("Sofas")
    );
    // Same DOM node: the checkbox subtree was NOT unmounted/remounted.
    expect(labelAfter).toBe(labelBefore);
  });

  it("renders the rating filter and lets the user clear it", () => {
    const onRatingChange = vi.fn();
    render(
      <FilterSidebar
        {...priceProps}
        selectedRating={4}
        onRatingChange={onRatingChange}
      />
    );
    expect(
      screen.getByRole("button", { name: /4 stars/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /any rating/i }));
    expect(onRatingChange).toHaveBeenCalledWith(0);
  });

  it("selecting a rating in the sidebar reports it upward", () => {
    const onRatingChange = vi.fn();
    render(<FilterSidebar {...priceProps} onRatingChange={onRatingChange} />);
    fireEvent.click(screen.getByRole("button", { name: /3 stars/i }));
    expect(onRatingChange).toHaveBeenCalledWith(3);
  });
});
