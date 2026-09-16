import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { idParamSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.post('/read-all', notificationController.markAllRead);
router.post('/:id/read', validate({ params: idParamSchema }), notificationController.markRead);

export default router;
