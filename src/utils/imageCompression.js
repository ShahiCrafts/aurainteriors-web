/**
 * Image Compression Utility for Chat Attachments
 * 
 * Compresses images before upload to reduce bandwidth and speed up transfers.
 * For chat use case, max 1200x1200 is reasonable (full resolution not needed for preview).
 */

/**
 * Compress image using canvas
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image as a new File
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8, // 80% quality is sweet spot for chat (visually good, much smaller)
    maxSizeKB = 500, // Don't compress beyond 500KB if possible
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let newWidth = img.width;
          let newHeight = img.height;

          if (img.width > maxWidth || img.height > maxHeight) {
            const aspectRatio = img.width / img.height;
            if (img.width > img.height) {
              newWidth = maxWidth;
              newHeight = Math.round(maxWidth / aspectRatio);
            } else {
              newHeight = maxHeight;
              newWidth = Math.round(maxHeight * aspectRatio);
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Convert to blob with quality setting
          canvas.toBlob(
            (blob) => {
              // If compression didn't help much, use original
              if (blob.size > file.size) {
                resolve(file);
                return;
              }

              // Create new File from compressed blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          console.error('Image compression error:', error);
          // Fallback to original on error
          resolve(file);
        }
      };

      img.onerror = () => {
        console.error('Failed to load image for compression');
        resolve(file);
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      console.error('FileReader error');
      reject(file);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress file before upload
 * - Images: resize and re-encode
 * - Documents: return as-is (no lossless compression)
 */
export const compressFileIfNeeded = async (file) => {
  if (!file.type.startsWith('image/')) {
    // Not an image, return as-is
    return file;
  }

  // Image: compress it
  try {
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
  } catch (error) {
    console.error('Compression failed, using original:', error);
    return file;
  }
};
