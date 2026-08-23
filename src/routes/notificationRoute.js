import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Get user notifications
router.get('/', authenticate, notificationController.getNotifications);

// 2. Mark all notifications as read (must come before /:id/read)
router.put('/read-all', authenticate, notificationController.markAllNotificationsRead);

// 3. Mark single notification as read
router.put('/:id/read', authenticate, notificationController.markNotificationRead);

export default router;
