/**
 * Image Processing Utilities
 * Handle image cropping, resizing, and validation
 */

/**
 * Resize image to target dimensions while maintaining aspect ratio
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<Blob>} - Resized image blob
 */
export const resizeImage = (file, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Crop image to square from center
 * @param {File} file - Image file
 * @param {number} size - Square size (default 400x400)
 * @returns {Promise<Blob>} - Cropped square image blob
 */
export const cropToSquare = (file, size = 400) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // Calculate crop dimensions (crop from center)
        let sourceX, sourceY, sourceSize;
        
        if (img.width > img.height) {
          sourceSize = img.height;
          sourceX = (img.width - sourceSize) / 2;
          sourceY = 0;
        } else {
          sourceSize = img.width;
          sourceX = 0;
          sourceY = (img.height - sourceSize) / 2;
        }
        
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          size,
          size
        );
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 * @param {File} file - Image file
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {Object} - Validation result { valid: boolean, error: string | null }
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Image size must be less than ${maxSizeMB}MB` };
  }
  
  return { valid: true, error: null };
};

/**
 * Process image for category upload (square crop + resize)
 * @param {File} file - Image file
 * @returns {Promise<File>} - Processed image as File
 */
export const processCategoryImage = async (file) => {
  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Crop to square then resize
  const croppedBlob = await cropToSquare(file, 500);
  const resizedBlob = await resizeImage(
    new File([croppedBlob], file.name, { type: 'image/jpeg' }),
    400,
    400
  );
  
  // Convert blob back to File
  return new File([resizedBlob], file.name, { type: 'image/jpeg' });
};
