import pool from '../config/db.js';
import * as notificationRepository from './notificationRepository.js';


// ================================================================
// CREATE PROPOSAL
// ================================================================
//
// IMPORTANT:
//
// Student clicks INTERESTED / SEND PROPOSAL
//          ↓
// Proposal is created
//          ↓
// NO conversation
// NO message
//
// Conversation is created/reused ONLY after poster accepts.
// ================================================================

export const createProposal = async ({
    jugaadId,
    helperId,
    proposalMessage,
    proposedPrice,
    estimatedCompletion = null
}) => {

    const query = `
        INSERT INTO jugaad_proposals (
            jugaad_id,
            helper_id,
            proposal_message,
            proposed_price,
            estimated_completion,
            status
        )

        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            'pending'
        )

        RETURNING *;
    `;

    const values = [
        Number(jugaadId),
        Number(helperId),
        proposalMessage,
        Number(proposedPrice),
        estimatedCompletion
    ];

    const {
        rows
    } = await pool.query(
        query,
        values
    );

    return rows[0] || null;
};


// ================================================================
// FIND PROPOSAL BY ID
// ================================================================

export const findProposalById = async (
    id
) => {

    const query = `
        SELECT
            p.*,

            j.title AS jugaad_title,
            j.poster_id,
            j.budget AS original_budget,
            j.status AS jugaad_status,

            helper.name AS helper_name,
            helper.email AS helper_email,
            helper.number AS helper_number,
            helper.location AS helper_location,

            poster.name AS poster_name,
            poster.email AS poster_email,

            c.id AS conversation_id

        FROM jugaad_proposals p

        JOIN jugaads j
            ON j.id = p.jugaad_id

        JOIN users helper
            ON helper.id = p.helper_id

        JOIN users poster
            ON poster.id = j.poster_id

        /*
         * First look for the exact conversation belonging
         * to this exact proposal and Jugaad.
         *
         * Older conversations may not have proposal_id,
         * so a fallback is also allowed.
         */
        LEFT JOIN LATERAL (
            SELECT
                c.id,
                c.proposal_id,
                c.jugaad_id

            FROM conversations c

            WHERE
                (
                    c.proposal_id = p.id
                    AND c.jugaad_id = p.jugaad_id
                )

                OR

                (
                    c.proposal_id IS NULL
                    AND c.jugaad_id = p.jugaad_id
                    AND c.user_one_id =
                        LEAST(
                            j.poster_id,
                            p.helper_id
                        )
                    AND c.user_two_id =
                        GREATEST(
                            j.poster_id,
                            p.helper_id
                        )
                )

            ORDER BY
                CASE
                    WHEN c.proposal_id = p.id
                        THEN 0
                    ELSE 1
                END,

                c.id DESC

            LIMIT 1
        ) c ON TRUE

        WHERE p.id = $1

        LIMIT 1;
    `;

    const {
        rows
    } = await pool.query(
        query,
        [
            Number(id)
        ]
    );

    return rows[0] || null;
};


// ================================================================
// FIND PROPOSAL BY JUGAAD + HELPER
// ================================================================

export const findProposalByJugaadAndHelper = async (
    jugaadId,
    helperId
) => {

    const query = `
        SELECT *
        FROM jugaad_proposals

        WHERE jugaad_id = $1
          AND helper_id = $2

        LIMIT 1;
    `;

    const {
        rows
    } = await pool.query(
        query,
        [
            Number(jugaadId),
            Number(helperId)
        ]
    );

    return rows[0] || null;
};


// ================================================================
// FIND PROPOSALS FOR A JUGAAD
// ================================================================
//
// This is the important function for:
// My Jugaads → Open a Jugaad → Proposals Received
//
// It returns:
// - helper_name
// - proposal status
// - proposed price
// - conversation_id
// - latest counter offer
// ================================================================

