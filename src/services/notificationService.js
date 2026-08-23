import * as notificationRepository from '../repositories/notificationRepository.js';

export const notifyUser = async ({
    userId,
    type,
    title,
    message,
    referenceType = null,
    referenceId = null,
    client = null
}) => {
    return await notificationRepository.createNotification({
        userId,
        type,
        title,
        message,
        referenceType,
        referenceId,
        client
    });
};

export const getUserNotifications = async (userId, limit = 50, offset = 0) => {
    return await notificationRepository.findNotificationsByUserId(userId, limit, offset);
};

export const markNotificationRead = async (id, userId) => {
    const updated = await notificationRepository.markNotificationAsRead(id, userId);
    if (!updated) {
        const error = new Error("Notification not found or access denied.");
        error.statusCode = 404;
        throw error;
    }
    return updated;
};

export const markAllNotificationsRead = async (userId) => {
    const updated = await notificationRepository.markAllNotificationsAsRead(userId);
    return { success: true, count: updated.length };
};
