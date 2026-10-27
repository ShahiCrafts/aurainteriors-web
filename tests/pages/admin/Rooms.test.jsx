import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

// Phase 6 (catalog) — rooms admin: the slug is immutable on edit
// (the server rejects slug changes with a 400; the UI disables the
// field and says why).

const ROOM = {
  slug: "living-room",
  label: "Living Room",
  description: "Sofas and seating",
  image: "",
  active: true,
  sortOrder: 0,
};

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useRooms: () => ({ data: { data: { rooms: [ROOM] } }, isLoading: false, error: null }),
  useCreateRoom: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useUpdateRoom: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useDeleteRoom: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
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

import Rooms from "../../../src/pages/admin/Rooms";

describe("Rooms admin (Phase 6)", () => {
  it("renders the room and disables the slug on edit", async () => {
    render(<Rooms />);

    const row = screen.getByTestId("room-row-living-room");
    expect(within(row).getByText("Living Room")).toBeInTheDocument();

    fireEvent.click(within(row).getByTitle("Edit"));
    const slugInput = screen.getByLabelText(/^Slug/);
    expect(slugInput).toHaveValue("living-room");
    expect(slugInput).toBeDisabled();
    expect(screen.getByLabelText(/^Label/)).toHaveValue("Living Room");
  });
});
