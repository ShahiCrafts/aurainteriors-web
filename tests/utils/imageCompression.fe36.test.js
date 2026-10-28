import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// FE-36 — image compression silently corrupted file types and could
// hang an upload (src/utils/imageCompression.js, audit lines 52-66,
// 101 and 19):
//  * every image/* re-encode produced JPEG bytes but kept the
//    ORIGINAL filename/extension (animated GIF -> still JPEG named
//    .gif; PNG transparency flattened into a ".png" that is not one);
//  * canvas.toBlob yielding null threw outside the try/catch and the
//    promise never settled (the FE-05 rework already made the encoder
//    reject on null — pinned here as a regression so it cannot
//    silently return);
//  * maxSizeKB=500 was declared and never used — no quality step-down.
//
// Fix pinned here: re-encoded output is honestly labelled — a .jpg
// filename with image/jpeg type; a null toBlob rejects promptly; the
// encoder steps quality/scale down toward the maxSizeKB budget.
//
// Mocking follows tests/utils/imageCompression.exif.test.js (FE-05).

import {
  compressImage,
  compressFileIfNeeded,
} from "../../src/utils/imageCompression.js";

function blobOfSize(size) {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0], 0);
  return new Blob([bytes], { type: "image/jpeg" });
}

function makeFile(name, type, totalSize = 2048) {
  const bytes = new Uint8Array(totalSize);
  bytes.set([0x47, 0x49, 0x46, 0x38], 0); // "GIF8" — content is irrelevant to the stubs
  return new File([bytes], name, { type });
}

const OriginalImage = globalThis.Image;
let toBlobImpl = null;
let toBlobCalls = 0;
let qualities = [];

class MockImage {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.onload = null;
    this.onerror = null;
    this._src = "";
  }
  set src(value) {
    this._src = value;
    queueMicrotask(() => {
      if (this.onload) this.onload();
    });
  }
  get src() {
    return this._src;
  }
}

beforeEach(() => {
  toBlobCalls = 0;
  qualities = [];
  toBlobImpl = (cb) => cb(blobOfSize(128));
  globalThis.Image = MockImage;
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return { drawImage: () => {} };
  };
  HTMLCanvasElement.prototype.toBlob = function toBlob(cb, type, quality) {
    toBlobCalls += 1;
    qualities.push(quality);
    return toBlobImpl(cb, type, quality);
  };
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  globalThis.Image = OriginalImage;
});

describe("FE-36: re-encodes are honestly labelled as JPEG", () => {
  it("pen-test: a GIF input produces a .jpg-named JPEG output (not JPEG bytes in a .gif name)", async () => {
    const out = await compressFileIfNeeded(makeFile("anim.gif", "image/gif"));
    expect(out.type).toBe("image/jpeg");
    expect(out.name).toBe("anim.jpg");
  });

  it("a PNG input produces a .jpg-named output", async () => {
    const out = await compressImage(makeFile("photo.png", "image/png"));
    expect(out.type).toBe("image/jpeg");
    expect(out.name).toBe("photo.jpg");
  });

  it("a JPEG input keeps a .jpg name, and an extensionless name gains .jpg", async () => {
    const jpg = await compressImage(makeFile("photo.jpeg", "image/jpeg"));
    expect(jpg.name).toBe("photo.jpg");
    const noExt = await compressImage(makeFile("photo", "image/png"));
    expect(noExt.name).toBe("photo.jpg");
  });
});

describe("FE-36: null toBlob fails fast instead of hanging", () => {
  it("pen-test: forced-null toBlob makes the promise REJECT promptly (settles, never hangs)", async () => {
    toBlobImpl = (cb) => cb(null);
    const settled = await Promise.race([
      compressImage(makeFile("photo.png", "image/png")).then(
        () => "resolved",
        (err) => `rejected:${err.message}`,
      ),
      new Promise((resolve) => setTimeout(() => resolve("TIMED OUT"), 1000)),
    ]);
    expect(settled).toMatch(/^rejected:/);
    expect(settled).toMatch(/re-encod|image|compress/i);
  });
});

describe("FE-36: the maxSizeKB budget drives a quality step-down", () => {
  it("pen-test: outputs over the 500KB budget are stepped down until within budget (or smallest wins)", async () => {
    // 700 KB original; encoder emits 600 KB, then 550 KB, then 400 KB.
    const original = makeFile("big.jpg", "image/jpeg", 700 * 1024);
    const sizes = [600 * 1024, 550 * 1024, 400 * 1024];
    toBlobImpl = (cb) =>
      cb(blobOfSize(sizes[Math.min(toBlobCalls - 1, sizes.length - 1)]));

    const out = await compressImage(original);
    expect(toBlobCalls).toBeGreaterThanOrEqual(3);
    expect(out.size).toBeLessThanOrEqual(500 * 1024);
    // Quality actually stepped DOWN across attempts.
    expect(qualities.length).toBeGreaterThanOrEqual(3);
    expect(qualities[1]).toBeLessThan(qualities[0]);
    expect(qualities[2]).toBeLessThan(qualities[1]);
  });

  it("an already-small output does not trigger needless extra encodes", async () => {
    const out = await compressImage(makeFile("small.jpg", "image/jpeg", 2048));
    expect(out.size).toBe(128);
    expect(toBlobCalls).toBe(1);
  });
});
