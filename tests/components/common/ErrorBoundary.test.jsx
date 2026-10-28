// FE-56 / FE-17 — ErrorBoundary + route loading fallback.
// Pre-fix: no ErrorBoundary existed anywhere in src/ and the customer
// LoadingSpinner returned null, so these imports/tests fail outright.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../../../src/components/common/ErrorBoundary.jsx";
import { RouteSkeleton } from "../../../src/components/common/Skeleton.jsx";

function Thrower() {
  throw new Error("SECRET_ERROR_TEXT_SHOULD_NOT_RENDER");
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary (FE-56)", () => {
  it("renders fallback with Reload + Home and keeps siblings alive", () => {
    render(
      <div>
        <span>outside-survives</span>
        <ErrorBoundary>
          <Thrower />
        </ErrorBoundary>
      </div>,
    );
    expect(screen.getByText("outside-survives")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
  });

  it("never renders the caught error message/stack in the fallback", () => {
    const { container } = render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>,
    );
    expect(container.textContent).not.toContain(
      "SECRET_ERROR_TEXT_SHOULD_NOT_RENDER",
    );
    expect(container.textContent).not.toMatch(/at Thrower|stack/i);
  });

  it("changing resetKey clears the error and re-renders children", () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error("boom-secret");
      return <div>recovered-child</div>;
    }
    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <MaybeThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKey="/b">
        <MaybeThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("recovered-child")).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });
});

describe("RouteSkeleton (route loading fallback)", () => {
  it("renders a visible shimmer fallback with role=status and an accessible label (not null, no spinner)", () => {
    const { container } = render(<RouteSkeleton />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("animate-spin");
  });
});
