import pool from '../config/db.js';

export const findConversationsByUserId = async (userId) => {
    const query = `
        SELECT 
            c.id,
            c.jugaad_id,
            c.proposal_id,
            c.created_at,
            j.title AS jugaad_title,
            j.status AS jugaad_status,
            other_u.id AS other_user_id,
            other_u.name AS other_user_name,
            other_u.email AS other_user_email,
            last_msg.content AS last_message,
            last_msg.created_at AS last_message_time,
            last_msg.sender_id AS last_message_sender_id
        FROM conversations c
        JOIN conversation_participants cp ON cp.conversation_id = c.id
        JOIN jugaads j ON j.id = c.jugaad_id
        -- Find the other participant in the conversation
        JOIN conversation_participants other_cp ON other_cp.conversation_id = c.id AND other_cp.user_id != $1
        JOIN users other_u ON other_u.id = other_cp.user_id
        -- Subquery for last message
        LEFT JOIN LATERAL (
            SELECT content, created_at, sender_id
            FROM messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
        ) last_msg ON TRUE
        WHERE cp.user_id = $1
        ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
};

export const findConversationById = async (conversationId) => {
    const query = `
        SELECT 
            c.id,
            c.jugaad_id,
            c.proposal_id,
            c.created_at,
            j.title AS jugaad_title,
            j.status AS jugaad_status,
            j.poster_id,
            j.helper_id
        FROM conversations c
        JOIN jugaads j ON j.id = c.jugaad_id
        WHERE c.id = $1;
    `;
    const { rows } = await pool.query(query, [conversationId]);
    return rows[0];
};

export const isParticipant = async (conversationId, userId) => {
    const query = `
        SELECT 1
        FROM conversation_participants
        WHERE conversation_id = $1 AND user_id = $2;
    `;
    const { rows } = await pool.query(query, [conversationId, userId]);
    return rows.length > 0;
};

export const findOtherParticipant = async (conversationId, currentUserId) => {
    const query = `
        SELECT user_id
        FROM conversation_participants
        WHERE conversation_id = $1 AND user_id != $2
        LIMIT 1;
    `;
    const { rows } = await pool.query(query, [conversationId, currentUserId]);
    return rows[0] ? rows[0].user_id : null;
};

export const createMessage = async ({ conversationId, senderId, content, client = null }) => {
    const db = client || pool;
    const query = `
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const { rows } = await db.query(query, [conversationId, senderId, content]);
    return rows[0];
};

export const findMessagesByConversationId = async (conversationId, limit = 100, offset = 0) => {
    const query = `
        SELECT 
            m.id,
            m.conversation_id,
            m.sender_id,
            m.content,
            m.created_at,
            u.name AS sender_name
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3;
    `;
    const { rows } = await pool.query(query, [conversationId, limit, offset]);
    return rows;
};
