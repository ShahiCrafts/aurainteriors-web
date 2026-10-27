// FE-34 — shared Pagination renders garbage (incl. literal "NaN") for
// out-of-range / undefined props.
//
// Before the fix the only guard was `totalPages <= 1`: while an admin
// query was still loading (pagination = {} at every call site) page and
// totalItems were undefined and the component rendered
// "Showing NaN to NaN of NaN"; after deleting the last item on a page,
// page could exceed totalPages and prev/next fired backwards changes.
//
// Fix contract (src/components/common/Pagination.jsx):
//  - page/totalPages not finite numbers -> render nothing (loading).
//  - page is clamped into [1, totalPages]; the displayed range, the
//    numbered buttons, aria-current and the prev/next disabled states
//    all derive from the CLAMPED page.
//  - totalItems defaults to 0 (never NaN); pageSize defaults safely.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Pagination from "../../../src/components/common/Pagination.jsx";

describe("FE-34 Pagination undefined inputs", () => {
  it("page/totalPages/totalItems all undefined (query still loading) renders nothing, no NaN", () => {
    const { container } = render(
      <Pagination page={undefined} totalPages={undefined} pageSize={10} totalItems={undefined} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(container.textContent).not.toContain("NaN");
  });

  it("page undefined with otherwise valid props renders nothing", () => {
    const { container } = render(
      <Pagination page={undefined} totalPages={5} pageSize={10} totalItems={50} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("totalItems undefined alone defaults to 0 and never renders NaN", () => {
    const { container } = render(
      <Pagination page={1} totalPages={5} pageSize={10} totalItems={undefined} onPageChange={vi.fn()} />
    );
    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).toContain("of 0");
  });

  it("pen: NaN page / NaN totalPages render nothing instead of NaN text", () => {
    const a = render(
      <Pagination page={NaN} totalPages={5} pageSize={10} totalItems={50} onPageChange={vi.fn()} />
    );
    expect(a.container).toBeEmptyDOMElement();
    a.unmount();
    const b = render(
      <Pagination page={1} totalPages={NaN} pageSize={10} totalItems={50} onPageChange={vi.fn()} />
    );
    expect(b.container).toBeEmptyDOMElement();
  });
});

describe("FE-34 Pagination clamping", () => {
  it("page=9 with 3 pages clamps the display, buttons and disabled states to page 3", () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination page={9} totalPages={3} pageSize={10} totalItems={25} onPageChange={onPageChange} />
    );
    expect(container.textContent).toContain("Showing 21 to 25 of 25");
    expect(container.textContent).not.toContain("NaN");
    // The clamped page is the current page.
    expect(screen.getByRole("button", { name: "3" })).toHaveAttribute("aria-current", "page");
    // Next is disabled on the (clamped) last page; prev is enabled and
    // steps back from the CLAMPED page (3 -> 2), never 9 -> 8.
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    const prev = screen.getByRole("button", { name: "Previous page" });
    expect(prev).not.toBeDisabled();
    fireEvent.click(prev);
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("pen: clicking disabled Next on a clamped last page fires no backwards/spurious change", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={9} totalPages={3} pageSize={10} totalItems={25} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("page=0 clamps to page 1: prev disabled, range starts at 1, next steps to 2", () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination page={0} totalPages={3} pageSize={10} totalItems={25} onPageChange={onPageChange} />
    );
    expect(container.textContent).toContain("Showing 1 to 10 of 25");
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("pen: negative page and negative totalItems never render negative/NaN ranges", () => {
    const { container } = render(
      <Pagination page={-4} totalPages={3} pageSize={10} totalItems={-5} onPageChange={vi.fn()} />
    );
    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).not.toContain("-");
    expect(container.textContent).toContain("of 0");
  });

  it("pen: fractional page is normalised to an integer page", () => {
    const { container } = render(
      <Pagination page={2.7} totalPages={5} pageSize={10} totalItems={50} onPageChange={vi.fn()} />
    );
    expect(container.textContent).toContain("Showing 11 to 20 of 50");
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
  });
});

describe("FE-34 Pagination in-range behaviour unchanged", () => {
  it("normal rendering: range, current button, prev/next steps", () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination page={2} totalPages={5} pageSize={10} totalItems={50} onPageChange={onPageChange} />
    );
    expect(container.textContent).toContain("Showing 11 to 20 of 50");
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("totalPages <= 1 still renders nothing", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} pageSize={10} totalItems={5} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("last in-range page: end clamps to totalItems and next is disabled", () => {
    const { container } = render(
      <Pagination page={3} totalPages={3} pageSize={10} totalItems={25} onPageChange={vi.fn()} />
    );
    expect(container.textContent).toContain("Showing 21 to 25 of 25");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
});
