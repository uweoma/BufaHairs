import { Router } from 'express';
import * as wishlistController from '../controllers/wishlist.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { productIdParam } from '../validators/wishlist.validator';

const router = Router();

router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/:productId', validate({ params: productIdParam }), wishlistController.addItem);
router.delete('/:productId', validate({ params: productIdParam }), wishlistController.removeItem);
router.post(
  '/:productId/move-to-cart',
  validate({ params: productIdParam }),
  wishlistController.moveToCart,
);

export default router;
