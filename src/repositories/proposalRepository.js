import pool from '../config/db.js';


// ================================================================
// CREATE PROPOSAL
// ================================================================

export const createProposal = async ({
    jugaadId,
    helperId,
    proposalMessage,
    proposedPrice,
    estimatedCompletion = null
}) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ============================================================
        // 1. CREATE PROPOSAL
        // ============================================================

        const proposalQuery = `
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

        const proposalValues = [
            jugaadId,
            helperId,
            proposalMessage,
            proposedPrice,
            estimatedCompletion
        ];

        const {
            rows: proposalRows
        } = await client.query(
            proposalQuery,
            proposalValues
        );

        const proposal =
            proposalRows[0];

        // ============================================================
        // 2. GET THE POSTER OF THE JUGAAD
        // ============================================================

        const posterQuery = `
            SELECT
                poster_id
            FROM jugaads
            WHERE id = $1;
        `;

        const {
            rows: posterRows
        } = await client.query(
            posterQuery,
            [jugaadId]
        );

        if (
            posterRows.length === 0
        ) {
            const error =
                new Error(
                    'Jugaad not found.'
                );

            error.statusCode = 404;

            throw error;
        }

        const posterId =
            posterRows[0].poster_id;

        // ============================================================
        // 3. CREATE OR REUSE CONVERSATION
        // ============================================================
        //
        // ONE conversation per:
        //
        // poster_id + helper_id
        //
        // If Ruchika and Ishita already have a conversation,
        // every new Jugaad between them uses the SAME conversation.
        //

        const conversationQuery = `
            INSERT INTO conversations (
                poster_id,
                helper_id,
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
                poster_id,
                helper_id
            )
            DO UPDATE SET
                jugaad_id =
                    EXCLUDED.jugaad_id,

                proposal_id =
                    EXCLUDED.proposal_id

            RETURNING *;
        `;

        const {
            rows: conversationRows
        } = await client.query(
            conversationQuery,
            [
                posterId,
                helperId,
                jugaadId,
                proposal.id
            ]
        );

        const conversation =
            conversationRows[0];

        // ============================================================
        // 4. ADD POSTER + HELPER AS PARTICIPANTS
        // ============================================================

        const participantsQuery = `
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
            participantsQuery,
            [
                conversation.id,
                posterId,
                helperId
            ]
        );

        // ============================================================
        // 5. CREATE INITIAL PROPOSAL MESSAGE
        // ============================================================
        //
        // IMPORTANT:
        // Store jugaad_id on the message so one conversation can
        // contain messages belonging to many different Jugaads.
        //

        const messageQuery = `
            INSERT INTO messages (
                conversation_id,
                sender_id,
                jugaad_id,
                content
            )
            VALUES (
                $1,
                $2,
                $3,
                $4
            )
            RETURNING *;
        `;

        const {
            rows: messageRows
        } = await client.query(
            messageQuery,
            [
                conversation.id,
                helperId,
                jugaadId,
                proposalMessage
            ]
        );

        const message =
            messageRows[0];

        // ============================================================
        // 6. COMMIT
        // ============================================================

        await client.query(
            'COMMIT'
        );

        return {
            ...proposal,
            conversation_id:
                conversation.id,
            message_id:
                message.id
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

        LEFT JOIN conversations c
            ON c.poster_id = j.poster_id
            AND c.helper_id = p.helper_id

        WHERE p.id = $1;
    `;

    const {
        rows
    } = await pool.query(
        query,
        [id]
    );

    return rows[0];
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
          AND helper_id = $2;
    `;

    const {
        rows
    } = await pool.query(
        query,
        [
            jugaadId,
            helperId
        ]
    );

    return rows[0];
};


// ================================================================
// FIND PROPOSALS FOR A JUGAAD
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

        LEFT JOIN conversations c
            ON c.poster_id = j.poster_id
            AND c.helper_id = p.helper_id

        LEFT JOIN LATERAL (
            SELECT
                amount,
                message,
                offered_by,
                status
            FROM proposal_counter_offers
            WHERE proposal_id = p.id
            ORDER BY created_at DESC
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
        [jugaadId]
    );

    return rows;
};


// ================================================================
// FIND MY PROPOSALS
// ================================================================

