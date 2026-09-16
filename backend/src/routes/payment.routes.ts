import express, { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { env } from '../config/env';
import { paystackEnabled } from '../services/payment/paystack';
import { verifyPaymentSchema } from '../validators/payment.validator';
import { orderNumberParam } from '../validators/order.validator';

const router = Router();

// Webhook — PUBLIC, raw body for signature verification. Must precede any auth.
router.post(
  '/webhook',
  express.raw({ type: '*/*', limit: '1mb' }),
  paymentController.webhook,
);

// DEV-ONLY simulator, only mounted when Paystack is not configured outside prod.
if (!env.isProd && !paystackEnabled) {
  router.post(
    '/dev/complete',
    authenticate,
    validate({ body: verifyPaymentSchema }),
    paymentController.devComplete,
  );
}

router.post(
  '/:orderNumber/initialize',
  authenticate,
  validate({ params: orderNumberParam }),
  paymentController.initialize,
);
router.post(
  '/verify',
  authenticate,
  validate({ body: verifyPaymentSchema }),
  paymentController.verify,
);

export default router;
