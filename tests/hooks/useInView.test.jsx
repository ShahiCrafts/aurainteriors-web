// FE-32 (implementation 1) — useInView must observe an element that
// mounts AFTER the hook's first effect run (conditional/async render).
// Pre-fix the effect read ref.current once with deps [once]; a null at
// that moment meant the element was never observed and isInView stayed
// false forever.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import useInView from "../../src/hooks/useInView";

let observerCallback = null;
let observedElements = [];
let MockIO;

beforeEach(() => {
  observerCallback = null;
  observedElements = [];
  MockIO = class {
    constructor(cb) {
      observerCallback = cb;
    }
    observe(el) {
      observedElements.push(el);
    }
    unobserve() {}
    disconnect() {}
  };
  window.IntersectionObserver = MockIO;
});

afterEach(() => {
  delete window.IntersectionObserver;
});

function Probe({ show, once = true }) {
  const [ref, isInView] = useInView({}, once);
  if (!show) return <div>placeholder</div>;
  return (
    <div ref={ref} data-testid="target">
      {isInView ? "in-view" : "not-in-view"}
    </div>
  );
}

function intersect(isIntersecting = true) {
  act(() => {
    observerCallback?.([{ isIntersecting }]);
  });
}

describe("FE-32 useInView", () => {
  it("observes an element present at first render and flips on intersect", () => {
    render(<Probe show />);
    expect(observedElements).toHaveLength(1);
    expect(screen.getByTestId("target")).toHaveTextContent("not-in-view");
    intersect(true);
    expect(screen.getByTestId("target")).toHaveTextContent("in-view");
  });

  it("observes an element mounted LATER (conditional render after first effect)", () => {
    const { rerender } = render(<Probe show={false} />);
    // Nothing mounted yet — nothing observed, no crash.
    expect(observedElements).toHaveLength(0);

    rerender(<Probe show />);
    // The late-mounted element must be observed…
    expect(observedElements).toHaveLength(1);
    expect(observedElements[0]).toBe(screen.getByTestId("target"));
    // …and intersecting it flips isInView.
    intersect(true);
    expect(screen.getByTestId("target")).toHaveTextContent("in-view");
  });

  it("once=false: leaving the viewport flips isInView back to false", () => {
    render(<Probe show once={false} />);
    intersect(true);
    expect(screen.getByTestId("target")).toHaveTextContent("in-view");
    intersect(false);
    expect(screen.getByTestId("target")).toHaveTextContent("not-in-view");
  });

  it("PEN: unmount + remount re-observes the element and it can still flip in-view", () => {
    const { rerender } = render(<Probe show />);
    expect(observedElements).toHaveLength(1);
    rerender(<Probe show={false} />);
    rerender(<Probe show />);
    // React may reuse the DOM node across the placeholder swap; what
    // matters is that observe() ran again for the remounted element.
    expect(observedElements.length).toBeGreaterThanOrEqual(2);
    expect(observedElements[observedElements.length - 1]).toBe(
      screen.getByTestId("target"),
    );
    intersect(true);
    expect(screen.getByTestId("target")).toHaveTextContent("in-view");
  });
});

// FE-32 (implementation 2) — ShopByCategory: the category-tree request
// must NOT fire until the section is near the viewport.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { waitFor } from "@testing-library/react";

vi.mock("../../src/api/categoryApi", () => ({
  default: { getTree: vi.fn(async () => ({ data: { categories: [] } })) },
}));

import categoryApi from "../../src/api/categoryApi";
import ShopByCategory from "../../src/components/sections/ShopByCategory";

describe("FE-32 ShopByCategory viewport gating", () => {
  it("issues no category request until the section scrolls into view", async () => {
    categoryApi.getTree.mockClear();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ShopByCategory />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Give React Query every chance to (wrongly) fire.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(categoryApi.getTree).not.toHaveBeenCalled();

    // Scroll into view -> the deferred fetch fires.
    intersect(true);
    await waitFor(() => expect(categoryApi.getTree).toHaveBeenCalledTimes(1));
  });
});
