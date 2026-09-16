import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { uploadImages } from '../middleware/upload';
import { idParamSchema, createProductSchema, updateProductSchema } from '../validators/product.validator';
import { orderNumberParam } from '../validators/order.validator';
import {
  analyticsQuerySchema,
  adminOrderListQuery,
  updateOrderSchema,
  customerListQuery,
  setActiveSchema,
  reviewModerationQuery,
  setApprovalSchema,
  adminProductListQuery,
  createCouponSchema,
  updateCouponSchema,
} from '../validators/admin.validator';

const router = Router();

// Every admin route requires an authenticated ADMIN.
router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/overview', adminController.overview);
router.get('/analytics', validate({ query: analyticsQuerySchema }), adminController.analytics);

// Orders
router.get('/orders', validate({ query: adminOrderListQuery }), adminController.listOrders);
router.get('/orders/:orderNumber', validate({ params: orderNumberParam }), adminController.getOrder);
router.patch(
  '/orders/:orderNumber',
  validate({ params: orderNumberParam, body: updateOrderSchema }),
  adminController.updateOrder,
);

// Customers
router.get('/customers', validate({ query: customerListQuery }), adminController.listCustomers);
router.get('/customers/:id', validate({ params: idParamSchema }), adminController.getCustomer);
router.patch(
  '/customers/:id',
  validate({ params: idParamSchema, body: setActiveSchema }),
  adminController.setCustomerActive,
);

// Products
router.get('/products', validate({ query: adminProductListQuery }), adminController.listProducts);
router.post('/products', validate({ body: createProductSchema }), adminController.createProduct);
router.get('/products/:id', validate({ params: idParamSchema }), adminController.getProduct);
router.patch(
  '/products/:id',
  validate({ params: idParamSchema, body: updateProductSchema }),
  adminController.updateProduct,
);
router.delete('/products/:id', validate({ params: idParamSchema }), adminController.deleteProduct);

// Coupons
router.get('/coupons', adminController.listCoupons);
router.post('/coupons', validate({ body: createCouponSchema }), adminController.createCoupon);
router.get('/coupons/:id', validate({ params: idParamSchema }), adminController.getCoupon);
router.patch(
  '/coupons/:id',
  validate({ params: idParamSchema, body: updateCouponSchema }),
  adminController.updateCoupon,
);
router.delete('/coupons/:id', validate({ params: idParamSchema }), adminController.deleteCoupon);

// Reviews (moderation)
router.get('/reviews', validate({ query: reviewModerationQuery }), adminController.listReviews);
router.patch(
  '/reviews/:id',
  validate({ params: idParamSchema, body: setApprovalSchema }),
  adminController.moderateReview,
);
router.delete('/reviews/:id', validate({ params: idParamSchema }), adminController.deleteReview);

// Image uploads (Cloudinary) — field name "images", up to 8 files.
router.post('/uploads', uploadImages.array('images', 8), adminController.uploadProductImages);

export default router;
