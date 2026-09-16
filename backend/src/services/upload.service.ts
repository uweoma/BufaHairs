import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export interface UploadedImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

const FOLDER = 'bufahairs/products';

/**
 * Streams an in-memory image buffer to Cloudinary and returns its hosted URL +
 * publicId (stored on ProductImage so it can be deleted later). Throws 503 when
 * Cloudinary is not configured — the endpoint never returns a fake URL.
 */
export function uploadImage(file: Express.Multer.File): Promise<UploadedImage> {
  if (!env.cloudinaryEnabled) {
    throw new ApiError(503, 'Image uploads are unavailable (Cloudinary not configured)');
  }
  return new Promise<UploadedImage>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload failed', error);
          reject(new ApiError(502, 'Image upload failed, please try again'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      },
    );
    stream.end(file.buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!env.cloudinaryEnabled) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.warn('Cloudinary delete failed (ignored)', err);
  }
}
