import express from 'express';

import * as notificationController
    from '../controllers/notificationController.js';

import {
    authenticate
} from '../middleware/authMiddleware.js';


const router =
    express.Router();


// ================================================================
// GET NOTIFICATIONS
// ================================================================

router.get(
    '/',
    authenticate,
    notificationController.getNotifications
);


// ================================================================
// NOTIFICATION PREFERENCES
// ================================================================

// GET /api/v1/notifications/preferences

router.get(
    '/preferences',
    authenticate,
    notificationController.getNotificationPreferences
);


// PUT /api/v1/notifications/preferences

router.put(
    '/preferences',
    authenticate,
    notificationController.updateNotificationPreferences
);


// ================================================================
// MARK ALL AS READ
// ================================================================
//
// Must come before /:id/read
// ================================================================

router.put(
    '/read-all',
    authenticate,
    notificationController.markAllNotificationsRead
);


// ================================================================
// MARK ONE AS READ
// ================================================================

router.put(
    '/:id/read',
    authenticate,
    notificationController.markNotificationRead
);


export default router;