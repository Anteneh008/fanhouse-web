import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { uploadToCloudinary } from './cloudinary';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (Vercel free tier limit is 4.5MB)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export interface UploadResult {
  filename: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

/**
 * Save uploaded file - uses Cloudinary if configured, otherwise falls back to local filesystem
 */
export async function saveUploadedFile(
  file: File,
  type: 'image' | 'video'
): Promise<UploadResult> {
  // Validate file type
  if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  if (type === 'video' && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error(`Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Use Cloudinary if configured (for production/Vercel)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudinaryResult = await uploadToCloudinary(file, type);
      
      return {
        filename: cloudinaryResult.public_id,
        fileUrl: cloudinaryResult.secure_url,
        fileType: type,
        fileSize: cloudinaryResult.bytes,
        mimeType: file.type,
        thumbnailUrl: type === 'video' 
          ? cloudinaryResult.secure_url.replace(/\.(mp4|webm|mov)$/, '.jpg')
          : cloudinaryResult.secure_url,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      };
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw new Error(`Failed to upload to cloud storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fallback to local filesystem (for local development only)
  // This will fail on Vercel, but useful for local testing
  const extension = file.name.split('.').pop() || 'bin';
  const filename = `${randomUUID()}.${extension}`;
  const subdir = type === 'image' ? 'images' : 'videos';
  const filepath = join(UPLOAD_DIR, subdir, filename);

  try {
    // Ensure directory exists
    await mkdir(join(UPLOAD_DIR, subdir), { recursive: true });

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return file info
    return {
      filename,
      fileUrl: `/uploads/${subdir}/${filename}`,
      fileType: type,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    // If filesystem write fails (like on Vercel), throw helpful error
    if (error instanceof Error && error.message.includes('read-only')) {
      throw new Error('File upload failed: Filesystem is read-only. Please configure Cloudinary for file uploads. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }
    throw error;
  }
}

/**
 * Get image dimensions (basic - for MVP)
 * For production, use sharp or similar library
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  // For MVP, return null - can be enhanced later
  // In production, use sharp or canvas to get actual dimensions
  return null;
}

