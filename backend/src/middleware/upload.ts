import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

/**
 * In-memory upload handling — buffers are streamed straight to Cloudinary, so
 * nothing is written to local disk. Rejects non-image and oversized files.
 */
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Only image files (jpeg, png, webp, avif, gif) are allowed'));
    }
  },
});
