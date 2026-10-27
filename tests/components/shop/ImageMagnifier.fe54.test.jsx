// FE-54 (c) — ImageMagnifier layout thrash + positioning mismatch.
//
// Pre-fix: every mousemove called getBoundingClientRect() (forced
// layout) AND a state write re-rendering the subtree, with no
// rAF/throttle; and the lens used backgroundSize in px with
// backgroundPosition in % — the two do not compose, so the magnified
// region drifted from the cursor at the edges.
//
// Post-fix contract pinned here:
//  - pointer moves are coalesced through requestAnimationFrame: a
//    burst of moves before a frame does ZERO rect reads, and one
//    frame does at most ONE rect read (the rect is cached and only
//    invalidated by scroll/resize or a new hover session);
//  - positioning math is all-px: backgroundSize = container * zoom,
//    backgroundPosition = -(cursor * zoom - lens/2), and the lens
//    itself is positioned with a transform — so the point under the
//    cursor is at the lens centre, corners included.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import ImageMagnifier from "../../../src/components/shop/ImageMagnifier.jsx";

const SRC = "https://res.cloudinary.com/demo/image/upload/sofa.jpg";
const RECT = {
  left: 0,
  top: 0,
  width: 200,
  height: 100,
  right: 200,
  bottom: 100,
  x: 0,
  y: 0,
  toJSON: () => ({}),
};

let rectReads;
let rafCallbacks;

beforeEach(() => {
  rectReads = 0;
  rafCallbacks = new Map();
  let nextId = 1;
  vi.stubGlobal("requestAnimationFrame", (cb) => {
    const id = nextId++;
    rafCallbacks.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id) => {
    rafCallbacks.delete(id);
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => {
      rectReads += 1;
      return { ...RECT };
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function flushFrame() {
  const callbacks = [...rafCallbacks.values()];
  rafCallbacks.clear();
  act(() => {
    callbacks.forEach((cb) => cb(performance.now()));
  });
}

function renderMagnifier() {
  const utils = render(
    <ImageMagnifier src={SRC} alt="Sofa" magnifierSize={100} zoomLevel={2.5} />
  );
  const img = utils.container.querySelector("img");
  const containerEl = img.parentElement;
  return { ...utils, img, containerEl };
}

function lens(container) {
  return container.querySelector(".rounded-full");
}

describe("ImageMagnifier (FE-54)", () => {
  it("a burst of mousemove events produces at most one rect read per animation frame", () => {
    const { containerEl, container } = renderMagnifier();
    fireEvent.mouseEnter(containerEl);
    for (let i = 0; i < 8; i++) {
      fireEvent.mouseMove(containerEl, { clientX: 40 + i, clientY: 30 });
    }
    // Nothing has been read or rendered yet — moves only schedule.
    expect(rectReads).toBe(0);
    expect(lens(container)).toBeNull();

    flushFrame();
    expect(rectReads).toBe(1);
    expect(lens(container)).not.toBeNull();

    // More moves in the NEXT frame reuse the cached rect.
    for (let i = 0; i < 5; i++) {
      fireEvent.mouseMove(containerEl, { clientX: 60 + i, clientY: 35 });
    }
    flushFrame();
    expect(rectReads).toBe(1);
  });

  it("scroll invalidates the cached rect (the next frame re-reads it once)", () => {
    const { containerEl } = renderMagnifier();
    fireEvent.mouseEnter(containerEl);
    fireEvent.mouseMove(containerEl, { clientX: 50, clientY: 40 });
    flushFrame();
    expect(rectReads).toBe(1);

    fireEvent.scroll(window);
    fireEvent.mouseMove(containerEl, { clientX: 55, clientY: 40 });
    flushFrame();
    expect(rectReads).toBe(2);
  });

  it("positioning math: the cursor point sits at the lens centre, corners included", () => {
    const { containerEl, container } = renderMagnifier();
    fireEvent.mouseEnter(containerEl);

    // Top-left corner: background offset is +lens/2 (not 0%), size is px.
    fireEvent.mouseMove(containerEl, { clientX: 0, clientY: 0 });
    flushFrame();
    let el = lens(container);
    expect(el.style.backgroundSize).toBe("500px 250px");
    expect(el.style.backgroundPosition).toBe("50px 50px");
    expect(el.style.transform).toBe("translate(-50px, -50px)");

    // Bottom-right corner: -(200*2.5-50) = -450, -(100*2.5-50) = -200.
    fireEvent.mouseMove(containerEl, { clientX: 200, clientY: 100 });
    flushFrame();
    el = lens(container);
    expect(el.style.backgroundPosition).toBe("-450px -200px");
    expect(el.style.transform).toBe("translate(150px, 50px)");

    // Centre: -(100*2.5-50) = -200, -(50*2.5-50) = -75.
    fireEvent.mouseMove(containerEl, { clientX: 100, clientY: 50 });
    flushFrame();
    el = lens(container);
    expect(el.style.backgroundPosition).toBe("-200px -75px");
    expect(el.style.transform).toBe("translate(50px, 0px)");
  });

  it("leaving hides the lens and a pending frame does not resurrect it", () => {
    const { containerEl, container } = renderMagnifier();
    fireEvent.mouseEnter(containerEl);
    fireEvent.mouseMove(containerEl, { clientX: 50, clientY: 40 });
    fireEvent.mouseLeave(containerEl);
    flushFrame();
    expect(lens(container)).toBeNull();
  });
});
