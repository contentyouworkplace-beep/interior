/**
 * Image Compression Utility
 * Compresses images before upload to reduce storage and bandwidth
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    outputFormat = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use better image smoothing for quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Create new file with same name but compressed
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, `.${outputFormat.split('/')[1]}`),
              {
                type: outputFormat,
                lastModified: Date.now()
              }
            );

            const originalSize = file.size;
            const compressedSize = blob.size;

            resolve({
              compressedFile,
              originalSize,
              compressedSize,
              compressionRatio: (1 - compressedSize / originalSize) * 100,
              dimensions: { width, height }
            });
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if file is an image that can be compressed
 */
export function isCompressibleImage(file: File): boolean {
  const compressibleTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  return compressibleTypes.includes(file.type.toLowerCase());
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Batch compress multiple images
 */
export async function compressMultipleImages(
  files: File[],
  options?: CompressionOptions,
  onProgress?: (completed: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  let completed = 0;

  for (const file of files) {
    if (isCompressibleImage(file)) {
      try {
        const result = await compressImage(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        // Return original file if compression fails
        results.push({
          compressedFile: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          dimensions: { width: 0, height: 0 }
        });
      }
    } else {
      // Non-image files passed through unchanged
      results.push({
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        dimensions: { width: 0, height: 0 }
      });
    }

    completed++;
    onProgress?.(completed, files.length);
  }

  return results;
}
