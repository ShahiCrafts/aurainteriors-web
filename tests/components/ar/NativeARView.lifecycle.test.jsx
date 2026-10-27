// FE-21 — AR session lifecycle defects.
//
// Before the fix, handleStartAR's catch only set an error string and
// flipped isSessionActive to false: view.create() had already started
// the camera/session, and nothing called view.destroy()/stopSession(),
// so the camera stayed live while the UI said "Camera Access Required".
// A failed product switch likewise left the catalog/price showing the
// new product while the scene still showed the old one; the tutorial's
// "Move" step could never advance (the installed capacitor-arcore
// ARView.enableCustomization wires onTap/onPinch/onRotate only — it
// never forwards the gesture controller's onDrag).
//
// capacitor-arcore cannot run in jsdom, so the plugin is mocked with a
// fake view whose methods are spies; the REAL NativeARView executes.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({ view: null, gestureOptions: null }));

vi.mock("capacitor-arcore", () => ({
  createARView: vi.fn(() => hoisted.view),
}));

import NativeARView from "../../../src/components/ar/NativeARView.jsx";

const productA = {
  _id: "prod-a",
  slug: "chair-a",
  name: "Chair A",
  price: 10000,
  modelUrl: "/models/chair-a.glb",
  images: [],
};
const productB = {
  _id: "prod-b",
  slug: "table-b",
  name: "Table B",
  price: 20000,
  modelUrl: "/models/table-b.glb",
  images: [],
};

function makeView(overrides = {}) {
  const view = {
    engine: {},
    overlay: null,
    activeModelId: null,
    checkSupport: vi.fn().mockResolvedValue({ supported: true }),
    create: vi.fn().mockResolvedValue({}),
    destroy: vi.fn().mockResolvedValue(undefined),
    onFrame: vi.fn(() => vi.fn()),
    preloadModels: vi.fn().mockResolvedValue(undefined),
    enableCustomization: vi.fn((options) => {
      hoisted.gestureOptions = options;
      return vi.fn();
    }),
    placeModel: vi.fn().mockResolvedValue({ success: true, modelId: "anchor-1" }),
    switchModel: vi.fn().mockResolvedValue({ success: true, modelId: "anchor-1" }),
    removeModel: vi.fn().mockResolvedValue(undefined),
    setColor: vi.fn().mockResolvedValue(undefined),
    takeScreenshot: vi.fn(),
    ...overrides,
  };
  return view;
}

function renderView(props = {}) {
  return render(
    <NativeARView
      products={[productA, productB]}
      categories={[]}
      selectedProduct={productA}
      onProductSelect={vi.fn()}
      customization={{}}
      onCustomize={vi.fn()}
      onClose={vi.fn()}
      onAddToCart={vi.fn()}
      {...props}
    />
  );
}

async function startAR() {
  const button = await screen.findByRole("button", { name: "Allow Camera Access" });
  fireEvent.click(button);
}

beforeEach(() => {
  hoisted.view = makeView();
  hoisted.gestureOptions = null;
});

