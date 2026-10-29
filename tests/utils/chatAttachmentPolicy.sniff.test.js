import { describe, expect, it } from "vitest";

// FE-11 — client-side file validation was advisory only:
// src/utils/chatAttachmentPolicy.js checked the file.type STRING
// (extension/OS-derived), so a renamed executable passed the client
// check and was only rejected after the upload transferred.
// Fix pinned here: the policy module sniffs the first 12 bytes
// (magic bytes for JPEG/PNG/WebP/GIF/PDF) and the async validator
// requires the SNIFFED type to equal the declared type.
//
// The synchronous validateChatFiles() characterization tests live in
// tests/utils/chatAttachmentPolicy.test.js and are untouched — this
// file covers only the new sniffing layer.

import {
  sniffChatFileType,
  validateChatFilesSniffed,
} from "../../src/utils/chatAttachmentPolicy.js";

const TYPE_ERROR = "Choose JPEG, PNG, WebP, GIF or PDF files";

// --- Fixtures: real magic-byte headers + padding ---------------------
const bytes = (header, total = 64) => {
  const out = new Uint8Array(total);
  out.set(header, 0);
  for (let i = header.length; i < total; i += 1) out[i] = 0x61;
  return out;
};
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF = [..."GIF89a"].map((c) => c.charCodeAt(0));
const WEBP = [..."RIFF"]
  .map((c) => c.charCodeAt(0))
  .concat(
    [0x24, 0x00, 0x00, 0x00],
    [..."WEBP"].map((c) => c.charCodeAt(0)),
  );
const PDF = [..."%PDF-1.7"].map((c) => c.charCodeAt(0));
const MZ = [0x4d, 0x5a]; // DOS/PE executable header

const file = (header, name, type, total) =>
  new File([bytes(header, total)], name, { type });

describe("FE-11: sniffChatFileType reads magic bytes, not the declared type", () => {
  it("identifies JPEG/PNG/GIF/WebP/PDF by content", async () => {
    await expect(
      sniffChatFileType(file(JPEG, "a.bin", "application/octet-stream")),
    ).resolves.toBe("image/jpeg");
    await expect(
      sniffChatFileType(file(PNG, "a.bin", "application/octet-stream")),
    ).resolves.toBe("image/png");
    await expect(
      sniffChatFileType(file(GIF, "a.bin", "application/octet-stream")),
    ).resolves.toBe("image/gif");
    await expect(
      sniffChatFileType(file(WEBP, "a.bin", "application/octet-stream")),
    ).resolves.toBe("image/webp");
    await expect(
      sniffChatFileType(file(PDF, "a.bin", "application/octet-stream")),
    ).resolves.toBe("application/pdf");
  });

  it("returns null for an executable header and for unknown content", async () => {
    await expect(
      sniffChatFileType(file(MZ, "a.png", "image/png")),
    ).resolves.toBeNull();
    await expect(
      sniffChatFileType(file([0x00, 0x01, 0x02], "a.png", "image/png")),
    ).resolves.toBeNull();
  });
});

describe("FE-11: validateChatFilesSniffed", () => {
  it("accepts files whose bytes match their declared type", async () => {
    await expect(
      validateChatFilesSniffed(
        [
          file(JPEG, "a.jpg", "image/jpeg"),
          file(PNG, "b.png", "image/png"),
          file(GIF, "c.gif", "image/gif"),
          file(PDF, "d.pdf", "application/pdf"),
        ].slice(0, 3),
      ),
    ).resolves.toBeNull();
    await expect(
      validateChatFilesSniffed([file(WEBP, "e.webp", "image/webp")]),
    ).resolves.toBeNull();
  });

  it("pen-test: an MZ executable renamed to image/png is rejected", async () => {
    await expect(
      validateChatFilesSniffed([file(MZ, "evil.png", "image/png")]),
    ).resolves.toBe(TYPE_ERROR);
  });

  it("pen-test: a valid-type/wrong-bytes file is rejected (PNG type, JPEG bytes)", async () => {
    await expect(
      validateChatFilesSniffed([file(JPEG, "fake.png", "image/png")]),
    ).resolves.toBe(TYPE_ERROR);
  });

  it("pen-test: PDF type with image bytes is rejected (cross-type spoof)", async () => {
    await expect(
      validateChatFilesSniffed([file(PNG, "fake.pdf", "application/pdf")]),
    ).resolves.toBe(TYPE_ERROR);
  });

  it("keeps the synchronous count/size policy on top of sniffing", async () => {
    const four = [
      file(PNG, "1.png", "image/png"),
      file(PNG, "2.png", "image/png"),
      file(PNG, "3.png", "image/png"),
      file(PNG, "4.png", "image/png"),
    ];
    await expect(validateChatFilesSniffed(four)).resolves.toBe(
      "Attach at most 3 files per message",
    );
    await expect(
      validateChatFilesSniffed([
        file(PNG, "big.png", "image/png", 11 * 1024 * 1024),
      ]),
    ).resolves.toBe("Each attachment must be between 1 byte and 10 MB");
  });
});