export const findProposalsByJugaadId = async (
    jugaadId
) => {

    const query = `
        SELECT
            p.id,
            p.jugaad_id,
            p.helper_id,
            p.proposal_message,
            p.proposed_price,
            p.estimated_completion,
            p.status,
            p.created_at,
            p.updated_at,

            helper.name AS helper_name,
            helper.email AS helper_email,
            helper.number AS helper_number,
            helper.location AS helper_location,

            /*
             * Exact conversation for this proposal.
             */
            c.id AS conversation_id,

            co.amount AS latest_counter_amount,
            co.message AS latest_counter_message,
            co.offered_by AS latest_counter_offered_by,
            co.status AS latest_counter_status

        FROM jugaad_proposals p

        JOIN users helper
            ON helper.id = p.helper_id

        JOIN jugaads j
            ON j.id = p.jugaad_id

        /*
         * IMPORTANT:
         *
         * Match the exact proposal conversation first.
         *
         * If an older row has no proposal_id,
         * use the old user-pair conversation as fallback.
         */
        LEFT JOIN LATERAL (
            SELECT
                c.id,
                c.proposal_id,
                c.jugaad_id

            FROM conversations c

            WHERE
                (
                    c.proposal_id = p.id
                    AND c.jugaad_id = p.jugaad_id
                )

                OR

                (
                    c.proposal_id IS NULL
                    AND c.jugaad_id = p.jugaad_id
                    AND c.user_one_id =
                        LEAST(
                            j.poster_id,
                            p.helper_id
                        )
                    AND c.user_two_id =
                        GREATEST(
                            j.poster_id,
                            p.helper_id
                        )
                )

            ORDER BY
                CASE
                    WHEN c.proposal_id = p.id
                        THEN 0
                    ELSE 1
                END,

                c.id DESC

            LIMIT 1
        ) c ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                amount,
                message,
                offered_by,
                status

            FROM proposal_counter_offers

            WHERE proposal_id = p.id

            ORDER BY
                created_at DESC

            LIMIT 1
        ) co ON TRUE

        WHERE p.jugaad_id = $1

        ORDER BY
            p.created_at DESC;
    `;

    const {
        rows
    } = await pool.query(
        query,
        [
            Number(jugaadId)
        ]
    );

    return rows;
};


// ================================================================
// FIND MY PROPOSALS
// ================================================================
// These are proposals submitted by the current student.
// ================================================================

export const findMyProposals = async (
    helperId
) => {

    const query = `
        SELECT
            p.id,
            p.jugaad_id,
            p.helper_id,
            p.proposal_message,
            p.proposed_price,
            p.estimated_completion,
            p.status,
            p.created_at,
            p.updated_at,

            j.title AS jugaad_title,
            j.budget AS jugaad_budget,
            j.deadline AS jugaad_deadline,
            j.status AS jugaad_status,

            poster.name AS poster_name,

            c.id AS conversation_id,

            co.amount AS latest_counter_amount,
            co.message AS latest_counter_message,
            co.offered_by AS latest_counter_offered_by

        FROM jugaad_proposals p

        JOIN jugaads j
            ON j.id = p.jugaad_id

        JOIN users poster
            ON poster.id = j.poster_id

        LEFT JOIN LATERAL (
            SELECT
                c.id,
                c.proposal_id,
                c.jugaad_id

            FROM conversations c

            WHERE
                (
                    c.proposal_id = p.id
                    AND c.jugaad_id = p.jugaad_id
                )

                OR

                (
                    c.proposal_id IS NULL
                    AND c.jugaad_id = p.jugaad_id
                    AND c.user_one_id =
                        LEAST(
                            j.poster_id,
                            p.helper_id
                        )
                    AND c.user_two_id =
                        GREATEST(
                            j.poster_id,
                            p.helper_id
                        )
                )

            ORDER BY
                CASE
                    WHEN c.proposal_id = p.id
                        THEN 0
                    ELSE 1
                END,

                c.id DESC

            LIMIT 1
        ) c ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                amount,
                message,
                offered_by

            FROM proposal_counter_offers

            WHERE proposal_id = p.id

            ORDER BY
                created_at DESC

            LIMIT 1
        ) co ON TRUE

        WHERE p.helper_id = $1

        ORDER BY
            p.created_at DESC;
    `;

    const {
        rows
    } = await pool.query(
        query,
        [
            Number(helperId)
        ]
    );

    return rows;
};


// ================================================================
// FIND RECEIVED PROPOSALS
// ================================================================
//
// This is used for proposal lists received by the Jugaad owner.
// ================================================================

