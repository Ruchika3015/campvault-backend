import * as notificationService from '../services/notificationService.js';

export const getNotifications = async (req, res, next) => {
    try {
        const { limit, offset } = req.query;
        const result = await notificationService.getUserNotifications(
            req.user.id,
            limit ? parseInt(limit, 10) : 50,
            offset ? parseInt(offset, 10) : 0
        );
        return res.status(200).json({
            success: true,
            unread_count: result.unread_count,
            count: result.notifications.length,
            data: result.notifications
        });
    } catch (error) {
        return next(error);
    }
};

export const markNotificationRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await notificationService.markNotificationRead(id, req.user.id);
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

export const markAllNotificationsRead = async (req, res, next) => {
    try {
        const result = await notificationService.markAllNotificationsRead(req.user.id);
        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            updated_count: result.count
        });
    } catch (error) {
        return next(error);
    }
};
