import pool from '../config/db.js';


// ================================================================
// CREATE NOTIFICATION
// ================================================================

export const createNotification = async ({
    userId,
    type,
    title,
    message,
    referenceType = null,
    referenceId = null,
    client = null
}) => {

    const db =
        client || pool;


    const query = `
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            reference_type,
            reference_id
        )

        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )

        RETURNING *;
    `;


    const values = [
        userId,
        type,
        title,
        message,
        referenceType,
        referenceId
    ];


    const {
        rows
    } = await db.query(
        query,
        values
    );


    return rows[0];

};


// ================================================================
// GET USER NOTIFICATIONS
// ================================================================

export const findNotificationsByUserId = async (
    userId,
    limit = 50,
    offset = 0
) => {

    const query = `
        SELECT *
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3;
    `;


    const countQuery = `
        SELECT
            COUNT(*) AS unread_count

        FROM notifications

        WHERE user_id = $1
          AND is_read = FALSE;
    `;


    const [
        listResult,
        countResult
    ] = await Promise.all([

        pool.query(
            query,
            [
                userId,
                limit,
                offset
            ]
        ),

        pool.query(
            countQuery,
            [userId]
        )

    ]);


    return {

        notifications:
            listResult.rows,

        unread_count:
            parseInt(
                countResult
                    .rows[0]
                    .unread_count,
                10
            )

    };

};


// ================================================================
// MARK ONE NOTIFICATION AS READ
// ================================================================

export const markNotificationAsRead = async (
    id,
    userId
) => {

    const query = `
        UPDATE notifications

        SET
            is_read = TRUE

        WHERE id = $1
          AND user_id = $2

        RETURNING *;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            id,
            userId
        ]
    );


    return rows[0] || null;

};


// ================================================================
// MARK ALL NOTIFICATIONS AS READ
// ================================================================

export const markAllNotificationsAsRead = async (
    userId
) => {

    const query = `
        UPDATE notifications

        SET
            is_read = TRUE

        WHERE user_id = $1
          AND is_read = FALSE

        RETURNING id;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [userId]
    );


    return rows;

};


// ================================================================
// GET OR CREATE NOTIFICATION PREFERENCES
// ================================================================
//
// Every user gets one preferences row.
//
// Existing users are automatically given the default values:
// TRUE for every notification type.
// ================================================================

export const getNotificationPreferences = async (
    userId
) => {

    const query = `
        INSERT INTO notification_preferences (
            user_id
        )

        VALUES (
            $1
        )

        ON CONFLICT (
            user_id
        )

        DO NOTHING

        RETURNING *;
    `;


    const {
        rows: insertedRows
    } = await pool.query(
        query,
        [userId]
    );


    if (
        insertedRows.length > 0
    ) {

        return insertedRows[0];

    }


    const selectQuery = `
        SELECT *

        FROM notification_preferences

        WHERE user_id = $1

        LIMIT 1;
    `;


    const {
        rows
    } = await pool.query(
        selectQuery,
        [userId]
    );


    return rows[0] || null;

};


// ================================================================
// UPDATE NOTIFICATION PREFERENCES
// ================================================================

export const updateNotificationPreferences = async (
    userId,
    preferences
) => {

    const query = `
        INSERT INTO notification_preferences (

            user_id,

            interest_request_notifications,

            proposal_notifications,

            accepted_proposal_notifications,

            rejected_proposal_notifications,

            counter_offer_notifications,

            message_notifications,

            jugaad_task_notifications,

            email_notifications,

            in_app_notifications

        )

        VALUES (

            $1,

            COALESCE(
                $2,
                TRUE
            ),

            COALESCE(
                $3,
                TRUE
            ),

            COALESCE(
                $4,
                TRUE
            ),

            COALESCE(
                $5,
                TRUE
            ),

            COALESCE(
                $6,
                TRUE
            ),

            COALESCE(
                $7,
                TRUE
            ),

            COALESCE(
                $8,
                TRUE
            ),

            COALESCE(
                $9,
                TRUE
            ),

            COALESCE(
                $10,
                TRUE
            )

        )

        ON CONFLICT (
            user_id
        )

        DO UPDATE SET

            interest_request_notifications =
                EXCLUDED.interest_request_notifications,

            proposal_notifications =
                EXCLUDED.proposal_notifications,

            accepted_proposal_notifications =
                EXCLUDED.accepted_proposal_notifications,

            rejected_proposal_notifications =
                EXCLUDED.rejected_proposal_notifications,

            counter_offer_notifications =
                EXCLUDED.counter_offer_notifications,

            message_notifications =
                EXCLUDED.message_notifications,

            jugaad_task_notifications =
                EXCLUDED.jugaad_task_notifications,

            email_notifications =
                EXCLUDED.email_notifications,

            in_app_notifications =
                EXCLUDED.in_app_notifications,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING *;
    `;


    const values = [

        userId,

        preferences
            ?.interestRequestNotifications,

        preferences
            ?.proposalNotifications,

        preferences
            ?.acceptedProposalNotifications,

        preferences
            ?.rejectedProposalNotifications,

        preferences
            ?.counterOfferNotifications,

        preferences
            ?.messageNotifications,

        preferences
            ?.jugaadTaskNotifications,

        preferences
            ?.emailNotifications,

        preferences
            ?.inAppNotifications

    ];


    const {
        rows
    } = await pool.query(
        query,
        values
    );


    return rows[0];

};


// ================================================================
// GET SINGLE NOTIFICATION PREFERENCE
// ================================================================
//
// Returns true/false for one notification type.
//
// Used by notification creation code so we can check whether
// a particular notification is enabled.
// ================================================================

export const isNotificationTypeEnabled = async (
    userId,
    preferenceColumn
) => {

    const allowedColumns = new Set([

        'interest_request_notifications',

        'proposal_notifications',

        'accepted_proposal_notifications',

        'rejected_proposal_notifications',

        'counter_offer_notifications',

        'message_notifications',

        'jugaad_task_notifications',

        'email_notifications',

        'in_app_notifications'

    ]);


    if (
        !allowedColumns.has(
            preferenceColumn
        )
    ) {

        throw new Error(
            'Invalid notification preference column.'
        );

    }


    const query = `
        SELECT
            ${preferenceColumn}

        FROM notification_preferences

        WHERE user_id = $1

        LIMIT 1;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [userId]
    );


    /*
     * User has no preferences row yet.
     *
     * Defaults are TRUE.
     */

    if (
        rows.length === 0
    ) {

        return true;

    }


    return Boolean(
        rows[0][
            preferenceColumn
        ]
    );

};