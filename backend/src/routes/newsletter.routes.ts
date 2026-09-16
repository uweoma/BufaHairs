import { Router } from 'express';
import * as newsletterController from '../controllers/newsletter.controller';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { newsletterSchema } from '../validators/newsletter.validator';

const router = Router();

router.post(
  '/subscribe',
  authLimiter,
  validate({ body: newsletterSchema }),
  newsletterController.subscribe,
);
router.post(
  '/unsubscribe',
  authLimiter,
  validate({ body: newsletterSchema }),
  newsletterController.unsubscribe,
);

export default router;