export const findReceivedProposals = async (
    posterId
) => {

    const query = `
        SELECT
            p.id,
            p.jugaad_id,
            p.helper_id,
            p.proposal_message,
            p.proposed_price,
            p.estimated_completion,
            p.status,
            p.created_at,
            p.updated_at,

            j.title AS jugaad_title,
            j.status AS jugaad_status,

            helper.name AS helper_name,
            helper.email AS helper_email,
            helper.number AS helper_number,
            helper.location AS helper_location,

            c.id AS conversation_id,

            co.amount AS latest_counter_amount,
            co.message AS latest_counter_message,
            co.offered_by AS latest_counter_offered_by

        FROM jugaad_proposals p

        JOIN jugaads j
            ON j.id = p.jugaad_id

        JOIN users helper
            ON helper.id = p.helper_id

        LEFT JOIN LATERAL (
            SELECT
                c.id,
                c.proposal_id,
                c.jugaad_id

            FROM conversations c

            WHERE
                (
                    c.proposal_id = p.id
                    AND c.jugaad_id = p.jugaad_id
                )

                OR

                (
                    c.proposal_id IS NULL
                    AND c.jugaad_id = p.jugaad_id
                    AND c.user_one_id =
                        LEAST(
                            j.poster_id,
                            p.helper_id
                        )
                    AND c.user_two_id =
                        GREATEST(
                            j.poster_id,
                            p.helper_id
                        )
                )

            ORDER BY
                CASE
                    WHEN c.proposal_id = p.id
                        THEN 0
                    ELSE 1
                END,

                c.id DESC

            LIMIT 1
        ) c ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                amount,
                message,
                offered_by

            FROM proposal_counter_offers

            WHERE proposal_id = p.id

            ORDER BY
                created_at DESC

            LIMIT 1
        ) co ON TRUE

        WHERE j.poster_id = $1

        ORDER BY
            p.created_at DESC;
    `;

    const {
        rows
    } = await pool.query(
        query,
        [
            Number(posterId)
        ]
    );

    return rows;
};


// ================================================================
// ACCEPT PROPOSAL TRANSACTION
// ================================================================
//
// This is the ONLY place where a conversation is created/reused.
//
// INTERESTED:
//     proposal only
//
// ACCEPT:
//     conversation created/reused
// ================================================================