export const findMyProposals = async (
    helperId
) => {

    const query = `
        SELECT
            p.id,
            p.jugaad_id,
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

        LEFT JOIN conversations c
            ON c.poster_id = j.poster_id
            AND c.helper_id = p.helper_id

        LEFT JOIN LATERAL (
            SELECT
                amount,
                message,
                offered_by
            FROM proposal_counter_offers
            WHERE proposal_id = p.id
            ORDER BY created_at DESC
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
        [helperId]
    );

    return rows;
};


// ================================================================
// FIND RECEIVED PROPOSALS
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

        LEFT JOIN conversations c
            ON c.poster_id = j.poster_id
            AND c.helper_id = p.helper_id

        LEFT JOIN LATERAL (
            SELECT
                amount,
                message,
                offered_by
            FROM proposal_counter_offers
            WHERE proposal_id = p.id
            ORDER BY created_at DESC
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
        [posterId]
    );

    return rows;
};


// ================================================================
// ACCEPT PROPOSAL TRANSACTION
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
            [proposalId]
        );

        if (
            propRows.length === 0
        ) {

            const err =
                new Error(
                    'Proposal not found.'
                );

            err.statusCode = 404;

            throw err;
        }

        const proposal =
            propRows[0];


        // ============================================================
        // 2. AUTHORIZATION
        // ============================================================

        if (
            proposal.poster_id.toString() !==
            posterId.toString()
        ) {

            const err =
                new Error(
                    'Unauthorized: Only the Jugaad owner can accept proposals.'
                );

            err.statusCode = 403;

            throw err;
        }


        // ============================================================
        // 3. CHECK PROPOSAL STATUS
        // ============================================================

        if (
            proposal.status !==
            'pending'
        ) {

            const err =
                new Error(
                    `Cannot accept proposal with status '${proposal.status}'.`
                );

            err.statusCode = 400;

            throw err;
        }


        // ============================================================
        // 4. CHECK JUGAAD STATUS
        // ============================================================

        if (
            proposal.jugaad_status !==
            'open'
        ) {

            const err =
                new Error(
                    `Cannot accept proposal on a Jugaad that is already '${proposal.jugaad_status}'.`
                );

            err.statusCode = 400;

            throw err;
        }


        // ============================================================
        // 5. ACCEPT PROPOSAL
        // ============================================================

        const updatePropQuery = `
            UPDATE jugaad_proposals

            SET
                status =
                    'accepted',

                updated_at =
                    CURRENT_TIMESTAMP

            WHERE id = $1

            RETURNING *;
        `;

        const {
            rows:
                updatedPropRows
        } = await client.query(
            updatePropQuery,
            [proposalId]
        );

        const acceptedProposal =
            updatedPropRows[0];


        // ============================================================
        // 6. ASSIGN HELPER TO JUGAAD
        // ============================================================

        const updateJugaadQuery = `
            UPDATE jugaads

            SET
                status =
                    'assigned',

                helper_id =
                    $1,

                updated_at =
                    CURRENT_TIMESTAMP

            WHERE id = $2

            RETURNING *;
        `;

        const {
            rows:
                updatedJugaadRows
        } = await client.query(
            updateJugaadQuery,
            [
                proposal.helper_id,
                proposal.jugaad_id
            ]
        );

        const updatedJugaad =
            updatedJugaadRows[0];


        // ============================================================
        // 7. REJECT OTHER PENDING PROPOSALS
        // ============================================================

        const rejectOthersQuery = `
            UPDATE jugaad_proposals

            SET
                status =
                    'rejected',

                updated_at =
                    CURRENT_TIMESTAMP

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
                proposal.jugaad_id,
                proposalId
            ]
        );


        // ============================================================
        // 8. CREATE OR REUSE ONE CONVERSATION
        // ============================================================
        //
        // IMPORTANT:
        //
        // We use:
        //
        // poster_id + helper_id
        //
        // NOT:
        //
        // jugaad_id + proposal_id
        //

        const createConvQuery = `
            INSERT INTO conversations (
                poster_id,
                helper_id,
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
                poster_id,
                helper_id
            )

            DO UPDATE SET
                jugaad_id =
                    EXCLUDED.jugaad_id,

                proposal_id =
                    EXCLUDED.proposal_id

            RETURNING *;
        `;

        const {
            rows: convRows
        } = await client.query(
            createConvQuery,
            [
                posterId,
                proposal.helper_id,
                proposal.jugaad_id,
                proposalId
            ]
        );

        const conversation =
            convRows[0];


        // ============================================================
        // 9. ADD PARTICIPANTS
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
                conversation.id,
                posterId,
                proposal.helper_id
            ]
        );


        // ============================================================
        // 10. NOTIFY ACCEPTED HELPER
        // ============================================================

        const notifyAcceptedQuery = `
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
                'PROPOSAL_ACCEPTED',
                'Proposal Accepted!',
                $2,
                'jugaad',
                $3
            );
        `;

        await client.query(
            notifyAcceptedQuery,
            [
                proposal.helper_id,

                `Congratulations! Your proposal for "${proposal.jugaad_title}" has been accepted. Conversation is now unlocked!`,

                proposal.jugaad_id
            ]
        );


        // ============================================================
        // 11. NOTIFY REJECTED HELPERS
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
                    rejected.helper_id,

                    `Your proposal for "${proposal.jugaad_title}" was not selected as another proposal was accepted.`,

                    proposal.jugaad_id
                ]
            );
        }


        // ============================================================
        // 12. COMMIT
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
            status =
                'rejected',

            updated_at =
                CURRENT_TIMESTAMP

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
            proposalId,
            posterId
        ]
    );

    return rows[0];
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
            status =
                'withdrawn',

            updated_at =
                CURRENT_TIMESTAMP

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
            proposalId,
            helperId
        ]
    );

    return rows[0];
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

    // ============================================================
    // Mark previous pending offers as countered
    // ============================================================

    await pool.query(
        `
            UPDATE proposal_counter_offers

            SET
                status =
                    'countered'

            WHERE proposal_id = $1
              AND status = 'pending'
        `,
        [proposalId]
    );


    // ============================================================
    // Create new counter offer
    // ============================================================

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
            proposalId,
            offeredBy,
            amount,
            message
        ]
    );

    return rows[0];
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
        [proposalId]
    );

    return rows;
};