// FE-53 — AR start preloads EVERY catalog model before the session
// is usable, and one bad model rejects the whole batch.
//
// Before the fix, handleStartAR did:
//   const modelUrls = [...new Set(products.map(getModelUrl).filter(Boolean))];
//   await view.preloadModels(modelUrls);
// The library's preloadModels is Promise.all(urls.map(loadModel)), so
// time-to-AR and memory scaled with the whole catalog, the await
// gated the session, and a single 404/CORS failure rejected start
// (and, per FE-21, tore the live session down).
//
// Fix contract (src/components/ar/NativeARView.jsx):
//  - At start, ONLY the selected product's model is loaded, via a
//    single-URL preloadModels call, and only that await gates start.
//  - The remaining catalog models are prefetched in the background
//    AFTER the session is live: one single-URL preloadModels call per
//    model, at most PREFETCH_CONCURRENCY in flight, each failure
//    isolated (Promise.allSettled semantics at the app layer) — a
//    failing background model never aborts the session, never
//    surfaces the start error UI, and never blocks switching to a
//    good model.
//  - If the SELECTED model's own preload fails, start still fails
//    (and FE-21 teardown still runs): the first thing the user sees
//    must actually be loadable.
//
// capacitor-arcore is mocked exactly as in the FE-21 lifecycle tests.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({ view: null, gestureOptions: null }));

vi.mock("capacitor-arcore", () => ({
  createARView: vi.fn(() => hoisted.view),
}));

import NativeARView from "../../../src/components/ar/NativeARView.jsx";
import { getModelUrl } from "../../../src/utils/imageUrl.js";

// The component resolves each product's model URL through getModelUrl
// (relative paths are joined onto the uploads base), so expectations
// are stated in resolved URLs, exactly as the AR view receives them.
const urlOf = (product) => getModelUrl(product);

const productA = { _id: "prod-a", slug: "chair-a", name: "Chair A", price: 10000, modelUrl: "/models/chair-a.glb", images: [] };
const productB = { _id: "prod-b", slug: "table-b", name: "Table B", price: 20000, modelUrl: "/models/table-b.glb", images: [] };
const productC = { _id: "prod-c", slug: "lamp-c", name: "Lamp C", price: 5000, modelUrl: "/models/lamp-c.glb", images: [] };
const productD = { _id: "prod-d", slug: "sofa-d", name: "Sofa D", price: 30000, modelUrl: "/models/sofa-d.glb", images: [] };
const productE = { _id: "prod-e", slug: "desk-e", name: "Desk E", price: 15000, modelUrl: "/models/desk-e.glb", images: [] };
const ALL = [productA, productB, productC, productD, productE];

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
      products={ALL}
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

// Drain pending microtasks so fire-and-forget prefetch chains settle.
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const preloadedUrls = () =>
  hoisted.view.preloadModels.mock.calls.map((call) => call[0]);

beforeEach(() => {
  hoisted.view = makeView();
  hoisted.gestureOptions = null;
});

