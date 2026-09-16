import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemIdParam,
  mergeCartSchema,
} from '../validators/cart.validator';

const router = Router();

// All cart routes require authentication (guest carts live in the browser).
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', validate({ body: addCartItemSchema }), cartController.addItem);
router.patch(
  '/items/:id',
  validate({ params: cartItemIdParam, body: updateCartItemSchema }),
  cartController.updateItem,
);
router.delete('/items/:id', validate({ params: cartItemIdParam }), cartController.removeItem);
router.delete('/', cartController.clearCart);
router.post('/merge', validate({ body: mergeCartSchema }), cartController.mergeCart);

export default router;
