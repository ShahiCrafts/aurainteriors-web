import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

// Phase 6 (catalog) — the attribute manager lists definitions with
// their flags, keeps the key immutable on edit, edits allowed
// values for enum types, and surfaces the server's guards (type
// change blocked while in use; hard delete blocked) verbatim.

const createMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const updateMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const deleteMutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const DEFINITIONS = [
  {
    key: "frameMaterial",
    label: "Frame Material",
    type: "enum",
    allowedValues: ["Oak", "Pine"],
    acceptedUnits: [],
    filterable: true,
    sortable: false,
    comparable: true,
    required: false,
    active: true,
    storage: "catalogAttributes",
    appliesTo: "assigned",
    displayGroup: "Construction",
    sortOrder: 1,
  },
  {
    key: "weight",
    label: "Weight",
    type: "measurement",
    unit: "kg",
    allowedValues: [],
    acceptedUnits: ["kg", "lb"],
    filterable: false,
    sortable: true,
    comparable: false,
    required: false,
    active: true,
    storage: "field",
    fieldPath: "weight",
    appliesTo: "all",
    displayGroup: "Specifications",
    sortOrder: 2,
  },
  {
    key: "legacyCode",
    label: "Legacy Code",
    type: "string",
    allowedValues: [],
    acceptedUnits: [],
    filterable: false,
    sortable: false,
    comparable: false,
    required: false,
    active: false,
    storage: "catalogAttributes",
    appliesTo: "all",
    displayGroup: "",
    sortOrder: 3,
  },
];

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useAttributeDefinitions: () => ({
    data: { data: { attributeDefinitions: DEFINITIONS } },
    isLoading: false,
    error: null,
  }),
  useCreateAttributeDefinition: () => ({
    mutateAsync: createMutate,
    isPending: false,
  }),
  useUpdateAttributeDefinition: () => ({
    mutateAsync: updateMutate,
    isPending: false,
  }),
  useDeleteAttributeDefinition: () => ({
    mutateAsync: deleteMutate,
    isPending: false,
  }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import Attributes from "../../../src/pages/admin/Attributes";

describe("Attributes admin (Phase 6)", () => {
  beforeEach(() => {
    createMutate.mockClear();
    updateMutate.mockClear();
    deleteMutate.mockClear();
    updateMutate.mockResolvedValue({});
  });

  it("lists definitions with type, storage and flag chips", () => {
    render(<Attributes />);

    const row = screen.getByTestId("attribute-row-frameMaterial");
    expect(within(row).getByText("Frame Material")).toBeInTheDocument();
    expect(within(row).getByText("enum")).toBeInTheDocument();
    expect(within(row).getByText("Filterable")).toBeInTheDocument();
    expect(within(row).getByText("Comparable")).toBeInTheDocument();

    const weightRow = screen.getByTestId("attribute-row-weight");
    expect(within(weightRow).getByText("Field: weight")).toBeInTheDocument();

    const legacyRow = screen.getByTestId("attribute-row-legacyCode");
    expect(within(legacyRow).getByText("Inactive")).toBeInTheDocument();
  });

  it("keeps the key immutable on edit and shows the allowed-values editor for enums", () => {
    render(<Attributes />);

    const row = screen.getByTestId("attribute-row-frameMaterial");
    fireEvent.click(within(row).getByTitle("Edit"));

    const keyInput = screen.getByLabelText(/^Key/);
    expect(keyInput).toHaveValue("frameMaterial");
    expect(keyInput).toBeDisabled();

    // Allowed values arrive as removable chips.
    expect(screen.getByText("Oak")).toBeInTheDocument();
    expect(screen.getByText("Pine")).toBeInTheDocument();
  });

  it("surfaces the server's type-change block instead of a fake success", async () => {
    updateMutate.mockRejectedValueOnce({
      response: {
        data: {
          message:
            'Cannot change the type or storage of attribute "frameMaterial" while products carry values for it',
        },
      },
    });
    render(<Attributes />);

    const row = screen.getByTestId("attribute-row-frameMaterial");
    fireEvent.click(within(row).getByTitle("Edit"));
    fireEvent.change(screen.getByLabelText(/^Type/), {
      target: { value: "string" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText(
        /Cannot change the type or storage of attribute "frameMaterial"/,
      ),
    ).toBeInTheDocument();
    expect(updateMutate).toHaveBeenCalledWith({
      key: "frameMaterial",
      data: expect.objectContaining({ type: "string" }),
    });
  });

  it("creates a definition with key, label and type", async () => {
    render(<Attributes />);

    fireEvent.click(screen.getByRole("button", { name: "Add Attribute" }));
    fireEvent.change(screen.getByLabelText(/^Key/), {
      target: { value: "seatDepth" },
    });
    fireEvent.change(screen.getByLabelText(/^Label/), {
      target: { value: "Seat Depth" },
    });
    fireEvent.change(screen.getByLabelText(/^Type/), {
      target: { value: "decimal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Attribute" }));

    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        key: "seatDepth",
        label: "Seat Depth",
        type: "decimal",
      }),
    );
  });

  it("hard delete passes hard=true to the mutation", async () => {
    render(<Attributes />);

    const row = screen.getByTestId("attribute-row-legacyCode");
    fireEvent.click(within(row).getByTitle("Delete"));
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete permanently" }),
    );

    expect(deleteMutate).toHaveBeenCalledWith({
      key: "legacyCode",
      hard: true,
    });
  });
});
