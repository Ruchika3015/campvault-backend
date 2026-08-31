import * as notificationRepository
    from '../repositories/notificationRepository.js';


// ================================================================
// NOTIFICATION PREFERENCE MAP
// ================================================================
//
// Every notification type is connected to the corresponding
// setting in the notification_preferences table.
//
// ================================================================

const NOTIFICATION_PREFERENCE_MAP = {

    // ------------------------------------------------------------
    // INTEREST REQUEST
    // ------------------------------------------------------------

    INTEREST_REQUEST:
        'interest_request_notifications',

    INTEREST_REQUEST_RECEIVED:
        'interest_request_notifications',

    INTEREST_RECEIVED:
        'interest_request_notifications',


    // ------------------------------------------------------------
    // PROPOSALS
    // ------------------------------------------------------------

    PROPOSAL_SUBMITTED:
        'proposal_notifications',

    NEW_PROPOSAL:
        'proposal_notifications',

    PROPOSAL_RECEIVED:
        'proposal_notifications',

    PROPOSAL_WITHDRAWN:
        'proposal_notifications',


    // ------------------------------------------------------------
    // ACCEPTED PROPOSAL
    // ------------------------------------------------------------

    PROPOSAL_ACCEPTED:
        'accepted_proposal_notifications',

    ACCEPTED_PROPOSAL:
        'accepted_proposal_notifications',


    // ------------------------------------------------------------
    // REJECTED PROPOSAL
    // ------------------------------------------------------------

    PROPOSAL_REJECTED:
        'rejected_proposal_notifications',

    REJECTED_PROPOSAL:
        'rejected_proposal_notifications',


    // ------------------------------------------------------------
    // COUNTER OFFER
    // ------------------------------------------------------------

    COUNTER_OFFER:
        'counter_offer_notifications',

    COUNTER_OFFER_RECEIVED:
        'counter_offer_notifications',

    NEW_COUNTER_OFFER:
        'counter_offer_notifications',


    // ------------------------------------------------------------
    // MESSAGES
    // ------------------------------------------------------------

    MESSAGE:
        'message_notifications',

    MESSAGE_RECEIVED:
        'message_notifications',

    NEW_MESSAGE:
        'message_notifications',


    // ------------------------------------------------------------
    // JUGAAD / TASK
    // ------------------------------------------------------------

    JUGAAD_UPDATE:
        'jugaad_task_notifications',

    JUGAAD_TASK_UPDATE:
        'jugaad_task_notifications',

    TASK_UPDATE:
        'jugaad_task_notifications',

    JUGAAD_STATUS_UPDATE:
        'jugaad_task_notifications'

};


// ================================================================
// NOTIFY USER
// ================================================================
//
// Central notification function.
//
// ALL normal notification creation should come through here.
//
// Flow:
//
// 1. Validate data
// 2. Find notification-specific preference
// 3. Check notification-specific preference
// 4. Check global in-app preference
// 5. Create notification
//
// Example:
//
// message_notifications = TRUE
// in_app_notifications = TRUE
//                 ↓
//          notification created
//
// message_notifications = FALSE
//                 ↓
//          notification skipped
//
// message_notifications = TRUE
// in_app_notifications = FALSE
//                 ↓
//          notification skipped
//
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

    // ============================================================
    // VALIDATE USER ID
    // ============================================================

    if (
        userId === undefined ||
        userId === null
    ) {

        console.error(
            'Notification skipped: userId is missing.'
        );

        return null;

    }


    // ============================================================
    // VALIDATE TYPE
    // ============================================================

    if (
        !type
    ) {

        console.error(
            'Notification skipped: notification type is missing.'
        );

        return null;

    }


    // ============================================================
    // VALIDATE TITLE
    // ============================================================

    if (
        !title
    ) {

        console.error(
            'Notification skipped: notification title is missing.'
        );

        return null;

    }


    // ============================================================
    // VALIDATE MESSAGE
    // ============================================================

    if (
        !message
    ) {

        console.error(
            'Notification skipped: notification message is missing.'
        );

        return null;

    }


    // ============================================================
    // FIND SPECIFIC NOTIFICATION PREFERENCE
    // ============================================================

    const preferenceColumn =
        NOTIFICATION_PREFERENCE_MAP[type];


    // ============================================================
    // UNKNOWN NOTIFICATION TYPE
    // ============================================================

    if (
        !preferenceColumn
    ) {

        console.warn(
            `Notification type "${type}" has no preference mapping. Notification skipped.`
        );

        return null;

    }


    // ============================================================
    // CHECK SPECIFIC NOTIFICATION SETTING
    // ============================================================

    const typeEnabled =
        await notificationRepository
            .isNotificationTypeEnabled(
                userId,
                preferenceColumn
            );


    // ============================================================
    // SPECIFIC NOTIFICATION IS OFF
    // ============================================================

    if (
        !typeEnabled
    ) {

        console.log(
            `Notification skipped: ${type} is disabled for user ${userId}.`
        );

        return null;

    }


    // ============================================================
    // CHECK GLOBAL IN-APP NOTIFICATION SETTING
    // ============================================================
    //
    // This is the master switch for notifications appearing
    // inside the application.
    //
    // ============================================================

    const inAppEnabled =
        await notificationRepository
            .isNotificationTypeEnabled(
                userId,
                'in_app_notifications'
            );


    // ============================================================
    // IN-APP NOTIFICATIONS ARE OFF
    // ============================================================

    if (
        !inAppEnabled
    ) {

        console.log(
            `Notification skipped: in-app notifications are disabled for user ${userId}.`
        );

        return null;

    }


    // ============================================================
    // CREATE NOTIFICATION
    // ============================================================

    return await notificationRepository
        .createNotification({

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

    return await notificationRepository
        .findNotificationsByUserId(
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
        await notificationRepository
            .markNotificationAsRead(
                id,
                userId
            );


    // ============================================================
    // NOTIFICATION NOT FOUND
    // ============================================================

    if (
        !updated
    ) {

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
        await notificationRepository
            .markAllNotificationsAsRead(
                userId
            );


    return {

        success: true,

        count:
            updated.length

    };

};


// ================================================================
// CHECK WHETHER A NOTIFICATION TYPE IS ENABLED
// ================================================================
//
// Utility function.
//
// Other backend services can use:
//
// isNotificationEnabled(userId, 'NEW_MESSAGE')
//
// ================================================================

export const isNotificationEnabled = async (
    userId,
    type
) => {

    // ------------------------------------------------------------
    // Find specific preference
    // ------------------------------------------------------------

    const preferenceColumn =
        NOTIFICATION_PREFERENCE_MAP[type];


    // ------------------------------------------------------------
    // Unknown type
    // ------------------------------------------------------------

    if (
        !preferenceColumn
    ) {

        return false;

    }


    // ------------------------------------------------------------
    // Check specific preference
    // ------------------------------------------------------------

    const typeEnabled =
        await notificationRepository
            .isNotificationTypeEnabled(
                userId,
                preferenceColumn
            );


    if (
        !typeEnabled
    ) {

        return false;

    }


    // ------------------------------------------------------------
    // Check global in-app preference
    // ------------------------------------------------------------

    const inAppEnabled =
        await notificationRepository
            .isNotificationTypeEnabled(
                userId,
                'in_app_notifications'
            );


    return Boolean(
        inAppEnabled
    );

};