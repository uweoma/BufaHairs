import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
  slugParamSchema,
} from '../validators/product.validator';

const router = Router();

router.get('/', categoryController.list);
router.get('/:slug', validate({ params: slugParamSchema }), categoryController.getBySlug);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createCategorySchema }),
  categoryController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: updateCategorySchema }),
  categoryController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  categoryController.remove,
);

export default router;
