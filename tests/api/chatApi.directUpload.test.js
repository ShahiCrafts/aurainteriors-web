import { describe, it, expect, vi, beforeEach } from "vitest";

// Direct (signed) chat uploads: images go browser -> Cloudinary in
// one hop after the API signs the upload; the API then verifies +
// ledgers via the complete call, and uploadChatAttachment returns
// the same shape as the proxied path. Any direct-path failure
// (except a user abort) falls back to the proxied endpoint; PDFs
// never take the direct path.

vi.mock("../../src/api/index.js", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock("axios", () => ({
  default: { post: vi.fn() },
}));
vi.mock("../../src/utils/guestSessionStorage.js", () => ({
  getGuestSessionId: vi.fn(() => "guest_" + "a".repeat(64)),
}));
vi.mock("../../src/utils/imageCompression.js", () => ({
  compressFileIfNeeded: vi.fn(async (file) => file),
}));

import axios from "axios";
import api from "../../src/api/index.js";
import { uploadChatAttachment } from "../../src/api/chatApi.js";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PDF = [..."%PDF-1.7"].map((c) => c.charCodeAt(0));
const bytes = (header, total = 256) => {
  const out = new Uint8Array(total);
  out.set(header, 0);
  for (let i = header.length; i < total; i += 1) out[i] = 0x61;
  return out;
};
const pngFile = () => new File([bytes(PNG)], "photo.png", { type: "image/png" });
const pdfFile = () =>
  new File([bytes(PDF)], "doc.pdf", { type: "application/pdf" });

const SIGN = {
  cloudName: "demo-cloud",
  apiKey: "1234567890",
  timestamp: 1700000000,
  signature: "sig",
  folder: "aura/chat",
  publicId: "3f9c1d2e-4a5b-4c6d-8e7f-9a0b1c2d3e4f",
};
const LEDGERED = {
  expiresAt: "2026-11-02T00:00:00.000Z",
  attachment: {
    fileName: "photo.png",
    fileUrl:
      "https://res.cloudinary.com/demo-cloud/image/upload/aura/chat/x.jpg",
    fileType: "image",
    fileSize: 256,
  },
};

const apiCalls = () => api.post.mock.calls.map((c) => c[0]);

beforeEach(() => {
  vi.clearAllMocks();
  api.post.mockImplementation(async (url) => {
    if (url.endsWith("/attachments/sign")) return { data: { data: SIGN } };
    if (url.endsWith("/attachments/complete"))
      return { data: { data: LEDGERED } };
    if (url.endsWith("/attachments")) return { data: { data: LEDGERED } };
    throw new Error(`unexpected api.post ${url}`);
  });
  axios.post.mockResolvedValue({ data: { secure_url: LEDGERED.attachment.fileUrl } });
});

describe("uploadChatAttachment direct path", () => {
  it("signs, uploads straight to Cloudinary, completes, and returns the ledgered shape", async () => {
    const out = await uploadChatAttachment("chat-1", pngFile(), {});
    expect(out).toEqual(LEDGERED);
    expect(apiCalls()).toEqual([
      "/chats/chat-1/attachments/sign",
      "/chats/chat-1/attachments/complete",
    ]);
    // The file went to Cloudinary with the signed params, not to the API.
    const [cloudUrl, form] = axios.post.mock.calls[0];
    expect(cloudUrl).toBe(
      "https://api.cloudinary.com/v1_1/demo-cloud/image/upload",
    );
    expect(form.get("signature")).toBe("sig");
    expect(form.get("public_id")).toBe(SIGN.publicId);
    expect(form.get("folder")).toBe("aura/chat");
    // Complete carried the publicId + original file name.
    expect(api.post.mock.calls[1][1]).toEqual({
      publicId: SIGN.publicId,
      fileName: "photo.png",
    });
  });

  it("falls back to the proxied endpoint when the direct path fails", async () => {
    axios.post.mockRejectedValue(new Error("cloudinary unreachable"));
    const out = await uploadChatAttachment("chat-1", pngFile(), {});
    expect(out).toEqual(LEDGERED);
    expect(apiCalls()).toContain("/chats/chat-1/attachments");
  });

  it("a user abort does NOT fall back (cancel must stay cancelled)", async () => {
    const controller = new AbortController();
    controller.abort();
    axios.post.mockRejectedValue(
      Object.assign(new Error("canceled"), { name: "CanceledError" }),
    );
    await expect(
      uploadChatAttachment("chat-1", pngFile(), { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "CanceledError" });
    expect(apiCalls()).not.toContain("/chats/chat-1/attachments");
  });

  it("PDFs skip the direct path entirely and use the proxied endpoint", async () => {
    const out = await uploadChatAttachment("chat-1", pdfFile(), {});
    expect(out).toEqual(LEDGERED);
    expect(axios.post).not.toHaveBeenCalled();
    expect(apiCalls()).toEqual(["/chats/chat-1/attachments"]);
  });
});
