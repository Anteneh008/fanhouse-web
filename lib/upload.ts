import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export interface UploadResult {
  filename: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  fileSize: number;
  mimeType: string;
}

/**
 * Save uploaded file to disk
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

  // Generate unique filename
  const extension = file.name.split('.').pop() || 'bin';
  const filename = `${randomUUID()}.${extension}`;
  const subdir = type === 'image' ? 'images' : 'videos';
  const filepath = join(UPLOAD_DIR, subdir, filename);

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

