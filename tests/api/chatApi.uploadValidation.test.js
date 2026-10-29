import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// FE-11 — the upload path in src/api/chatApi.js sent whatever
// compressFileIfNeeded returned, and nothing ever sniffed content:
//  (1) a renamed executable (declared image/png, MZ bytes) reached
//      the network and was only rejected after the transfer;
//  (2) the file that was validated (the user's original) was not the
//      file that was uploaded (the post-compression substitute was
//      never re-validated).
// Fix pinned here: uploadChatAttachment sniffs + validates the
// original, compresses, then re-validates the EXACT substitute file
// before FormData/network — a bad file rejects with the policy error
// and api.post is never called.
//
// Canvas/Image stubbing follows tests/utils/imageCompression.exif.test.js
// (jsdom cannot decode images); the stubbed encoder can be told to
// emit hostile bytes to prove the substitute itself is re-checked.

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("../../src/utils/guestSessionStorage.js", () => ({
  getGuestSessionId: vi.fn(() => null),
}));

import api from "../../src/api/index.js";
import { uploadChatAttachment } from "../../src/api/chatApi.js";

// --- Fixtures ----------------------------------------------------------
const bytes = (header, total = 256) => {
  const out = new Uint8Array(total);
  out.set(header, 0);
  for (let i = header.length; i < total; i += 1) out[i] = 0x61;
  return out;
};
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PDF = [..."%PDF-1.7"].map((c) => c.charCodeAt(0));
const MZ = [0x4d, 0x5a];

const pngFile = () =>
  new File([bytes(PNG)], "photo.png", { type: "image/png" });
const mzFile = () => new File([bytes(MZ)], "evil.png", { type: "image/png" });
const pdfFile = () =>
  new File([bytes(PDF)], "doc.pdf", { type: "application/pdf" });

// --- Canvas/Image stubs (FE-05 style) ----------------------------------
const OriginalImage = globalThis.Image;
let encoderBytes = JPEG; // what the stubbed canvas encoder emits

class MockImage {
  constructor() {
    this.width = 100;
    this.height = 100;
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
  vi.clearAllMocks();
  encoderBytes = JPEG;
  api.post.mockResolvedValue({
    data: { data: { attachment: { fileUrl: "https://example.com/x.jpg" } } },
  });
  globalThis.Image = MockImage;
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return { drawImage: () => {} };
  };
  HTMLCanvasElement.prototype.toBlob = function toBlob(cb) {
    cb(new Blob([bytes(encoderBytes)], { type: "image/jpeg" }));
  };
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  globalThis.Image = OriginalImage;
});

describe("FE-11: uploadChatAttachment validates content before any network call", () => {
  it("pen-test: MZ executable declared as image/png rejects and api.post is never called", async () => {
    await expect(uploadChatAttachment("chat-1", mzFile())).rejects.toThrow(
      /JPEG, PNG, WebP, GIF or PDF/,
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it("pen-test: valid-type/wrong-bytes (PNG declared, JPEG bytes in a .png the compressor would rename) — substitute revalidation catches a hostile encoder output", async () => {
    // The original is a genuine PNG and passes. The (stubbed) encoder
    // then produces MZ bytes wearing an image/jpeg type — exactly the
    // "validated file != uploaded file" gap. Re-validation of the
    // substitute must reject before the network.
    encoderBytes = MZ;
    await expect(uploadChatAttachment("chat-1", pngFile())).rejects.toThrow(
      /JPEG, PNG, WebP, GIF or PDF/,
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it("a genuine PNG uploads: the posted FormData file is the validated substitute (JPEG re-encode)", async () => {
    await uploadChatAttachment("chat-1", pngFile());
    expect(api.post).toHaveBeenCalledTimes(1);
    const [, formData] = api.post.mock.calls[0];
    const sent = formData.get("file");
    expect(sent).toBeInstanceOf(File);
    expect(sent.type).toBe("image/jpeg");
    const head = new Uint8Array(await sent.slice(0, 4).arrayBuffer());
    expect([...head]).toEqual(JPEG);
  });

  it("a genuine PDF (non-image, returned as-is by compression) still uploads", async () => {
    await uploadChatAttachment("chat-1", pdfFile());
    expect(api.post).toHaveBeenCalledTimes(1);
    const [, formData] = api.post.mock.calls[0];
    expect(formData.get("file").type).toBe("application/pdf");
  });
});
