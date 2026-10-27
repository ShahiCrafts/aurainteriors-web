import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// FE-05 — chat photo uploads must never leak GPS EXIF through the
// compression fallbacks.
//
// src/utils/imageCompression.js: the happy path re-encodes via canvas
// (which strips EXIF), but the fallback branches — compressed blob
// larger than the original, decode error, and the outer catch in
// compressFileIfNeeded — returned the ORIGINAL File untouched, and
// src/api/chatApi.js uploadChatAttachment uploads whatever it returns.
// The server stores the raw buffer without re-encoding, so GPS EXIF
// reached a public URL.
//
// jsdom notes: jsdom's canvas has no working 2d context / toBlob and
// its Image never loads, so both are stubbed here. The util reads the
// file via FileReader -> data URL (no URL.createObjectURL involved),
// and FileReader works in jsdom unmodified. The canvas stub's toBlob
// returns known EXIF-free bytes for the re-encode paths.

import {
  compressImage,
  compressFileIfNeeded,
} from "../../src/utils/imageCompression.js";

// --- Minimal JPEG fixture with an APP1 'Exif\0\0' segment + GPS data --
function makeExifJpegFile(name = "photo.jpg", totalSize = 2048) {
  const header = [
    0xff, 0xd8, // SOI
    0xff, 0xe1, 0x00, 0x10, // APP1 + length
    ...[... "Exif\0\0"].map((c) => c.charCodeAt(0)),
    // Fake GPS payload: the markers the assertions hunt for.
    ...[... "GPSLatitude 37.7749 GPSLongitude -122.4194"].map((c) =>
      c.charCodeAt(0)
    ),
  ];
  const bytes = new Uint8Array(totalSize);
  bytes.set(header, 0);
  for (let i = header.length; i < totalSize - 2; i += 1) bytes[i] = 0x61;
  bytes[totalSize - 2] = 0xff;
  bytes[totalSize - 1] = 0xd9; // EOI
  return new File([bytes], name, { type: "image/jpeg" });
}

// Known EXIF-free "re-encoded" bytes the canvas stub returns.
function cleanJpegBlob(size = 128) {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0], 0);
  for (let i = 4; i < size - 2; i += 1) bytes[i] = 0x62;
  bytes[size - 2] = 0xff;
  bytes[size - 1] = 0xd9;
  return new Blob([bytes], { type: "image/jpeg" });
}

async function fileText(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let out = "";
  const CHUNK = 8192;
  for (let i = 0; i < buf.length; i += CHUNK) {
    out += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return out;
}

async function expectExifFree(file) {
  const text = await fileText(file);
  expect(text).not.toContain("Exif");
  expect(text).not.toContain("GPS");
  expect(text).not.toContain("37.7749");
}

// --- Browser API stubs ------------------------------------------------
const OriginalImage = globalThis.Image;

let imageMode = "load"; // "load" | "error"
let toBlobImpl = null;
let getContextImpl = null;
let toBlobCalls = 0;

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
      if (imageMode === "error") {
        if (this.onerror) this.onerror(new Error("decode failed"));
      } else if (this.onload) {
        this.onload();
      }
    });
  }
  get src() {
    return this._src;
  }
}

beforeEach(() => {
  imageMode = "load";
  toBlobCalls = 0;
  toBlobImpl = (cb) => cb(cleanJpegBlob(128));
  getContextImpl = () => ({ drawImage: () => {} });

  globalThis.Image = MockImage;
  // Direct prototype assignment (jsdom's canvas is unimplemented).
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return getContextImpl();
  };
  HTMLCanvasElement.prototype.toBlob = function toBlob(cb, type, quality) {
    toBlobCalls += 1;
    return toBlobImpl(cb, type, quality);
  };

  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  globalThis.Image = OriginalImage;
});

describe("FE-05: happy path re-encode strips EXIF", () => {
  it("(a) output contains no 'Exif'/GPS markers and is not the original", async () => {
    const original = makeExifJpegFile("photo.jpg", 2048);
    expect(await fileText(original)).toContain("Exif"); // fixture sanity

    const out = await compressFileIfNeeded(original);
    expect(out).not.toBe(original);
    await expectExifFree(out);
  });

  it("(a2) compressImage directly also returns EXIF-free output", async () => {
    const original = makeExifJpegFile("photo.jpg", 2048);
    const out = await compressImage(original);
    expect(out).not.toBe(original);
    await expectExifFree(out);
  });
});

describe("FE-05: larger-than-original fallback must re-encode, not return the original", () => {
  it("(b) first re-encode larger than the original -> lower-quality re-encode, EXIF-free", async () => {
    const original = makeExifJpegFile("small.jpg", 300);
    toBlobImpl = (cb) => {
      // First attempt: clean but larger than the 300-byte original.
      // Subsequent (lower-quality) attempt: small and clean.
      if (toBlobCalls <= 1) cb(cleanJpegBlob(900));
      else cb(cleanJpegBlob(64));
    };

    const out = await compressFileIfNeeded(original);
    expect(out).not.toBe(original);
    expect(toBlobCalls).toBeGreaterThanOrEqual(2);
    await expectExifFree(out);
  });

  it("(b2) even if every re-encode stays larger, the re-encoded bytes win over the original", async () => {
    const original = makeExifJpegFile("small.jpg", 300);
    toBlobImpl = (cb) => cb(cleanJpegBlob(900));

    const out = await compressFileIfNeeded(original);
    expect(out).not.toBe(original);
    await expectExifFree(out);
  });
});

describe("FE-05: decode failure rejects — the original is never resolved", () => {
  it("(c) compressImage rejects with a clear error on decode failure", async () => {
    imageMode = "error";
    const original = makeExifJpegFile();
    await expect(compressImage(original)).rejects.toThrow(
      /image|compress|decode|load/i
    );
  });

  it("(c2) compressFileIfNeeded rejects (does not swallow to the original) on decode failure", async () => {
    imageMode = "error";
    const original = makeExifJpegFile();
    await expect(compressFileIfNeeded(original)).rejects.toThrow(
      /image|compress|decode|load/i
    );
  });
});

describe("FE-05 pen-test: a file that can never be re-encoded must reject", () => {
  it("(d) decode succeeds but every re-encode throws -> rejects, never the original", async () => {
    toBlobImpl = () => {
      throw new Error("encoder exploded");
    };
    const original = makeExifJpegFile();
    await expect(compressImage(original)).rejects.toThrow(/encoder|image|compress/i);
    await expect(compressFileIfNeeded(original)).rejects.toThrow(
      /encoder|image|compress/i
    );
  });

  it("(d2) canvas context unavailable on every attempt -> rejects", async () => {
    getContextImpl = () => null;
    const original = makeExifJpegFile();
    await expect(compressFileIfNeeded(original)).rejects.toThrow(
      /image|compress|canvas|context/i
    );
  });

  it("(d3) toBlob yields null on every attempt -> rejects", async () => {
    toBlobImpl = (cb) => cb(null);
    const original = makeExifJpegFile();
    await expect(compressFileIfNeeded(original)).rejects.toThrow(
      /image|compress|re-encod/i
    );
  });
});

describe("FE-05 scope pin: non-images are untouched", () => {
  it("a non-image file is returned as-is (no EXIF surface, documented behaviour)", async () => {
    const doc = new File(["hello"], "note.txt", { type: "text/plain" });
    await expect(compressFileIfNeeded(doc)).resolves.toBe(doc);
  });
});
