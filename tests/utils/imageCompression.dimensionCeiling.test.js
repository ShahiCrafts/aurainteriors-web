import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// FE-11 (dimension ceiling) — src/utils/imageCompression.js decoded
// images at native resolution with no pixel cap before canvas work,
// so a small decompression-bomb image inside the 10 MB limit could
// freeze/OOM a low-end tab. Fix pinned here: after decode, the
// decoded dimensions are checked against a dimension/pixel ceiling
// BEFORE any canvas encode is attempted, and over-ceiling images
// reject with a clear message instead of being processed.
//
// Mocking follows tests/utils/imageCompression.exif.test.js (FE-05):
// jsdom cannot decode real images, so Image and the canvas are
// stubbed; the stub reports whatever dimensions the test sets.

import {
  compressImage,
  compressFileIfNeeded,
  MAX_IMAGE_PIXELS,
  MAX_IMAGE_DIMENSION,
} from "../../src/utils/imageCompression.js";

function cleanJpegBlob(size = 128) {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0], 0);
  return new Blob([bytes], { type: "image/jpeg" });
}

function makeFile(name = "photo.jpg", totalSize = 2048) {
  const bytes = new Uint8Array(totalSize);
  bytes.set([0xff, 0xd8, 0xff, 0xe0], 0);
  return new File([bytes], name, { type: "image/jpeg" });
}

const OriginalImage = globalThis.Image;
let imageWidth = 800;
let imageHeight = 600;
let toBlobCalls = 0;

class MockImage {
  constructor() {
    this.width = imageWidth;
    this.height = imageHeight;
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
  imageWidth = 800;
  imageHeight = 600;
  toBlobCalls = 0;
  globalThis.Image = MockImage;
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return { drawImage: () => {} };
  };
  HTMLCanvasElement.prototype.toBlob = function toBlob(cb) {
    toBlobCalls += 1;
    cb(cleanJpegBlob(128));
  };
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  globalThis.Image = OriginalImage;
});

describe("FE-11: pixel-dimension ceiling in imageCompression", () => {
  it("exports a sane ceiling (a 20000x20000 image is over it)", () => {
    expect(typeof MAX_IMAGE_PIXELS).toBe("number");
    expect(typeof MAX_IMAGE_DIMENSION).toBe("number");
    expect(20000 * 20000).toBeGreaterThan(MAX_IMAGE_PIXELS);
    expect(20000).toBeGreaterThan(MAX_IMAGE_DIMENSION);
  });

  it("pen-test: a 20000x20000 image is rejected with a message, before any canvas encode", async () => {
    imageWidth = 20000;
    imageHeight = 20000;
    await expect(compressImage(makeFile())).rejects.toThrow(
      /dimension|pixel|too large/i,
    );
    expect(toBlobCalls).toBe(0);
  });

  it("pen-test: a wide-but-huge image over the pixel cap (12000x12000) is also rejected pre-encode", async () => {
    imageWidth = 12000;
    imageHeight = 12000;
    await expect(compressFileIfNeeded(makeFile())).rejects.toThrow(
      /dimension|pixel|too large/i,
    );
    expect(toBlobCalls).toBe(0);
  });

  it("a normal 800x600 image still compresses (ceiling does not break the happy path)", async () => {
    const out = await compressFileIfNeeded(makeFile());
    expect(out.type).toBe("image/jpeg");
    expect(toBlobCalls).toBeGreaterThanOrEqual(1);
  });
});
