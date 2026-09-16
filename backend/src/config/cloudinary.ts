import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

/**
 * Cloudinary is optional. When credentials are absent the SDK is left
 * unconfigured and the upload service refuses with a clear error — we never
 * fabricate image URLs. Admins can still paste hosted URLs directly.
 */
if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };
