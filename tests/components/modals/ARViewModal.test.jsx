// FE-46 — ARViewModal fetched `${VITE_API_BASE_URL ||
// "http://localhost:8080"}/api/v1/system/info` expecting
// {status:"success", data:{localIp}}. The server has NO such route:
// ~/workspace/aura-audit/work/routes/system.routes.js defines only
// GET /keep-alive-status (admin-only, {success:true} envelope), mounted
// at /api/v1/system in app.js:212; "localIp" appears nowhere in the
// server tree. The dead fetch fired on mount even when the modal was
// closed, and the hardcoded 8080 fallback disagreed with the app's own
// apiConfig fallback (http://localhost:3001).
//
// After the fix the modal issues NO fetch at all and the QR code
// encodes `${VITE_APP_URL || window.location.origin}/ar/<slug>`.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({ qrValue: null }));

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }) => {
    hoisted.qrValue = value;
    return <div data-testid="qr" />;
  },
}));

import ARViewModal from "../../../src/components/modals/ARViewModal.jsx";

const product = {
  _id: "prod-1",
  slug: "velvet-chair",
  modelUrl: "https://example.com/velvet.glb",
  modelFiles: [{ format: "glb", url: "https://example.com/velvet.glb" }],
};

beforeEach(() => {
  hoisted.qrValue = null;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("no network in tests"))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ARViewModal (FE-46)", () => {
  it("issues no /system/info request (and no fetch at all) when opened", () => {
    render(<ARViewModal isOpen onClose={vi.fn()} product={product} />);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("issues no request when mounted closed (it is always mounted on the product page)", () => {
    render(<ARViewModal isOpen={false} onClose={vi.fn()} product={product} />);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("the QR code encodes the current origin's /ar/<slug>", () => {
    render(<ARViewModal isOpen onClose={vi.fn()} product={product} />);
    expect(screen.getByTestId("qr")).toBeInTheDocument();
    expect(hoisted.qrValue).toBe(`${window.location.origin}/ar/velvet-chair`);
  });

  it("pen: the QR value never contains localhost:8080 or a /system/info path", () => {
    render(<ARViewModal isOpen onClose={vi.fn()} product={product} />);
    expect(hoisted.qrValue).not.toContain("8080");
    expect(hoisted.qrValue).not.toContain("system/info");
  });

  it("pen: a product with no slug falls back to its _id in the AR URL", () => {
    render(
      <ARViewModal
        isOpen
        onClose={vi.fn()}
        product={{ _id: "prod-9", modelUrl: "https://example.com/x.glb" }}
      />,
    );
    expect(hoisted.qrValue).toBe(`${window.location.origin}/ar/prod-9`);
  });

  it("FE-12 pen: a hostile slug is encoded into ONE segment of the QR URL (no route reshaping, no fragment truncation)", () => {
    render(
      <ARViewModal
        isOpen
        onClose={vi.fn()}
        product={{
          _id: "prod-x",
          slug: "a/b?x=1#y",
          modelUrl: "https://example.com/x.glb",
          modelFiles: [{ format: "glb", url: "https://example.com/x.glb" }],
        }}
      />,
    );
    expect(hoisted.qrValue).toBe(
      `${window.location.origin}/ar/a%2Fb%3Fx%3D1%23y`,
    );
    expect(hoisted.qrValue).not.toContain("#");
    expect(hoisted.qrValue).not.toContain("?x=1");
  });

  it("VITE_APP_URL, when configured, is the QR base (with no doubled slash)", () => {
    vi.stubEnv("VITE_APP_URL", "https://shop.example.com/");
    render(<ARViewModal isOpen onClose={vi.fn()} product={product} />);
    expect(hoisted.qrValue).toBe("https://shop.example.com/ar/velvet-chair");
  });
});
