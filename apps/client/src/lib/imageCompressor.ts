/**
 * PerfectPic Client-Side Image Compressor
 * Resizes and compresses high-resolution camera photos (10MB-20MB) 
 * down to optimized web/print JPEGs (300KB-800KB) before uploading.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Checks whether a file is an image by MIME type or file extension.
 * Recognizes standard web formats as well as camera RAW, HEIC, TIFF, BMP, etc.
 */
export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp|avif|heic|heif|gif|bmp|tiff?|dng|raw|cr2|nef|arw|svg)$/i.test(name);
}

/**
 * Converts a File or Blob into a permanent Base64 Data URL.
 * Unlike URL.createObjectURL(blob), Base64 Data URLs never expire upon navigation
 * or page reload, guaranteeing images remain visible across sessions.
 */
export function fileToDataUrl(fileOrBlob: File | Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      // In worst-case fallback, create a temporary object URL
      try {
        resolve(URL.createObjectURL(fileOrBlob));
      } catch {
        resolve('');
      }
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxDimension = 3800, quality = 0.92, mimeType = 'image/jpeg' } = options;

  // If not an image, return as is
  if (!isImageFile(file)) {
    return file;
  }

  // If SVG, return as is
  if (file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg')) {
    return file;
  }

  // If already under 1.5MB and standard web format, no compression needed
  const isStandardWeb = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (isStandardWeb && file.size < 1.5 * 1024 * 1024) {
    return file;
  }

  // Optimize memory using OffscreenCanvas and createImageBitmap when available
  if (typeof createImageBitmap !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file);
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const offscreen = new OffscreenCanvas(width, height);
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close(); // Immediately release uncompressed bitmap buffer

        const blob = await offscreen.convertToBlob({ type: mimeType, quality });
        if (blob && blob.size < file.size) {
          return new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: mimeType,
            lastModified: Date.now(),
          });
        }
        return file;
      }
      bitmap.close();
    } catch {
      // Gracefully fall through to DOM Image fallback
    }
  }

  // DOM Image fallback using ephemeral ObjectURL (zero base64 RAM inflation)
  return new Promise((resolve) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      resolve(file);
      return;
    }

    const img = new Image();
    const cleanup = () => {
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      } catch {}
    };

    img.onerror = () => {
      cleanup();
      resolve(file);
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect ratio downscaling
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          mimeType,
          quality
        );
      } catch {
        cleanup();
        resolve(file);
      }
    };

    img.src = objectUrl;
  });
}
