import { z } from 'zod';

import * as notificationService
    from '../services/notificationService.js';


// ================================================================
// GET USER NOTIFICATIONS
// ================================================================
//
// GET /api/v1/notifications
//
// Optional query:
// ?limit=50&offset=0
// ================================================================

export const getNotifications = async (
    req,
    res,
    next
) => {

    try {

        const {
            limit,
            offset
        } = req.query;


        const parsedLimit =
            limit !== undefined
                ? parseInt(limit, 10)
                : 50;


        const parsedOffset =
            offset !== undefined
                ? parseInt(offset, 10)
                : 0;


        if (
            Number.isNaN(parsedLimit) ||
            parsedLimit < 1 ||
            parsedLimit > 100
        ) {

            return res.status(400).json({

                success: false,

                error:
                    'Limit must be a number between 1 and 100.'

            });

        }


        if (
            Number.isNaN(parsedOffset) ||
            parsedOffset < 0
        ) {

            return res.status(400).json({

                success: false,

                error:
                    'Offset must be a non-negative number.'

            });

        }


        const result =
            await notificationService
                .getUserNotifications(

                    req.user.id,

                    parsedLimit,

                    parsedOffset

                );


        return res.status(200).json({

            success: true,

            unread_count:
                result.unread_count,

            count:
                result.notifications.length,

            data:
                result.notifications

        });

    } catch (error) {

        return next(error);

    }

};


// ================================================================
// MARK ONE NOTIFICATION AS READ
// ================================================================
//
// PUT /api/v1/notifications/:id/read
// ================================================================

export const markNotificationRead = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        if (
            !id ||
            !/^\d+$/.test(
                String(id)
            )
        ) {

            return res.status(400).json({

                success: false,

                error:
                    'Invalid notification ID.'

            });

        }


        const result =
            await notificationService
                .markNotificationRead(

                    id,

                    req.user.id

                );


        return res.status(200).json({

            success: true,

            message:
                'Notification marked as read',

            data:
                result

        });

    } catch (error) {

        return next(error);

    }

};


// ================================================================
// MARK ALL NOTIFICATIONS AS READ
// ================================================================
//
// PUT /api/v1/notifications/read-all
// ================================================================

export const markAllNotificationsRead = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await notificationService
                .markAllNotificationsRead(
                    req.user.id
                );


        return res.status(200).json({

            success: true,

            message:
                'All notifications marked as read',

            updated_count:
                result.count

        });

    } catch (error) {

        return next(error);

    }

};


// ================================================================
// GET NOTIFICATION PREFERENCES
// ================================================================
//
// GET /api/v1/notifications/preferences
//
// Returns the logged-in user's notification settings.
// ================================================================

export const getNotificationPreferences = async (
    req,
    res,
    next
) => {

    try {

        const preferences =
            await notificationService
                .getNotificationPreferences(
                    req.user.id
                );


        return res.status(200).json({

            success: true,

            data:
                preferences

        });

    } catch (error) {

        return next(error);

    }

};


// ================================================================
// UPDATE NOTIFICATION PREFERENCES
// ================================================================
//
// PUT /api/v1/notifications/preferences
//
// Expected body:
//
// {
//     "interestRequestNotifications": true,
//     "proposalNotifications": true,
//     "acceptedProposalNotifications": false,
//     "rejectedProposalNotifications": true,
//     "counterOfferNotifications": true,
//     "messageNotifications": true,
//     "jugaadTaskNotifications": true,
//     "emailNotifications": true,
//     "inAppNotifications": true
// }
// ================================================================

const notificationPreferencesSchema =
    z.object({

        interestRequestNotifications:
            z.boolean(),

        proposalNotifications:
            z.boolean(),

        acceptedProposalNotifications:
            z.boolean(),

        rejectedProposalNotifications:
            z.boolean(),

        counterOfferNotifications:
            z.boolean(),

        messageNotifications:
            z.boolean(),

        jugaadTaskNotifications:
            z.boolean(),

        emailNotifications:
            z.boolean(),

        inAppNotifications:
            z.boolean()

    });


export const updateNotificationPreferences = async (
    req,
    res,
    next
) => {

    try {

        const validation =
            notificationPreferencesSchema.safeParse(
                req.body
            );


        if (
            !validation.success
        ) {

            return res.status(400).json({

                success: false,

                error:
                    validation.error
                        .issues[0]
                        ?.message ||
                    'Invalid notification preferences.',

                issues:
                    validation.error
                        .issues

            });

        }


        const updated =
            await notificationService
                .updateNotificationPreferences(

                    req.user.id,

                    validation.data

                );


        return res.status(200).json({

            success: true,

            message:
                'Notification preferences updated successfully.',

            data:
                updated

        });

    } catch (error) {

        return next(error);

    }

};