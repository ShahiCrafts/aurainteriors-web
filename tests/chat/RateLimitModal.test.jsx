import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import RateLimitModal from "../../src/components/chat/RateLimitModal.jsx";

// FE-20a: the modal is mounted for the composer's whole lifetime with
// an initial retryAfter of 900, and useState(retryAfter) captured only
// that first value — the countdown almost never showed the server's
// actual retryAfter, a second incident showed stale/00:00, and
// reaching zero did nothing. Pin: opening syncs to the prop, the
// countdown tracks a real deadline, expiry closes the modal.

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("RateLimitModal countdown sync (FE-20)", () => {
  it("shows the server's retryAfter when opened, not the mount-time 900", () => {
    const { rerender } = render(
      <RateLimitModal isOpen={false} onClose={vi.fn()} retryAfter={900} />,
    );
    rerender(
      <RateLimitModal isOpen={true} onClose={vi.fn()} retryAfter={60} />,
    );
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.queryByText("15:00")).not.toBeInTheDocument();
  });

  it("a second incident re-syncs instead of showing the stale remainder", () => {
    const { rerender } = render(
      <RateLimitModal isOpen={true} onClose={vi.fn()} retryAfter={60} />,
    );
    expect(screen.getByText("01:00")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(60_000);
    }); // first incident expires
    rerender(
      <RateLimitModal isOpen={false} onClose={vi.fn()} retryAfter={60} />,
    );
    rerender(
      <RateLimitModal isOpen={true} onClose={vi.fn()} retryAfter={30} />,
    );
    expect(screen.getByText("00:30")).toBeInTheDocument();
  });

  it("counts down once per second toward the deadline", () => {
    render(<RateLimitModal isOpen={true} onClose={vi.fn()} retryAfter={90} />);
    expect(screen.getByText("01:30")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("closes (re-enables) when the countdown reaches zero", () => {
    const onClose = vi.fn();
    render(<RateLimitModal isOpen={true} onClose={onClose} retryAfter={5} />);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("changing retryAfter while open resets the countdown (pen-test: fresher server value wins)", () => {
    const { rerender } = render(
      <RateLimitModal isOpen={true} onClose={vi.fn()} retryAfter={300} />,
    );
    expect(screen.getByText("05:00")).toBeInTheDocument();
    rerender(
      <RateLimitModal isOpen={true} onClose={vi.fn()} retryAfter={45} />,
    );
    expect(screen.getByText("00:45")).toBeInTheDocument();
  });

  it("a non-finite retryAfter never renders NaN (pen-test: missing/garbage value)", () => {
    render(
      <RateLimitModal
        isOpen={true}
        onClose={vi.fn()}
        retryAfter={Number.NaN}
      />,
    );
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
