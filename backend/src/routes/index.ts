import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import authRouter from './auth.routes';
import productRouter from './product.routes';
import categoryRouter from './category.routes';
import cartRouter from './cart.routes';
import wishlistRouter from './wishlist.routes';
import shippingRouter from './shipping.routes';
import couponRouter from './coupon.routes';
import addressRouter from './address.routes';
import orderRouter from './order.routes';
import paymentRouter from './payment.routes';
import reviewRouter from './review.routes';
import adminRouter from './admin.routes';
import notificationRouter from './notification.routes';
import newsletterRouter from './newsletter.routes';

const router = Router();

/** Liveness + DB readiness probe (used by docker healthcheck). */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(
      res,
      { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() },
      'Service healthy',
    );
  }),
);

// Feature routers
router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/cart', cartRouter);
router.use('/wishlist', wishlistRouter);
router.use('/shipping', shippingRouter);
router.use('/coupons', couponRouter);
router.use('/addresses', addressRouter);
router.use('/orders', orderRouter);
router.use('/payments', paymentRouter);
router.use('/reviews', reviewRouter);
router.use('/admin', adminRouter);
router.use('/notifications', notificationRouter);
router.use('/newsletter', newsletterRouter);

export default router;
