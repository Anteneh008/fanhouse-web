import imageCompression from 'browser-image-compression';

/**
 * Compress an image file to reduce its size
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum file size in MB (default: 4MB)
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 4
): Promise<File> {
  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,
    fileType: file.type,
    initialQuality: 0.8, // Start with 80% quality
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // If still too large, compress more aggressively
    if (compressedFile.size > maxSizeMB * 1024 * 1024) {
      const aggressiveOptions = {
        ...options,
        initialQuality: 0.6, // Reduce to 60% quality
        maxWidthOrHeight: 1600, // Reduce max dimension
      };
      return await imageCompression(file, aggressiveOptions);
    }
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    // If compression fails, return original file
    return file;
  }
}