export const acceptProposalTransaction = async (
    proposalId,
    posterId
) => {

    const client =
        await pool.connect();

    try {

        await client.query(
            'BEGIN'
        );


        // ============================================================
        // 1. GET PROPOSAL + JUGAAD
        // ============================================================

        const propQuery = `
            SELECT
                p.*,

                j.poster_id,
                j.status AS jugaad_status,
                j.title AS jugaad_title

            FROM jugaad_proposals p

            JOIN jugaads j
                ON j.id = p.jugaad_id

            WHERE p.id = $1

            FOR UPDATE;
        `;

        const {
            rows: propRows
        } = await client.query(
            propQuery,
            [
                Number(proposalId)
            ]
        );


        if (
            propRows.length === 0
        ) {

            const error =
                new Error(
                    'Proposal not found.'
                );

            error.statusCode = 404;

            throw error;
        }


        const proposal =
            propRows[0];


        // ============================================================
        // 2. VERIFY POSTER
        // ============================================================

        if (
            Number(
                proposal.poster_id
            ) !==
            Number(posterId)
        ) {

            const error =
                new Error(
                    'Unauthorized: Only the Jugaad owner can accept proposals.'
                );

            error.statusCode = 403;

            throw error;
        }


        // ============================================================
        // 3. PROPOSAL MUST BE PENDING
        // ============================================================

        if (
            proposal.status !==
            'pending'
        ) {

            const error =
                new Error(
                    `Cannot accept proposal with status '${proposal.status}'.`
                );

            error.statusCode = 400;

            throw error;
        }


        // ============================================================
        // 4. JUGAAD MUST BE OPEN
        // ============================================================

        if (
            proposal.jugaad_status !==
            'open'
        ) {

            const error =
                new Error(
                    `Cannot accept proposal on a Jugaad that is already '${proposal.jugaad_status}'.`
                );

            error.statusCode = 400;

            throw error;
        }


        // ============================================================
        // 5. ACCEPT PROPOSAL
        // ============================================================

        const updateProposalQuery = `
            UPDATE jugaad_proposals

            SET
                status = 'accepted',
                updated_at = CURRENT_TIMESTAMP

            WHERE id = $1

            RETURNING *;
        `;

        const {
            rows:
                acceptedProposalRows
        } = await client.query(
            updateProposalQuery,
            [
                Number(proposalId)
            ]
        );


        const acceptedProposal =
            acceptedProposalRows[0];


        // ============================================================
        // 6. ASSIGN HELPER TO JUGAAD
        // ============================================================

        const updateJugaadQuery = `
            UPDATE jugaads

            SET
                status = 'assigned',
                helper_id = $1,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = $2

            RETURNING *;
        `;

        const {
            rows:
                updatedJugaadRows
        } = await client.query(
            updateJugaadQuery,
            [
                Number(
                    proposal.helper_id
                ),

                Number(
                    proposal.jugaad_id
                )
            ]
        );


        const updatedJugaad =
            updatedJugaadRows[0];


        if (
            !updatedJugaad
        ) {

            const error =
                new Error(
                    'Unable to assign helper to the Jugaad.'
                );

            error.statusCode = 500;

            throw error;
        }


        // ============================================================
        // 7. REJECT OTHER PENDING PROPOSALS
        // ============================================================

        const rejectOthersQuery = `
            UPDATE jugaad_proposals

            SET
                status = 'rejected',
                updated_at = CURRENT_TIMESTAMP

            WHERE jugaad_id = $1
              AND id != $2
              AND status = 'pending'

            RETURNING
                id,
                helper_id;
        `;

        const {
            rows:
                rejectedHelpers
        } = await client.query(
            rejectOthersQuery,
            [
                Number(
                    proposal.jugaad_id
                ),

                Number(
                    proposalId
                )
            ]
        );


        // ============================================================
        // 8. NORMALIZE USER PAIR
        // ============================================================

        const firstUserId =
            Number(posterId);

        const secondUserId =
            Number(
                proposal.helper_id
            );


        if (
            !Number.isInteger(
                firstUserId
            ) ||
            !Number.isInteger(
                secondUserId
            )
        ) {

            const error =
                new Error(
                    'Invalid user ID while creating conversation.'
                );

            error.statusCode = 400;

            throw error;
        }


        const userOneId =
            Math.min(
                firstUserId,
                secondUserId
            );


        const userTwoId =
            Math.max(
                firstUserId,
                secondUserId
            );


        // ============================================================
        // 9. CREATE OR REUSE ONE CONVERSATION
        // ============================================================

        const createConversationQuery = `
            INSERT INTO conversations (
                user_one_id,
                user_two_id,
                jugaad_id,
                proposal_id
            )

            VALUES (
                $1,
                $2,
                $3,
                $4
            )

            ON CONFLICT (
                user_one_id,
                user_two_id
            )

            DO UPDATE SET
                jugaad_id =
                    EXCLUDED.jugaad_id,

                proposal_id =
                    EXCLUDED.proposal_id

            RETURNING *;
        `;


        const {
            rows:
                conversationRows
        } = await client.query(
            createConversationQuery,
            [
                userOneId,
                userTwoId,

                Number(
                    proposal.jugaad_id
                ),

                Number(
                    proposalId
                )
            ]
        );


        const conversation =
            conversationRows[0];


        if (
            !conversation
        ) {

            const error =
                new Error(
                    'Unable to create or reuse conversation.'
                );

            error.statusCode = 500;

            throw error;
        }


        // ============================================================
        // 10. ADD BOTH USERS AS PARTICIPANTS
        // ============================================================

        const addParticipantsQuery = `
            INSERT INTO conversation_participants (
                conversation_id,
                user_id
            )

            VALUES
                ($1, $2),
                ($1, $3)

            ON CONFLICT (
                conversation_id,
                user_id
            )

            DO NOTHING;
        `;


        await client.query(
            addParticipantsQuery,
            [
                Number(
                    conversation.id
                ),

                firstUserId,
                secondUserId
            ]
        );


        // ============================================================
        // 11. NOTIFY ACCEPTED HELPER
        // ============================================================

        const acceptedNotificationEnabled =
            await notificationRepository.isNotificationTypeEnabled(
                secondUserId,
                'accepted_proposal_notifications'
            );


        if (
            acceptedNotificationEnabled
        ) {

            await notificationRepository.createNotification({

                userId:
                    secondUserId,

                type:
                    'PROPOSAL_ACCEPTED',

                title:
                    'Proposal Accepted!',

                message:
                    `Congratulations! Your proposal for "${proposal.jugaad_title}" has been accepted. Conversation is now unlocked!`,

                referenceType:
                    'jugaad',

                referenceId:
                    Number(
                        proposal.jugaad_id
                    ),

                client

            });

        }


        // ============================================================
        // 12. NOTIFY REJECTED HELPERS
        // ============================================================

        for (
            const rejected
            of rejectedHelpers
        ) {

            const notifyRejectedQuery = `
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
                    'PROPOSAL_REJECTED',
                    'Proposal Update',
                    $2,
                    'jugaad',
                    $3
                );
            `;


            await client.query(
                notifyRejectedQuery,
                [
                    Number(
                        rejected.helper_id
                    ),

                    `Your proposal for "${proposal.jugaad_title}" was not selected as another proposal was accepted.`,

                    Number(
                        proposal.jugaad_id
                    )
                ]
            );
        }


        // ============================================================
        // 13. COMMIT
        // ============================================================

        await client.query(
            'COMMIT'
        );


        return {
            proposal:
                acceptedProposal,

            jugaad:
                updatedJugaad,

            conversation
        };

    } catch (error) {

        await client.query(
            'ROLLBACK'
        );

        throw error;

    } finally {

        client.release();
    }
};