describe("NativeARView failed start (FE-21)", () => {
  it("a preload failure destroys the view (camera/session stopped) and the UI returns to off", async () => {
    hoisted.view = makeView({
      preloadModels: vi.fn().mockRejectedValue(new Error("model 404")),
    });
    renderView();
    await startAR();

    await waitFor(() => expect(hoisted.view.destroy).toHaveBeenCalledTimes(1));
    // UI reflects reality: session is off, start prompt is back.
    expect(await screen.findByRole("button", { name: "Allow Camera Access" })).toBeInTheDocument();
    expect(screen.getByText("model 404")).toBeInTheDocument();
    expect(screen.queryByText("Collection")).not.toBeInTheDocument();
  });

  it("a create() failure also destroys the view", async () => {
    hoisted.view = makeView({
      create: vi.fn().mockRejectedValue(new Error("camera denied")),
    });
    renderView();
    await startAR();

    await waitFor(() => expect(hoisted.view.destroy).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Allow Camera Access" })).toBeInTheDocument();
  });

  it("an enableCustomization failure also destroys the view", async () => {
    hoisted.view = makeView({
      enableCustomization: vi.fn(() => {
        throw new Error("no overlay");
      }),
    });
    renderView();
    await startAR();

    await waitFor(() => expect(hoisted.view.destroy).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Allow Camera Access" })).toBeInTheDocument();
  });

  it("pen: destroy() itself rejecting during cleanup still resets the UI to off", async () => {
    hoisted.view = makeView({
      preloadModels: vi.fn().mockRejectedValue(new Error("model 404")),
      destroy: vi.fn().mockRejectedValue(new Error("stopSession failed")),
    });
    renderView();
    await startAR();

    await waitFor(() => expect(hoisted.view.destroy).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Allow Camera Access" })).toBeInTheDocument();
    expect(screen.getByText("model 404")).toBeInTheDocument();
  });

  it("pen: retry after a failed start calls create() on a destroyed (stopped) view and can succeed", async () => {
    const preload = vi
      .fn()
      .mockRejectedValueOnce(new Error("model 404"))
      .mockResolvedValue(undefined);
    hoisted.view = makeView({ preloadModels: preload });
    renderView();
    await startAR();
    await waitFor(() => expect(hoisted.view.destroy).toHaveBeenCalledTimes(1));

    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    expect(hoisted.view.create).toHaveBeenCalledTimes(2);
    // destroy happened between the two creates, not after the success.
    expect(hoisted.view.destroy).toHaveBeenCalledTimes(1);
  });

  it("a successful start does NOT destroy the view and shows the live session UI", async () => {
    renderView();
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    expect(hoisted.view.destroy).not.toHaveBeenCalled();
  });
});

describe("NativeARView product switch rollback (FE-21)", () => {
  async function startAndPlace() {
    renderView(arguments[0] || {});
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    hoisted.view.activeModelId = "anchor-1";
    act(() => {
      hoisted.gestureOptions.onTap();
    });
  }

  it("a failed switchModel rolls the selection back to the previous product", async () => {
    const onProductSelect = vi.fn();
    hoisted.view = makeView({
      switchModel: vi.fn().mockRejectedValue(new Error("switch failed")),
    });
    await startAndPlace({ onProductSelect });

    fireEvent.click(screen.getByRole("button", { name: /Table B/ }));

    await waitFor(() => expect(hoisted.view.switchModel).toHaveBeenCalledTimes(1));
    // Optimistic B, then rollback to A — never left showing B.
    await waitFor(() =>
      expect(onProductSelect.mock.calls.map((c) => c[0]._id)).toEqual(["prod-b", "prod-a"])
    );
    expect(screen.getByText("switch failed")).toBeInTheDocument();
  });

  it("a successful switchModel keeps the new selection with no rollback", async () => {
    const onProductSelect = vi.fn();
    await startAndPlace({ onProductSelect });

    fireEvent.click(screen.getByRole("button", { name: /Table B/ }));

    await waitFor(() => expect(hoisted.view.switchModel).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(onProductSelect.mock.calls.map((c) => c[0]._id)).toEqual(["prod-b"])
    );
  });
});

describe("NativeARView tutorial (FE-21)", () => {
  it("rotate/scale completes the tutorial — the un-advanceable Move step is gone and never obstructs", async () => {
    renderView();
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    hoisted.view.activeModelId = "anchor-1";
    act(() => {
      hoisted.gestureOptions.onTap();
    });
    // Dismiss the actions toggle opened by onTap so the tutorial can show.
    act(() => {
      hoisted.gestureOptions.onTap();
    });
    expect(screen.getByText("Rotate & Scale")).toBeInTheDocument();

    act(() => {
      hoisted.gestureOptions.onScale(1.5);
    });
    expect(screen.queryByText("Rotate & Scale")).not.toBeInTheDocument();
    expect(screen.queryByText("Move Position")).not.toBeInTheDocument();

    // Pen (stale closure): the SAME captured gesture callbacks firing
    // again must not resurrect any tutorial step.
    act(() => {
      hoisted.gestureOptions.onRotate(0.4);
    });
    act(() => {
      hoisted.gestureOptions.onScale(1.2);
    });
    expect(screen.queryByText("Rotate & Scale")).not.toBeInTheDocument();
    expect(screen.queryByText("Move Position")).not.toBeInTheDocument();
  });
});
