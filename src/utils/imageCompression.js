/**
 * Image Compression Utility for Chat Attachments
 *
 * Compresses images before upload to reduce bandwidth and speed up transfers.
 * For chat use case, max 1200x1200 is reasonable (full resolution not needed for preview).
 *
 * FE-05: re-encoding via canvas is also what strips EXIF (including GPS)
 * from phone photos. No code path in this module may resolve with the
 * original file's bytes for an image: if re-encoding fails, the promise
 * REJECTS with a clear error so the caller can surface a visible upload
 * failure instead of silently uploading the original to a public URL.
 */

// FE-11: decode ceiling. Browsers decode at native resolution before
// any canvas cap applies, so a small decompression-bomb image inside
// the 10 MB attachment limit could freeze/OOM a low-end tab. The
// decoded dimensions are checked against this ceiling BEFORE any
// canvas work; over-ceiling images reject with a message instead.
export const MAX_IMAGE_DIMENSION = 10000;
export const MAX_IMAGE_PIXELS = 50000000;

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => {
      console.error('FileReader error');
      reject(new Error('Image compression failed: could not read the image file'));
    };
    reader.readAsDataURL(file);
  });

const loadImage = (dataUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error('Failed to load image for compression');
      reject(new Error('Image compression failed: could not decode the image'));
    };
    img.src = dataUrl;
  });

// One canvas re-encode attempt. Rejects (never falls back) when the
// canvas, its 2d context, or the encoded blob is unavailable.
const encodeImageOnce = (img, width, height, quality) =>
  new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Image compression failed: canvas 2d context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed: re-encoding produced no output'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Image compression failed: re-encoding failed'));
    }
  });

/**
 * Compress image using canvas
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed (re-encoded, EXIF-free) image as a new File
 * @throws {Error} When the image cannot be decoded or re-encoded — the
 *   original file is never returned for an image (FE-05).
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8, // 80% quality is sweet spot for chat (visually good, much smaller)
    maxSizeKB = 500, // Size budget: the ladder steps quality/scale down toward this (FE-36)
  } = options;
  const maxSizeBytes = maxSizeKB * 1024;

  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  // FE-11: enforce the pixel-dimension ceiling on the decoded image
  // before any canvas work happens.
  if (
    img.width > MAX_IMAGE_DIMENSION ||
    img.height > MAX_IMAGE_DIMENSION ||
    img.width * img.height > MAX_IMAGE_PIXELS
  ) {
    throw new Error(
      `Image compression failed: image dimensions ${img.width}x${img.height} exceed the maximum allowed size`
    );
  }

  // Calculate base dimensions while maintaining aspect ratio
  let baseWidth = img.width;
  let baseHeight = img.height;

  if (img.width > maxWidth || img.height > maxHeight) {
    const aspectRatio = img.width / img.height;
    if (img.width > img.height) {
      baseWidth = maxWidth;
      baseHeight = Math.round(maxWidth / aspectRatio);
    } else {
      baseHeight = maxHeight;
      baseWidth = Math.round(maxHeight * aspectRatio);
    }
  }

  // Fallback ladder (FE-05 + FE-36): progressively lower quality /
  // smaller dimensions. An attempt is "good enough" when it is no
  // larger than the original AND within the maxSizeKB budget — until
  // then the ladder keeps stepping down toward the budget. If no
  // attempt is good enough, the SMALLEST re-encoded output is used —
  // it is still EXIF-free, unlike the original. Only when no
  // re-encode succeeds at all do we reject.
  const attempts = [
    { scale: 1, quality },
    { scale: 0.85, quality: Math.min(quality, 0.65) },
    { scale: 0.75, quality: Math.min(quality, 0.5) },
    { scale: 0.5, quality: Math.min(quality, 0.35) },
    { scale: 0.35, quality: Math.min(quality, 0.25) },
  ];

  let smallestBlob = null;
  let lastError = null;

  for (const attempt of attempts) {
    const width = Math.max(1, Math.round(baseWidth * attempt.scale));
    const height = Math.max(1, Math.round(baseHeight * attempt.scale));
    try {
      const blob = await encodeImageOnce(img, width, height, attempt.quality);
      if (!smallestBlob || blob.size < smallestBlob.size) {
        smallestBlob = blob;
      }
      if (blob.size <= Math.min(file.size, maxSizeBytes)) break;
    } catch (error) {
      console.error('Image compression error:', error);
      lastError = error;
    }
  }

  if (!smallestBlob) {
    throw lastError instanceof Error
      ? lastError
      : new Error('Image compression failed: could not re-encode the image');
  }

  // FE-36: the re-encode is always JPEG bytes, so the filename must
  // say so — the old code kept the original name, shipping JPEG bytes
  // in a .png/.gif wrapper (a GIF additionally lost its animation to
  // a still frame under a .gif name). Renaming to .jpg is the honest
  // label for a still re-encode.
  const jpegName = `${String(file.name || 'image').replace(/\.[^/.]+$/, '') || 'image'}.jpg`;
  return new File([smallestBlob], jpegName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
};

/**
 * Compress file before upload
 * - Images: resize and re-encode; REJECTS if that is impossible (FE-05 —
 *   the original image, with its EXIF/GPS, is never uploaded as a fallback)
 * - Documents: return as-is (no lossless compression)
 */
export const compressFileIfNeeded = async (file) => {
  if (!file.type.startsWith('image/')) {
    // Not an image, return as-is
    return file;
  }

  // Image: compress it. Errors propagate to the caller (the chat
  // composer's send handler surfaces them as a visible upload failure).
  const compressed = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
  });

  const originalSize = file.size;
  const compressedSize = compressed.size;
  const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

  if (reduction > 5) {
    console.log(
      `Image compression: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${reduction}% reduction)`
    );
  }

  return compressed;
};
