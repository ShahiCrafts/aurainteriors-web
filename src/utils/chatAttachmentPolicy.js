export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const COUNT_ERROR = "Attach at most 3 files per message";
const TYPE_ERROR = "Choose JPEG, PNG, WebP, GIF or PDF files";
const SIZE_ERROR = "Each attachment must be between 1 byte and 10 MB";

export function validateChatFiles(files) {
  if (files.length > MAX_ATTACHMENTS) return COUNT_ERROR;
  for (const file of files) {
    if (!ATTACHMENT_MIME_TYPES.includes(file.type)) return TYPE_ERROR;
    if (!file.size || file.size > MAX_ATTACHMENT_BYTES) return SIZE_ERROR;
  }
  return null;
}

// FE-11: file.type is extension/OS-derived and trivially spoofed — a
// renamed executable used to pass the check above. The functions
// below sniff the leading magic bytes (the first 12 bytes cover
// JPEG/PNG/WebP/GIF/PDF) and validate the SNIFFED type. The server
// sniffs too and stays authoritative; this layer exists so a bad file
// is rejected before any network call, with the same error strings.

const startsWith = (bytes, signature, offset = 0) =>
  bytes.length >= offset + signature.length &&
  signature.every((b, i) => bytes[offset + i] === b);

const ascii = (text) => [...text].map((c) => c.charCodeAt(0));

const MAGIC_SIGNATURES = [
  { type: "image/jpeg", test: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  {
    type: "image/png",
    test: (b) =>
      startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    type: "image/gif",
    test: (b) =>
      startsWith(b, ascii("GIF87a")) || startsWith(b, ascii("GIF89a")),
  },
  {
    type: "image/webp",
    test: (b) =>
      startsWith(b, ascii("RIFF")) && startsWith(b, ascii("WEBP"), 8),
  },
  { type: "application/pdf", test: (b) => startsWith(b, ascii("%PDF-")) },
];

/**
 * Sniff a file's real type from its first 12 bytes.
 * @returns {Promise<string|null>} the sniffed MIME type, or null when
 *   the content matches none of the allowed signatures (or cannot be
 *   read as bytes at all).
 */
export async function sniffChatFileType(file) {
  if (!file || typeof file.slice !== "function") return null;
  let bytes;
  try {
    bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  } catch {
    return null;
  }
  for (const { type, test } of MAGIC_SIGNATURES) {
    if (test(bytes)) return type;
  }
  return null;
}

/**
 * Full attachment validation: the synchronous count/declared-type/size
 * policy PLUS a content sniff of every file — the sniffed type must
 * exist and must equal the declared type.
 * @returns {Promise<string|null>} an error message, or null when valid.
 */
export async function validateChatFilesSniffed(files) {
  const syncError = validateChatFiles(files);
  if (syncError) return syncError;
  for (const file of files) {
    const sniffed = await sniffChatFileType(file);
    if (!sniffed || sniffed !== file.type) return TYPE_ERROR;
  }
  return null;
}
