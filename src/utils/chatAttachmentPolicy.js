export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
export function validateChatFiles(files) {
  if (files.length > MAX_ATTACHMENTS) return "Attach at most 3 files per message";
  for (const file of files) {
    if (!ATTACHMENT_MIME_TYPES.includes(file.type)) return "Choose JPEG, PNG, WebP, GIF or PDF files";
    if (!file.size || file.size > MAX_ATTACHMENT_BYTES) return "Each attachment must be between 1 byte and 10 MB";
  }
  return null;
}
