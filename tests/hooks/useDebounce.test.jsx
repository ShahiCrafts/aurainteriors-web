import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

// Unit tests for src/hooks/useDebounce.js — fake timers pin the
// trailing-edge behaviour the search/filter inputs rely on: rapid
// changes collapse into one update after the delay, and unmounting
// cancels a pending update.

import useDebounce from "../../src/hooks/useDebounce.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("sofa", 300));

    expect(result.current).toBe("sofa");
  });

  it("should only expose the new value after the delay when the value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "so" } },
    );

    rerender({ value: "sofa" });
    expect(result.current).toBe("so");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("so");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("sofa");
  });

  it("should collapse rapid changes into a single trailing update", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "s" } },
    );

    rerender({ value: "so" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "sof" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "sofa" });

    // 400ms have passed since the first change, but every change
    // reset the timer — nothing has been exposed yet.
    expect(result.current).toBe("s");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("sofa");
  });

  it("should never apply a pending update after unmount", () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "so" } },
    );

    rerender({ value: "sofa" });
    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe("so");
  });
});
