import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
  idParamSchema,
  slugParamSchema,
} from '../validators/product.validator';

const router = Router();

// Public
router.get('/', validate({ query: productListQuerySchema }), productController.list);
router.post('/by-ids', productController.getByIds);
router.get('/:slug', validate({ params: slugParamSchema }), productController.getBySlug);
router.get('/:slug/related', validate({ params: slugParamSchema }), productController.getRelated);

// Admin (create / update / delete)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createProductSchema }),
  productController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: updateProductSchema }),
  productController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  productController.remove,
);

export default router;
