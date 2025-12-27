import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  bytes: number;
  width?: number;
  height?: number;
  format: string;
  resource_type: 'image' | 'video';
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
  file: File,
  type: 'image' | 'video',
  folder: string = 'fanhouse'
): Promise<CloudinaryUploadResult> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }

  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString('base64');
  const dataURI = `data:${file.type};base64,${base64}`;

  // Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(dataURI, {
    resource_type: type === 'video' ? 'video' : 'image',
    folder: `${folder}/${type}s`,
    public_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
    overwrite: false,
    invalidate: true,
  });

  return {
    public_id: uploadResult.public_id,
    secure_url: uploadResult.secure_url,
    url: uploadResult.url,
    bytes: uploadResult.bytes,
    width: uploadResult.width,
    height: uploadResult.height,
    format: uploadResult.format,
    resource_type: uploadResult.resource_type as 'image' | 'video',
  };
}

