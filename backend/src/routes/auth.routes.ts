import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authLimiter, sensitiveLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

router.post(
  '/forgot-password',
  sensitiveLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  sensitiveLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);
router.post('/verify-email', validate({ body: verifyEmailSchema }), authController.verifyEmail);

export default router;
