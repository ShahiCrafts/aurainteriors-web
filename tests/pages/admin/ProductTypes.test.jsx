import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

// Phase 6 (catalog) — product types admin: the key is immutable on
// edit and attributeKeys are picked from the definition registry.

const TYPE = {
  key: "sofa",
  label: "Sofa",
  description: "",
  categoryKey: "furniture",
  attributeKeys: ["frameMaterial"],
  active: true,
  sortOrder: 0,
};

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useProductTypes: () => ({ data: { data: { productTypes: [TYPE] } }, isLoading: false, error: null }),
  useCreateProductType: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useUpdateProductType: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useDeleteProductType: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useAttributeDefinitions: () => ({
    data: {
      data: {
        attributeDefinitions: [
          { key: "frameMaterial", label: "Frame Material", type: "enum", storage: "catalogAttributes", active: true },
          { key: "seatCount", label: "Seat Count", type: "integer", storage: "catalogAttributes", active: true },
        ],
      },
    },
    isLoading: false,
  }),
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

import ProductTypes from "../../../src/pages/admin/ProductTypes";

describe("Product types admin (Phase 6)", () => {
  it("disables the key on edit and pre-checks its attributeKeys", async () => {
    render(<ProductTypes />);

    const row = screen.getByTestId("product-type-row-sofa");
    expect(within(row).getByText("Sofa")).toBeInTheDocument();

    fireEvent.click(within(row).getByTitle("Edit"));
    const keyInput = screen.getByLabelText(/^Key/);
    expect(keyInput).toHaveValue("sofa");
    expect(keyInput).toBeDisabled();

    expect(screen.getByLabelText(/^Frame Material/)).toBeChecked();
    expect(screen.getByLabelText(/^Seat Count/)).not.toBeChecked();
  });
});
