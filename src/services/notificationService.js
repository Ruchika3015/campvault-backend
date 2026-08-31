import * as notificationRepository from '../repositories/notificationRepository.js';


// ================================================================
// CREATE NOTIFICATION
// ================================================================

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


// ================================================================
// GET USER NOTIFICATIONS
// ================================================================

export const getUserNotifications = async (
    userId,
    limit = 50,
    offset = 0
) => {

    return await notificationRepository.findNotificationsByUserId(
        userId,
        limit,
        offset
    );

};


// ================================================================
// MARK ONE NOTIFICATION AS READ
// ================================================================

export const markNotificationRead = async (
    id,
    userId
) => {

    const updated =
        await notificationRepository.markNotificationAsRead(
            id,
            userId
        );

    if (!updated) {

        const error =
            new Error(
                'Notification not found or access denied.'
            );

        error.statusCode = 404;

        throw error;

    }

    return updated;

};


// ================================================================
// MARK ALL NOTIFICATIONS AS READ
// ================================================================

export const markAllNotificationsRead = async (
    userId
) => {

    const updated =
        await notificationRepository.markAllNotificationsAsRead(
            userId
        );

    return {
        success: true,
        count: updated.length
    };

};


// ================================================================
// GET NOTIFICATION PREFERENCES
// ================================================================
//
// Returns the current user's notification preferences.
//
// If the user does not have a preferences row yet,
// the repository creates one using database defaults.
// ================================================================

export const getNotificationPreferences = async (
    userId
) => {

    const preferences =
        await notificationRepository.getNotificationPreferences(
            userId
        );

    if (!preferences) {

        const error =
            new Error(
                'Notification preferences could not be loaded.'
            );

        error.statusCode = 500;

        throw error;

    }

    return preferences;

};


// ================================================================
// UPDATE NOTIFICATION PREFERENCES
// ================================================================

export const updateNotificationPreferences = async (
    userId,
    preferences
) => {

    const updated =
        await notificationRepository.updateNotificationPreferences(
            userId,
            preferences
        );

    if (!updated) {

        const error =
            new Error(
                'Notification preferences could not be updated.'
            );

        error.statusCode = 500;

        throw error;

    }

    return updated;

};


// ================================================================
// CHECK WHETHER A NOTIFICATION TYPE IS ENABLED
// ================================================================
//
// Example:
//
// const enabled = await isNotificationTypeEnabled(
//     userId,
//     'message_notifications'
// );
//
// ================================================================

export const isNotificationTypeEnabled = async (
    userId,
    preferenceColumn
) => {

    return await notificationRepository.isNotificationTypeEnabled(
        userId,
        preferenceColumn
    );

};