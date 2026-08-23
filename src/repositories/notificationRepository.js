import pool from '../config/db.js';

export const createNotification = async ({
    userId,
    type,
    title,
    message,
    referenceType = null,
    referenceId = null,
    client = null
}) => {
    const db = client || pool;
    const query = `
        INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [userId, type, title, message, referenceType, referenceId];
    const { rows } = await db.query(query, values);
    return rows[0];
};

export const findNotificationsByUserId = async (userId, limit = 50, offset = 0) => {
    const query = `
        SELECT *
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3;
    `;
    const countQuery = `
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE user_id = $1 AND is_read = FALSE;
    `;
    const [listResult, countResult] = await Promise.all([
        pool.query(query, [userId, limit, offset]),
        pool.query(countQuery, [userId])
    ]);

    return {
        notifications: listResult.rows,
        unread_count: parseInt(countResult.rows[0].unread_count, 10)
    };
};

export const markNotificationAsRead = async (id, userId) => {
    const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1 AND user_id = $2
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0];
};

export const markAllNotificationsAsRead = async (userId) => {
    const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1 AND is_read = FALSE
        RETURNING id;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
};
