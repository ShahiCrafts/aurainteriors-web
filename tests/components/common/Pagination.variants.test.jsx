// Wave A (components program) — Pagination variants added to the
// shared component so the five hand-rolled pagers could migrate
// onto it: variant="simple" (KnowledgeBase / Announcements /
// Notifications) and theme="customer" numbered (Wishlist /
// OrdersSection). The FE-34 admin-numbered contract lives in
// Pagination.fe34.test.jsx and is unchanged.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Pagination from "../../../src/components/common/Pagination.jsx";

describe("Pagination variant=simple", () => {
  it("renders a centred 'Page X of Y' with labelled prev/next that step from the current page", () => {
    const onPageChange = vi.fn();
    render(<Pagination variant="simple" page={2} totalPages={5} onPageChange={onPageChange} />);
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables prev on page 1 and next on the last page", () => {
    const { rerender } = render(<Pagination variant="simple" page={1} totalPages={4} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).not.toBeDisabled();
    rerender(<Pagination variant="simple" page={4} totalPages={4} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("the disabled prop blocks both buttons (NotificationsPage loading state)", () => {
    const onPageChange = vi.fn();
    render(<Pagination variant="simple" page={2} totalPages={5} onPageChange={onPageChange} disabled />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("clamps an out-of-range page in the label and steps from the clamped page", () => {
    const onPageChange = vi.fn();
    render(<Pagination variant="simple" page={9} totalPages={3} onPageChange={onPageChange} />);
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("renders nothing for a single page or non-finite inputs (FE-34 guards apply)", () => {
    const a = render(<Pagination variant="simple" page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(a.container).toBeEmptyDOMElement();
    a.unmount();
    const b = render(<Pagination variant="simple" page={undefined} totalPages={undefined} onPageChange={vi.fn()} />);
    expect(b.container).toBeEmptyDOMElement();
  });
});

describe("Pagination theme=customer (numbered)", () => {
  it("windows with first/last + neighbours and ellipses for large totals", () => {
    render(<Pagination theme="customer" page={6} totalPages={12} onPageChange={vi.fn()} />);
    for (const label of ["1", "5", "6", "7", "12"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "3" })).toBeNull();
    expect(screen.queryByRole("button", { name: "10" })).toBeNull();
    // Two gaps: 1…5 and 7…12.
    expect(document.body.textContent.match(/…/g)).toHaveLength(2);
    expect(screen.getByRole("button", { name: "6" })).toHaveAttribute("aria-current", "page");
  });

  it("shows every page when the window covers the total (no ellipses)", () => {
    render(<Pagination theme="customer" page={2} totalPages={4} onPageChange={vi.fn()} />);
    for (const label of ["1", "2", "3", "4"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(document.body.textContent).not.toContain("…");
  });

  it("labelled prev/next step and disable at the bounds; numbered buttons jump", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination theme="customer" page={1} totalPages={4} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    rerender(<Pagination theme="customer" page={4} totalPages={4} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("renders nothing for a single page (FE-34 guard applies)", () => {
    const { container } = render(<Pagination theme="customer" page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
