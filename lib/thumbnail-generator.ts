/**
 * Thumbnail Generation Utility
 * Handles generation of thumbnails for images, videos, and PDFs
 */

export interface ThumbnailResult {
  url: string;
  type: 'generated' | 'icon';
  mimeType: string;
}

/**
 * Generate thumbnail for uploaded files
 * @param file - The file to generate thumbnail for
 * @returns Promise<ThumbnailResult> - Generated thumbnail or fallback icon
 */
export async function generateThumbnail(file: File): Promise<ThumbnailResult> {
  const { type, name } = file;
  
  try {
    // Handle different file types
    if (type.startsWith('image/')) {
      return await generateImageThumbnail(file);
    } else if (type.startsWith('video/')) {
      return await generateVideoThumbnail(file);
    } else if (type === 'application/pdf') {
      return await generatePDFThumbnail(file);
    } else {
      return getFallbackIcon(type, name);
    }
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return getFallbackIcon(type, name);
  }
}

/**
 * Generate thumbnail for image files
 */
async function generateImageThumbnail(file: File): Promise<ThumbnailResult> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set thumbnail dimensions
      const maxSize = 300;
      const { width, height } = img;
      const ratio = Math.min(maxSize / width, maxSize / height);
      
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      
      // Draw and compress image
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            url: URL.createObjectURL(blob),
            type: 'generated',
            mimeType: file.type
          });
        } else {
          resolve(getFallbackIcon(file.type, file.name));
        }
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => {
      resolve(getFallbackIcon(file.type, file.name));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate thumbnail for video files
 */
async function generateVideoThumbnail(file: File): Promise<ThumbnailResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      // Set canvas dimensions
      const maxSize = 300;
      const { videoWidth, videoHeight } = video;
      const ratio = Math.min(maxSize / videoWidth, maxSize / videoHeight);
      
      canvas.width = videoWidth * ratio;
      canvas.height = videoHeight * ratio;
      
      // Seek to 25% of video duration for a good frame
      video.currentTime = video.duration * 0.25;
    };
    
    video.onseeked = () => {
      // Draw video frame to canvas
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            url: URL.createObjectURL(blob),
            type: 'generated',
            mimeType: 'image/jpeg'
          });
        } else {
          resolve(getFallbackIcon(file.type, file.name));
        }
      }, 'image/jpeg', 0.8);
    };
    
    video.onerror = () => {
      resolve(getFallbackIcon(file.type, file.name));
    };
    
    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/**
 * Generate thumbnail for PDF files
 */
async function generatePDFThumbnail(file: File): Promise<ThumbnailResult> {
  try {
    // For now, return PDF icon - could integrate PDF.js in the future
    // This is a placeholder for future PDF thumbnail generation
    return getFallbackIcon(file.type, file.name);
  } catch (error) {
    return getFallbackIcon(file.type, file.name);
  }
}

/**
 * Get fallback icon based on file type
 */
function getFallbackIcon(mimeType: string, fileName: string): ThumbnailResult {
  // Create SVG icons for different file types
  const iconColor = getIconColor(mimeType);
  const iconSymbol = getIconSymbol(mimeType, fileName);
  
  const svgIcon = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${iconColor.bg}" rx="20"/>
      <text x="100" y="100" text-anchor="middle" dominant-baseline="central" 
            font-family="system-ui, sans-serif" font-size="60" fill="${iconColor.text}">
        ${iconSymbol}
      </text>
      <text x="100" y="160" text-anchor="middle" dominant-baseline="central" 
            font-family="system-ui, sans-serif" font-size="12" fill="${iconColor.text}" opacity="0.8">
        ${getFileExtension(fileName)}
      </text>
    </svg>
  `;
  
  const blob = new Blob([svgIcon], { type: 'image/svg+xml' });
  
  return {
    url: URL.createObjectURL(blob),
    type: 'icon',
    mimeType: 'image/svg+xml'
  };
}

/**
 * Get icon color scheme based on file type
 */
function getIconColor(mimeType: string): { bg: string; text: string } {
  if (mimeType.startsWith('image/')) {
    return { bg: '#dbeafe', text: '#1d4ed8' }; // Blue
  } else if (mimeType.startsWith('video/')) {
    return { bg: '#dcfce7', text: '#166534' }; // Green
  } else if (mimeType === 'application/pdf') {
    return { bg: '#fed7d7', text: '#c53030' }; // Red
  } else if (mimeType.startsWith('audio/')) {
    return { bg: '#fef3c7', text: '#d69e2e' }; // Yellow
  } else {
    return { bg: '#f3f4f6', text: '#374151' }; // Gray
  }
}

/**
 * Get icon symbol based on file type
 */
function getIconSymbol(mimeType: string, fileName: string): string {
  if (mimeType.startsWith('image/')) {
    return '🖼️';
  } else if (mimeType.startsWith('video/')) {
    return '🎥';
  } else if (mimeType === 'application/pdf') {
    return '📄';
  } else if (mimeType.startsWith('audio/')) {
    return '🎵';
  } else {
    return '📎';
  }
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
}

/**
 * Generate thumbnails for multiple files
 */
export async function generateThumbnails(files: File[]): Promise<ThumbnailResult[]> {
  const promises = files.map(file => generateThumbnail(file));
  return Promise.all(promises);
}

/**
 * Cleanup generated thumbnail URLs to prevent memory leaks
 */
export function cleanupThumbnail(thumbnailResult: ThumbnailResult): void {
  if (thumbnailResult.url.startsWith('blob:')) {
    URL.revokeObjectURL(thumbnailResult.url);
  }
}

/**
 * Batch cleanup for multiple thumbnails
 */
export function cleanupThumbnails(thumbnailResults: ThumbnailResult[]): void {
  thumbnailResults.forEach(cleanupThumbnail);
}