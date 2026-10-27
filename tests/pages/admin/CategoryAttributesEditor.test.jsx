import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

// Phase 6 (catalog) — the per-category assignment editor separates
// inherited attributes (read-only, source-labelled) from the
// category's own assignments (editable), and saves the own list
// through the atomic PUT.

const setAssignmentsMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const DEFINITIONS = [
  { key: "frameMaterial", label: "Frame Material", type: "enum", allowedValues: ["Oak", "Pine"], storage: "catalogAttributes", active: true },
  { key: "warrantyYears", label: "Warranty (years)", type: "integer", storage: "catalogAttributes", active: true },
  { key: "careInstructions", label: "Care Instructions", type: "string", storage: "catalogAttributes", active: true },
];

const RESOLVED = [
  { key: "frameMaterial", label: "Frame Material", type: "enum", allowedValues: ["Oak", "Pine"], storage: "catalogAttributes", required: false, source: "global" },
  { key: "warrantyYears", label: "Warranty (years)", type: "integer", storage: "catalogAttributes", required: false, source: "category", sourceCategoryId: "root1" },
  { key: "careInstructions", label: "Care Instructions", type: "string", storage: "catalogAttributes", required: true, source: "category", sourceCategoryId: "cat1" },
];

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useAttributeDefinitions: () => ({ data: { data: { attributeDefinitions: DEFINITIONS } }, isLoading: false }),
  useCategoryAssignments: () => ({
    data: { data: { assignments: [{ attributeKey: "careInstructions", required: true }] } },
    isLoading: false,
  }),
  useCategoryAttributes: () => ({ data: { data: { attributes: RESOLVED } }, isLoading: false }),
  useSetCategoryAssignments: () => ({ mutateAsync: setAssignmentsMutate, isPending: false }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import CategoryAttributesEditor from "../../../src/components/admin/catalog/CategoryAttributesEditor";

const CATEGORIES = [
  { _id: "root1", name: "Furniture" },
  { _id: "cat1", name: "Sofas" },
];

describe("CategoryAttributesEditor (Phase 6)", () => {
  beforeEach(() => {
    setAssignmentsMutate.mockClear();
  });

  it("labels inherited attributes with their source and own assignments as set here", () => {
    render(
      <CategoryAttributesEditor
        category={{ _id: "cat1", name: "Sofas" }}
        categories={CATEGORIES}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Global default")).toBeInTheDocument();
    expect(screen.getByText("Inherited from Furniture")).toBeInTheDocument();
    expect(screen.getByText("Set here")).toBeInTheDocument();

    // Inherited rows are read-only: they offer Override, not inputs.
    const frameRow = screen.getByText("Frame Material").closest("div.border");
    expect(within(frameRow).getByRole("button", { name: "Override here" })).toBeInTheDocument();
    expect(within(frameRow).queryByLabelText("Required")).not.toBeInTheDocument();

    // The own assignment renders editable controls pre-filled from
    // the server list (required: true → "Required").
    const careSelect = screen.getByLabelText("Required", { selector: "#assign-required-careInstructions" });
    expect(careSelect).toHaveValue("required");
  });

  it("deactivating an inherited attribute and saving PUTs the own list atomically", async () => {
    render(
      <CategoryAttributesEditor
        category={{ _id: "cat1", name: "Sofas" }}
        categories={CATEGORIES}
        onClose={vi.fn()}
      />
    );

    const warrantyRow = screen.getByText("Warranty (years)").closest("div.border");
    fireEvent.click(within(warrantyRow).getByRole("button", { name: "Deactivate here" }));
    expect(screen.getByText("Deactivated here")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));

    expect(setAssignmentsMutate).toHaveBeenCalledTimes(1);
    const payload = setAssignmentsMutate.mock.calls[0][0];
    expect(payload.id).toBe("cat1");
    expect(payload.assignments).toEqual(
      expect.arrayContaining([
        { attributeKey: "careInstructions", active: true, required: true },
        { attributeKey: "warrantyYears", active: false },
      ])
    );
    expect(payload.assignments).toHaveLength(2);
  });
});
