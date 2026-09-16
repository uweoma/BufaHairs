import { Router } from 'express';
import * as addressController from '../controllers/address.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  addressBodySchema,
  updateAddressSchema,
  addressIdParam,
} from '../validators/address.validator';

const router = Router();

router.use(authenticate);

router.get('/', addressController.list);
router.post('/', validate({ body: addressBodySchema }), addressController.create);
router.patch(
  '/:id',
  validate({ params: addressIdParam, body: updateAddressSchema }),
  addressController.update,
);
router.patch('/:id/default', validate({ params: addressIdParam }), addressController.setDefault);
router.delete('/:id', validate({ params: addressIdParam }), addressController.remove);

export default router;
