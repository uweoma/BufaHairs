import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { createOrderSchema, orderNumberParam, listOrdersQuery } from '../validators/order.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createOrderSchema }), orderController.create);
router.get('/', validate({ query: listOrdersQuery }), orderController.list);
router.get('/:orderNumber', validate({ params: orderNumberParam }), orderController.getOne);
router.post('/:orderNumber/cancel', validate({ params: orderNumberParam }), orderController.cancel);

export default router;