// ================================================================
// REJECT PROPOSAL
// ================================================================

export const rejectProposal = async (
    proposalId,
    posterId
) => {

    const query = `
        UPDATE jugaad_proposals p

        SET
            status = 'rejected',
            updated_at = CURRENT_TIMESTAMP

        FROM jugaads j

        WHERE p.id = $1
          AND p.jugaad_id = j.id
          AND j.poster_id = $2
          AND p.status = 'pending'

        RETURNING
            p.*,
            j.title AS jugaad_title;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            Number(proposalId),
            Number(posterId)
        ]
    );


    return rows[0] || null;
};


// ================================================================
// WITHDRAW PROPOSAL
// ================================================================

export const withdrawProposal = async (
    proposalId,
    helperId
) => {

    const query = `
        UPDATE jugaad_proposals p

        SET
            status = 'withdrawn',
            updated_at = CURRENT_TIMESTAMP

        FROM jugaads j

        WHERE p.id = $1
          AND p.helper_id = $2
          AND p.status = 'pending'
          AND p.jugaad_id = j.id

        RETURNING
            p.*,
            j.poster_id,
            j.title AS jugaad_title;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            Number(proposalId),
            Number(helperId)
        ]
    );


    return rows[0] || null;
};


// ================================================================
// CREATE COUNTER OFFER
// ================================================================

export const createCounterOffer = async ({
    proposalId,
    offeredBy,
    amount,
    message = null
}) => {

    await pool.query(
        `
            UPDATE proposal_counter_offers

            SET
                status = 'countered'

            WHERE proposal_id = $1
              AND status = 'pending';
        `,
        [
            Number(proposalId)
        ]
    );


    const query = `
        INSERT INTO proposal_counter_offers (
            proposal_id,
            offered_by,
            amount,
            message,
            status
        )

        VALUES (
            $1,
            $2,
            $3,
            $4,
            'pending'
        )

        RETURNING *;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            Number(proposalId),
            Number(offeredBy),
            Number(amount),
            message
        ]
    );


    return rows[0] || null;
};


// ================================================================
// FIND COUNTER OFFERS
// ================================================================

export const findCounterOffersByProposalId = async (
    proposalId
) => {

    const query = `
        SELECT
            co.*,

            u.name AS offered_by_name

        FROM proposal_counter_offers co

        JOIN users u
            ON u.id = co.offered_by

        WHERE co.proposal_id = $1

        ORDER BY
            co.created_at ASC;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            Number(proposalId)
        ]
    );


    return rows;
};