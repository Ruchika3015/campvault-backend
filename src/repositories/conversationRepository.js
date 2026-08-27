import pool from '../config/db.js';


/* ================================================================
   GET ALL CONVERSATIONS FOR A USER

   IMPORTANT:
   One conversation = one pair of users.

   We no longer identify a conversation by Jugaad.
   A conversation can contain messages from multiple Jugaads.
================================================================ */

export const findConversationsByUserId = async (
    userId
) => {
    const query = `
        SELECT
            c.id,
            c.user_one_id,
            c.user_two_id,
            c.created_at,

            /* ------------------------------------------------------
               The other person in the conversation
            ------------------------------------------------------ */

            CASE
                WHEN c.user_one_id = $1
                    THEN other_user_two.id
                ELSE other_user_one.id
            END AS other_user_id,

            CASE
                WHEN c.user_one_id = $1
                    THEN other_user_two.name
                ELSE other_user_one.name
            END AS other_user_name,

            CASE
                WHEN c.user_one_id = $1
                    THEN other_user_two.email
                ELSE other_user_one.email
            END AS other_user_email,

            /* ------------------------------------------------------
               Latest message
            ------------------------------------------------------ */

            last_msg.content AS last_message,

            last_msg.created_at AS last_message_time,

            last_msg.sender_id AS last_message_sender_id,

            last_msg.jugaad_id AS last_message_jugaad_id,

            /* ------------------------------------------------------
               Latest Jugaad associated with the conversation
            ------------------------------------------------------ */

            latest_jugaad.title AS jugaad_title,

            latest_jugaad.status AS jugaad_status,

            latest_jugaad.id AS jugaad_id,

            latest_jugaad.budget AS jugaad_budget

        FROM conversations c


        /* ----------------------------------------------------------
           User ONE
        ---------------------------------------------------------- */

        JOIN users user_one
            ON user_one.id = c.user_one_id


        /* ----------------------------------------------------------
           User TWO
        ---------------------------------------------------------- */

        JOIN users user_two
            ON user_two.id = c.user_two_id


        /* ----------------------------------------------------------
           Aliases used to select the other participant
        ---------------------------------------------------------- */

        JOIN users other_user_one
            ON other_user_one.id = c.user_one_id

        JOIN users other_user_two
            ON other_user_two.id = c.user_two_id


        /* ----------------------------------------------------------
           Get latest message in this conversation
        ---------------------------------------------------------- */

        LEFT JOIN LATERAL (
            SELECT
                m.content,
                m.created_at,
                m.sender_id,
                m.jugaad_id

            FROM messages m

            WHERE m.conversation_id = c.id

            ORDER BY
                m.created_at DESC,
                m.id DESC

            LIMIT 1
        ) last_msg ON TRUE


        /* ----------------------------------------------------------
           Get the Jugaad belonging to the latest message

           This allows one conversation to contain multiple Jugaads
           while the list still shows the most recently active Jugaad.
        ---------------------------------------------------------- */

        LEFT JOIN jugaads latest_jugaad
            ON latest_jugaad.id =
               COALESCE(
                   last_msg.jugaad_id,
                   c.jugaad_id
               )


        /* ----------------------------------------------------------
           IMPORTANT:

           User can be either side of the conversation.
        ---------------------------------------------------------- */

        WHERE
            c.user_one_id = $1
            OR
            c.user_two_id = $1


        /* ----------------------------------------------------------
           Newest conversation activity first
        ---------------------------------------------------------- */

        ORDER BY
            COALESCE(
                last_msg.created_at,
                c.created_at
            ) DESC,

            c.id DESC;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [userId]
    );


    return rows;
};


/* ================================================================
   GET ONE CONVERSATION
================================================================ */

export const findConversationById = async (
    conversationId
) => {
    const query = `
        SELECT
            c.id,

            c.user_one_id,
            c.user_two_id,

            c.jugaad_id,
            c.proposal_id,

            c.created_at,

            /* ------------------------------------------------------
               User one
            ------------------------------------------------------ */

            user_one.name AS user_one_name,
            user_one.email AS user_one_email,

            /* ------------------------------------------------------
               User two
            ------------------------------------------------------ */

            user_two.name AS user_two_name,
            user_two.email AS user_two_email,

            /* ------------------------------------------------------
               Latest/current Jugaad
            ------------------------------------------------------ */

            j.title AS jugaad_title,
            j.status AS jugaad_status,
            j.poster_id,
            j.helper_id

        FROM conversations c

        JOIN users user_one
            ON user_one.id = c.user_one_id

        JOIN users user_two
            ON user_two.id = c.user_two_id

        LEFT JOIN jugaads j
            ON j.id = c.jugaad_id

        WHERE c.id = $1

        LIMIT 1;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [conversationId]
    );


    return rows[0] || null;
};


