import { describe, expect, it } from "vitest";

// Characterization tests for src/utils/chatAttachmentPolicy.js — pinning
// the exported constants and validateChatFiles() exactly as implemented.
// Files are plain { type, size } objects; the validator reads nothing else.

import {
  ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  validateChatFiles,
} from "../../src/utils/chatAttachmentPolicy.js";

const file = (type = "image/png", size = 1024) => ({ type, size });

const COUNT_ERROR = "Attach at most 3 files per message";
const TYPE_ERROR = "Choose JPEG, PNG, WebP, GIF or PDF files";
const SIZE_ERROR = "Each attachment must be between 1 byte and 10 MB";

describe("exported constants", () => {
  it("pins the attachment limits", () => {
    expect(MAX_ATTACHMENTS).toBe(3);
    expect(MAX_ATTACHMENT_BYTES).toBe(10 * 1024 * 1024);
  });

  it("pins the allowed MIME type list", () => {
    expect(ATTACHMENT_MIME_TYPES).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]);
  });
});

describe("validateChatFiles", () => {
  it("accepts an empty file list", () => {
    expect(validateChatFiles([])).toBeNull();
  });

  it("accepts up to 3 valid files", () => {
    expect(validateChatFiles([file()])).toBeNull();
    expect(
      validateChatFiles([
        file("image/jpeg"),
        file("image/gif"),
        file("application/pdf"),
      ]),
    ).toBeNull();
  });

  it("accepts every allowed MIME type", () => {
    for (const type of ATTACHMENT_MIME_TYPES) {
      expect(validateChatFiles([file(type)])).toBeNull();
    }
  });

  it("rejects more than 3 files, before any type/size check", () => {
    const files = [file(), file(), file(), file()];
    expect(validateChatFiles(files)).toBe(COUNT_ERROR);

    // Even when the extra files are also invalid by type, count wins.
    const badFiles = [
      file("text/plain"),
      file("text/plain"),
      file("text/plain"),
      file("text/plain"),
    ];
    expect(validateChatFiles(badFiles)).toBe(COUNT_ERROR);
  });

  it("rejects disallowed MIME types", () => {
    expect(validateChatFiles([file("image/svg+xml")])).toBe(TYPE_ERROR);
    expect(validateChatFiles([file("text/plain")])).toBe(TYPE_ERROR);
    expect(validateChatFiles([file("video/mp4")])).toBe(TYPE_ERROR);
    expect(validateChatFiles([file("")])).toBe(TYPE_ERROR);
  });

  it("rejects zero-byte and missing-size files", () => {
    expect(validateChatFiles([file("image/png", 0)])).toBe(SIZE_ERROR);
    expect(validateChatFiles([{ type: "image/png" }])).toBe(SIZE_ERROR);
  });

  it("rejects files over 10 MB but accepts exactly 10 MB and 1 byte", () => {
    expect(
      validateChatFiles([file("image/png", MAX_ATTACHMENT_BYTES + 1)]),
    ).toBe(SIZE_ERROR);
    expect(
      validateChatFiles([file("image/png", MAX_ATTACHMENT_BYTES)]),
    ).toBeNull();
    expect(validateChatFiles([file("image/png", 1)])).toBeNull();
  });

  it("checks type before size for the same file", () => {
    expect(
      validateChatFiles([file("text/plain", MAX_ATTACHMENT_BYTES + 1)]),
    ).toBe(TYPE_ERROR);
  });

  it("reports the first offending file in list order", () => {
    // First file has a size problem, second a type problem: size wins
    // because validation walks the files in order.
    expect(validateChatFiles([file("image/png", 0), file("text/plain")])).toBe(
      SIZE_ERROR,
    );
    expect(validateChatFiles([file(), file("text/plain")])).toBe(TYPE_ERROR);
  });
});
