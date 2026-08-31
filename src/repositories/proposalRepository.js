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

            /*
             * REAL STUDENT / HELPER INFORMATION
             */
            helper.name AS helper_name,
            helper.email AS helper_email,
            helper.number AS helper_number,
            helper.location AS helper_location,

            /*
             * IMPORTANT:
             *
             * The conversation belongs to the
             * specific proposal + specific Jugaad.
             *
             * Do NOT match only by user IDs.
             */
            c.id AS conversation_id,

            /*
             * Latest counter offer, if one exists.
             */
            co.amount AS latest_counter_amount,
            co.message AS latest_counter_message,
            co.offered_by AS latest_counter_offered_by,
            co.status AS latest_counter_status

        FROM jugaad_proposals p

        /*
         * Every proposal belongs to a helper.
         */
        JOIN users helper
            ON helper.id = p.helper_id

        /*
         * Every proposal belongs to a Jugaad.
         */
        JOIN jugaads j
            ON j.id = p.jugaad_id

        /*
         * IMPORTANT FIX
         *
         * Use proposal_id + jugaad_id to find
         * the exact conversation.
         *
         * This prevents:
         *
         * CONVERSATION UNAVAILABLE
         *
         * when an accepted proposal already has
         * its own conversation.
         */
        LEFT JOIN conversations c
            ON c.proposal_id = p.id
            AND c.jugaad_id = p.jugaad_id

        /*
         * Get the latest counter offer for this
         * particular proposal.
         */
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

        /*
         * Only proposals belonging to this Jugaad.
         */
        WHERE p.jugaad_id = $1

        /*
         * Newest proposals first.
         */
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