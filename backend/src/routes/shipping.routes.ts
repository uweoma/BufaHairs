import { Router } from 'express';
import * as shippingController from '../controllers/shipping.controller';
import { validate } from '../middleware/validate';
import { shippingQuoteSchema } from '../validators/shipping.validator';

const router = Router();

// Public — used by the shipping-info page and checkout estimate.
router.get('/zones', shippingController.getZones);
router.post('/quote', validate({ body: shippingQuoteSchema }), shippingController.getQuote);

export default router;
