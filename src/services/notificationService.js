import * as notificationRepository
    from '../repositories/notificationRepository.js';


// ================================================================
// NOTIFICATION TYPE → PREFERENCE COLUMN
// ================================================================
//
// These names connect notification events to the switches in
// Settings.
//
// Unknown notification types are allowed and will default to ON.
// ================================================================

const NOTIFICATION_PREFERENCE_MAP = {

    // Someone expressed interest in a Jugaad
    INTEREST_REQUEST:
        'interest_request_notifications',

    INTEREST_RECEIVED:
        'interest_request_notifications',

    // Someone submitted a proposal
    PROPOSAL_SUBMITTED:
        'proposal_notifications',

    NEW_PROPOSAL:
        'proposal_notifications',

    // Your proposal was accepted
    PROPOSAL_ACCEPTED:
        'accepted_proposal_notifications',

    // Your proposal was rejected
    PROPOSAL_REJECTED:
        'rejected_proposal_notifications',

    // Counter offer
    COUNTER_OFFER:
        'counter_offer_notifications',

    COUNTER_OFFER_RECEIVED:
        'counter_offer_notifications',

    // Messages
    MESSAGE:
        'message_notifications',

    NEW_MESSAGE:
        'message_notifications',

    // Jugaad/task status changes
    JUGAAD_UPDATE:
        'jugaad_task_notifications',

    TASK_UPDATE:
        'jugaad_task_notifications',

};


// ================================================================
// CREATE NOTIFICATION
// ================================================================
//
// Creates a notification only when the corresponding notification
// preference is enabled.
//
// Unknown notification types continue to work normally.
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

    const preferenceColumn =
        NOTIFICATION_PREFERENCE_MAP[
            String(type || '')
                .toUpperCase()
        ];


    /*
     * If this notification type has a corresponding Settings
     * switch, check whether the user has enabled it.
     *
     * If there is no matching preference, preserve existing
     * behavior and create the notification.
     */

    if (
        preferenceColumn
    ) {

        const enabled =
            await notificationRepository
                .isNotificationTypeEnabled(
                    userId,
                    preferenceColumn
                );


        if (!enabled) {

            return null;

        }

    }


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
        await notificationRepository
            .markAllNotificationsAsRead(
                userId
            );


    return {

        success:
            true,

        count:
            updated.length

    };

};


// ================================================================
// GET NOTIFICATION PREFERENCES
// ================================================================
//
// Returns the user's current notification Settings.
//
// Example:
//
// {
//     interestRequestNotifications: true,
//     proposalNotifications: true,
//     acceptedProposalNotifications: false,
//     ...
// }
// ================================================================

export const getNotificationPreferences = async (
    userId
) => {

    const preferences =
        await notificationRepository
            .getNotificationPreferences(
                userId
            );


    if (!preferences) {

        const error =
            new Error(
                'Unable to load notification preferences.'
            );


        error.statusCode = 500;


        throw error;

    }


    return {

        interestRequestNotifications:
            Boolean(
                preferences
                    .interest_request_notifications
            ),

        proposalNotifications:
            Boolean(
                preferences
                    .proposal_notifications
            ),

        acceptedProposalNotifications:
            Boolean(
                preferences
                    .accepted_proposal_notifications
            ),

        rejectedProposalNotifications:
            Boolean(
                preferences
                    .rejected_proposal_notifications
            ),

        counterOfferNotifications:
            Boolean(
                preferences
                    .counter_offer_notifications
            ),

        messageNotifications:
            Boolean(
                preferences
                    .message_notifications
            ),

        jugaadTaskNotifications:
            Boolean(
                preferences
                    .jugaad_task_notifications
            ),

        emailNotifications:
            Boolean(
                preferences
                    .email_notifications
            ),

        inAppNotifications:
            Boolean(
                preferences
                    .in_app_notifications
            ),

        createdAt:
            preferences.created_at,

        updatedAt:
            preferences.updated_at

    };

};


// ================================================================
// UPDATE NOTIFICATION PREFERENCES
// ================================================================
//
// Updates only the user's notification preferences.
//
// Every field is converted explicitly to Boolean so the database
// always receives predictable TRUE/FALSE values.
// ================================================================

export const updateNotificationPreferences = async (
    userId,
    preferences
) => {

    const cleanPreferences = {

        interestRequestNotifications:
            Boolean(
                preferences
                    ?.interestRequestNotifications
            ),

        proposalNotifications:
            Boolean(
                preferences
                    ?.proposalNotifications
            ),

        acceptedProposalNotifications:
            Boolean(
                preferences
                    ?.acceptedProposalNotifications
            ),

        rejectedProposalNotifications:
            Boolean(
                preferences
                    ?.rejectedProposalNotifications
            ),

        counterOfferNotifications:
            Boolean(
                preferences
                    ?.counterOfferNotifications
            ),

        messageNotifications:
            Boolean(
                preferences
                    ?.messageNotifications
            ),

        jugaadTaskNotifications:
            Boolean(
                preferences
                    ?.jugaadTaskNotifications
            ),

        emailNotifications:
            Boolean(
                preferences
                    ?.emailNotifications
            ),

        inAppNotifications:
            Boolean(
                preferences
                    ?.inAppNotifications
            )

    };


    const updated =
        await notificationRepository
            .updateNotificationPreferences(

                userId,

                cleanPreferences

            );


    if (!updated) {

        const error =
            new Error(
                'Unable to update notification preferences.'
            );


        error.statusCode = 500;


        throw error;

    }


    return {

        interestRequestNotifications:
            Boolean(
                updated
                    .interest_request_notifications
            ),

        proposalNotifications:
            Boolean(
                updated
                    .proposal_notifications
            ),

        acceptedProposalNotifications:
            Boolean(
                updated
                    .accepted_proposal_notifications
            ),

        rejectedProposalNotifications:
            Boolean(
                updated
                    .rejected_proposal_notifications
            ),

        counterOfferNotifications:
            Boolean(
                updated
                    .counter_offer_notifications
            ),

        messageNotifications:
            Boolean(
                updated
                    .message_notifications
            ),

        jugaadTaskNotifications:
            Boolean(
                updated
                    .jugaad_task_notifications
            ),

        emailNotifications:
            Boolean(
                updated
                    .email_notifications
            ),

        inAppNotifications:
            Boolean(
                updated
                    .in_app_notifications
            ),

        createdAt:
            updated.created_at,

        updatedAt:
            updated.updated_at

    };

};