describe("FE-53 AR start loads only the selected model", () => {
  it("start calls preloadModels with ONLY the selected product's URL, never the whole catalog at once", async () => {
    renderView();
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    await flush();

    const calls = preloadedUrls();
    expect(calls.length).toBeGreaterThan(0);
    // No call ever carries more than one URL (no catalog-wide batch).
    for (const urls of calls) expect(urls).toHaveLength(1);
    // The FIRST (gating) call is exactly the selected product.
    expect(calls[0]).toEqual([urlOf(productA)]);
    expect(hoisted.view.destroy).not.toHaveBeenCalled();
  });

  it("session becomes usable while background prefetch is still in flight (start does not await it)", async () => {
    let releaseBackground;
    const backgroundGate = new Promise((resolve) => { releaseBackground = resolve; });
    const preload = vi.fn((urls) => {
      // Only a single-URL load of the SELECTED model resolves; any
      // other call (a catalog-wide batch, or a background model)
      // hangs. Pre-fix the one batch call therefore never settled
      // and the session never became usable.
      if (urls.length === 1 && urls[0] === urlOf(productA)) return Promise.resolve();
      return backgroundGate;
    });
    hoisted.view = makeView({ preloadModels: preload });
    renderView();
    await startAR();

    // The live session UI is up even though background loads pend.
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    expect(hoisted.view.destroy).not.toHaveBeenCalled();
    releaseBackground();
    await flush();
  });

  it("background prefetch eventually requests every other catalog model exactly once", async () => {
    renderView();
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    await flush();
    await flush();

    const requested = preloadedUrls().flat().sort();
    expect(requested).toEqual(ALL.map(urlOf).sort());
  });

  it("pen: background prefetch respects a small concurrency cap (never all remaining models in flight at once)", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const preload = vi.fn(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
    });
    hoisted.view = makeView({ preloadModels: preload });
    renderView();
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    // Let the prefetch chain run to completion (4 background models).
    await waitFor(() => expect(hoisted.view.preloadModels).toHaveBeenCalledTimes(5), { timeout: 3000 });
    await flush();
    // 1 gating load + a cap of at most 3 concurrent background loads.
    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(maxInFlight).toBeGreaterThan(1); // prefetch does overlap; it is not serialised behind start
  });
});

describe("FE-53 background failure isolation", () => {
  it("pen: a failing background model does not abort the session, show an error, or block switching to a good model", async () => {
    const preload = vi.fn((urls) => {
      if (urls.includes(urlOf(productC))) return Promise.reject(new Error("lamp 404"));
      return Promise.resolve();
    });
    hoisted.view = makeView({ preloadModels: preload });
    const onProductSelect = vi.fn();
    renderView({ onProductSelect });
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    await flush();
    await flush();

    // Session still live, no teardown, no error banner for a
    // background failure the user never asked for yet.
    expect(hoisted.view.destroy).not.toHaveBeenCalled();
    expect(screen.queryByText("lamp 404")).not.toBeInTheDocument();
    expect(screen.getByText("Collection")).toBeInTheDocument();

    // Place the selected model, then switch to a GOOD model — the
    // earlier background failure must not poison the switch.
    hoisted.view.activeModelId = "anchor-1";
    act(() => { hoisted.gestureOptions.onTap(); });
    fireEvent.click(screen.getByRole("button", { name: /Table B/ }));
    await waitFor(() => expect(hoisted.view.switchModel).toHaveBeenCalledTimes(1));
    expect(hoisted.view.switchModel).toHaveBeenCalledWith(urlOf(productB), expect.anything());
    expect(onProductSelect.mock.calls.map((c) => c[0]._id)).toEqual(["prod-b"]);
  });

  it("a failing SELECTED model still fails the start, with FE-21 teardown", async () => {
    const preload = vi.fn((urls) => {
      if (urls.includes(urlOf(productA))) return Promise.reject(new Error("selected 404"));
      return Promise.resolve();
    });
    hoisted.view = makeView({ preloadModels: preload });
    renderView();
    await startAR();

    await waitFor(() => expect(hoisted.view.destroy).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Allow Camera Access" })).toBeInTheDocument();
    expect(screen.getByText("selected 404")).toBeInTheDocument();
  });

  it("pen: duplicate model URLs in the catalog are only requested once", async () => {
    const dupe = { ...productE, _id: "prod-e2", modelUrl: "/models/table-b.glb" };
    renderView({ products: [productA, productB, dupe] });
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    await flush();
    await flush();
    const requested = preloadedUrls().flat();
    expect(requested.filter((u) => u === urlOf(productB))).toHaveLength(1);
    expect(requested.filter((u) => u === urlOf(productA))).toHaveLength(1);
  });

  it("a catalog with only the selected product performs no background prefetch", async () => {
    renderView({ products: [productA] });
    await startAR();
    await waitFor(() => expect(screen.getByText("Collection")).toBeInTheDocument());
    await flush();
    expect(preloadedUrls()).toEqual([[urlOf(productA)]]);
  });
});