/* ================================================================
   CHECK PARTICIPANT
================================================================ */

export const isParticipant = async (
    conversationId,
    userId
) => {
    const query = `
        SELECT 1

        FROM conversations c

        WHERE c.id = $1

          AND (
                c.user_one_id = $2
                OR
                c.user_two_id = $2
          )

        LIMIT 1;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            conversationId,
            userId
        ]
    );


    return rows.length > 0;
};


/* ================================================================
   FIND OTHER PARTICIPANT
================================================================ */

export const findOtherParticipant = async (
    conversationId,
    currentUserId
) => {
    const query = `
        SELECT

            CASE
                WHEN c.user_one_id = $2
                    THEN c.user_two_id

                WHEN c.user_two_id = $2
                    THEN c.user_one_id

                ELSE NULL
            END AS other_user_id

        FROM conversations c

        WHERE c.id = $1

        LIMIT 1;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            conversationId,
            currentUserId
        ]
    );


    return rows[0]?.other_user_id || null;
};


/* ================================================================
   CREATE MESSAGE
================================================================ */

export const createMessage = async ({
    conversationId,
    senderId,
    content,
    jugaadId = null,
    client = null
}) => {
    const db =
        client || pool;


    /* --------------------------------------------------------------
       If the caller does not provide a Jugaad ID, use the current
       Jugaad stored on the conversation.

       This keeps the existing frontend/service code working while
       still preserving Jugaad context for every message.
    -------------------------------------------------------------- */

    const query = `
        INSERT INTO messages (
            conversation_id,
            sender_id,
            jugaad_id,
            content
        )

        VALUES (
            $1,
            $2,

            COALESCE(
                $3,
                (
                    SELECT c.jugaad_id
                    FROM conversations c
                    WHERE c.id = $1
                )
            ),

            $4
        )

        RETURNING *;
    `;


    const {
        rows
    } = await db.query(
        query,
        [
            conversationId,
            senderId,
            jugaadId,
            content
        ]
    );


    return rows[0];
};


/* ================================================================
   GET MESSAGES FOR A CONVERSATION
================================================================ */

export const findMessagesByConversationId = async (
    conversationId,
    limit = 100,
    offset = 0
) => {
    const query = `
        SELECT
            m.id,
            m.conversation_id,
            m.sender_id,
            m.jugaad_id,
            m.content,
            m.created_at,
            m.read_at,

            u.name AS sender_name,

            /* ------------------------------------------------------
               Jugaad context for this particular message
            ------------------------------------------------------ */

            j.title AS jugaad_title,
            j.status AS jugaad_status,
            j.budget AS jugaad_budget

        FROM messages m

        JOIN users u
            ON u.id = m.sender_id

        LEFT JOIN jugaads j
            ON j.id = m.jugaad_id

        WHERE m.conversation_id = $1

        ORDER BY
            m.created_at ASC,
            m.id ASC

        LIMIT $2
        OFFSET $3;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            conversationId,
            limit,
            offset
        ]
    );


    return rows;
};


/* ================================================================
   MARK MESSAGES AS READ
================================================================ */

export const markMessagesAsRead = async (
    conversationId,
    userId
) => {
    const query = `
        UPDATE messages

        SET
            read_at =
                CURRENT_TIMESTAMP

        WHERE conversation_id = $1

          AND sender_id != $2

          AND read_at IS NULL

        RETURNING id;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            conversationId,
            userId
        ]
    );


    return {
        markedCount:
            rows.length,

        messageIds:
            rows.map(
                (row) =>
                    row.id
            )
    };
};