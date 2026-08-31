import pool from '../config/db.js';

/**
 * ============================================================
 * JUGAAD REPOSITORY
 * ============================================================
 */


/**
 * ============================================================
 * CREATE JUGAAD
 * ============================================================
 */

export const createJugaad = async ({
    posterId,
    collegeId,
    title,
    description,
    category,
    requiredSkills,
    budget,
    deadline,
    priority,
    attachmentUrl
}) => {

    const query = `
        INSERT INTO jugaads (
            poster_id,
            college_id,
            title,
            description,
            category,
            required_skills,
            budget,
            deadline,
            priority,
            attachment_url
        )

        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
        )

        RETURNING *;
    `;

    const values = [
        posterId,
        collegeId,
        title,
        description,
        category,
        requiredSkills || [],
        budget,
        deadline,
        priority || 'medium',
        attachmentUrl || null
    ];

    const {
        rows
    } = await pool.query(
        query,
        values
    );

    return rows[0];
};


/**
 * ============================================================
 * GET JUGAAD BY ID
 * ============================================================
 */

export const findJugaadById = async (
    id
) => {

    const query = `
        SELECT
            j.*,

            poster.name AS poster_name,
            poster.email AS poster_email,

            helper.name AS helper_name,
            helper.email AS helper_email,
            helper.number AS helper_number,
            helper.location AS helper_location,

            c.name AS college_name

        FROM jugaads j

        LEFT JOIN users poster
            ON poster.id = j.poster_id

        LEFT JOIN users helper
            ON helper.id = j.helper_id

        LEFT JOIN college c
            ON c.id = j.college_id

        WHERE j.id = $1

        LIMIT 1;
    `;

    const {
        rows
    } = await pool.query(
        query,
        [id]
    );

    return rows[0] || null;
};


/**
 * ============================================================
 * UPDATE JUGAAD
 * ============================================================
 */

export const updateJugaad = async (
    id,
    posterId,
    {
        title,
        description,
        category,
        requiredSkills,
        budget,
        deadline,
        priority,
        attachmentUrl
    }
) => {

    const fields = [];
    const values = [];

    let index = 1;


    if (
        title !== undefined
    ) {

        fields.push(
            `title = $${index++}`
        );

        values.push(
            title
        );
    }


    if (
        description !== undefined
    ) {

        fields.push(
            `description = $${index++}`
        );

        values.push(
            description
        );
    }


    if (
        category !== undefined
    ) {

        fields.push(
            `category = $${index++}`
        );

        values.push(
            category
        );
    }


    if (
        requiredSkills !== undefined
    ) {

        fields.push(
            `required_skills = $${index++}`
        );

        values.push(
            requiredSkills
        );
    }


    if (
        budget !== undefined
    ) {

        fields.push(
            `budget = $${index++}`
        );

        values.push(
            budget
        );
    }


    if (
        deadline !== undefined
    ) {

        fields.push(
            `deadline = $${index++}`
        );

        values.push(
            deadline
        );
    }


    if (
        priority !== undefined
    ) {

        fields.push(
            `priority = $${index++}`
        );

        values.push(
            priority
        );
    }


    if (
        attachmentUrl !== undefined
    ) {

        fields.push(
            `attachment_url = $${index++}`
        );

        values.push(
            attachmentUrl
        );
    }


    fields.push(
        `updated_at = CURRENT_TIMESTAMP`
    );


    values.push(
        id
    );

    values.push(
        posterId
    );


    const query = `
        UPDATE jugaads

        SET
            ${fields.join(', ')}

        WHERE id = $${index++}
          AND poster_id = $${index++}

        RETURNING *;
    `;


    const {
        rows
    } = await pool.query(
        query,
        values
    );


    return rows[0] || null;
};


/**
 * ============================================================
 * CANCEL / DELETE JUGAAD
 * ============================================================
 */

export const cancelOrDeleteJugaad = async (
    id,
    posterId
) => {

    const query = `
        UPDATE jugaads

        SET
            status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $1
          AND poster_id = $2

        RETURNING *;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            id,
            posterId
        ]
    );


    return rows[0] || null;
};


/**
 * ============================================================
 * GET MY JUGAADS
 * ============================================================
 *
 * Returns assigned student's details as well.
 */

export const findMyJugaads = async (
    posterId,
    status = null
) => {

    let query = `
        SELECT
            j.*,

            c.name AS college_name,

            helper.name AS helper_name,
            helper.email AS helper_email,
            helper.number AS helper_number,
            helper.location AS helper_location,

            COUNT(
                DISTINCT p.id
            )::INTEGER AS proposal_count

        FROM jugaads j

        LEFT JOIN college c
            ON c.id = j.college_id

        LEFT JOIN users helper
            ON helper.id = j.helper_id

        LEFT JOIN jugaad_proposals p
            ON p.jugaad_id = j.id
            AND p.status != 'withdrawn'

        WHERE j.poster_id = $1
    `;


    const values = [
        posterId
    ];


    if (
        status
    ) {

        values.push(
            status
        );


        query += `
            AND j.status = $${values.length}
        `;
    }


    query += `
        GROUP BY
            j.id,
            c.name,
            helper.id,
            helper.name,
            helper.email,
            helper.number,
            helper.location

        ORDER BY
            j.created_at DESC;
    `;


    const {
        rows
    } = await pool.query(
        query,
        values
    );


    return rows;
};


/**
 * ============================================================
 * DISCOVERY FEED
 * ============================================================
 */

export const findDiscoverableJugaads = async ({
    currentUserId,
    userCollegeId,
    collegeId,
    category,
    skills,
    search,
    minBudget,
    maxBudget,
    limit,
    offset
}) => {

    const conditions = [
        `j.status = 'open'`,

        `j.poster_id <> $1`,

        `
        NOT EXISTS (
            SELECT 1

            FROM jugaad_not_interested ni

            WHERE ni.user_id = $1
              AND ni.jugaad_id = j.id
        )
        `
    ];


    const values = [
        currentUserId
    ];


    let index = 2;


    if (
        collegeId
    ) {

        conditions.push(
            `j.college_id = $${index++}`
        );

        values.push(
            collegeId
        );

    } else if (
        userCollegeId
    ) {

        conditions.push(
            `j.college_id = $${index++}`
        );

        values.push(
            userCollegeId
        );
    }


    if (
        category
    ) {

        conditions.push(
            `LOWER(j.category) = LOWER($${index++})`
        );

        values.push(
            category
        );
    }


    if (
        skills &&
        skills.length > 0
    ) {

        conditions.push(
            `j.required_skills && $${index++}::TEXT[]`
        );

        values.push(
            skills
        );
    }


    if (
        search
    ) {

        conditions.push(
            `
            (
                j.title ILIKE $${index}
                OR j.description ILIKE $${index}
                OR j.category ILIKE $${index}
            )
            `
        );

        values.push(
            `%${search}%`
        );

        index++;
    }


    if (
        minBudget !== null &&
        minBudget !== undefined
    ) {

        conditions.push(
            `j.budget >= $${index++}`
        );

        values.push(
            minBudget
        );
    }


    if (
        maxBudget !== null &&
        maxBudget !== undefined
    ) {

        conditions.push(
            `j.budget <= $${index++}`
        );

        values.push(
            maxBudget
        );
    }


    const limitIndex =
        index++;


    const offsetIndex =
        index++;


    values.push(
        limit
    );


    values.push(
        offset
    );


    const query = `
        SELECT
            j.*,

            poster.name AS poster_name,
            poster.email AS poster_email,

            c.name AS college_name

        FROM jugaads j

        LEFT JOIN users poster
            ON poster.id = j.poster_id

        LEFT JOIN college c
            ON c.id = j.college_id

        WHERE ${conditions.join(
            ' AND '
        )}

        ORDER BY

            CASE

                WHEN j.priority = 'urgent'
                    THEN 1

                WHEN j.priority = 'high'
                    THEN 2

                WHEN j.priority = 'medium'
                    THEN 3

                ELSE 4

            END,

            j.created_at DESC

        LIMIT $${limitIndex}

        OFFSET $${offsetIndex};
    `;


    const {
        rows
    } = await pool.query(
        query,
        values
    );


    return rows;
};


/**
 * ============================================================
 * MARK NOT INTERESTED
 * ============================================================
 */

export const markNotInterested = async (
    userId,
    jugaadId
) => {

    const query = `
        INSERT INTO jugaad_not_interested (
            user_id,
            jugaad_id
        )

        VALUES (
            $1,
            $2
        )

        ON CONFLICT (
            user_id,
            jugaad_id
        )

        DO NOTHING

        RETURNING *;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            userId,
            jugaadId
        ]
    );


    return rows[0] || null;
};


/**
 * ============================================================
 * CREATE INTEREST / PROPOSAL
 * ============================================================
 *
 * IMPORTANT:
 *
 * This function ONLY creates a proposal.
 *
 * It DOES NOT:
 *
 * - create a conversation
 * - create conversation participants
 * - create a message
 *
 * The conversation is created ONLY after
 * the poster accepts the proposal.
 */

export const createInterestProposal = async (
    userId,
    jugaadId,
    message,
    proposedPrice
) => {

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
            NULL,
            'pending'
        )

        ON CONFLICT (
            jugaad_id,
            helper_id
        )

        DO UPDATE SET

            proposal_message =
                EXCLUDED.proposal_message,

            proposed_price =
                EXCLUDED.proposed_price,

            status =
                'pending',

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING *;
    `;


    const values = [
        jugaadId,
        userId,
        message,
        proposedPrice
    ];


    const {
        rows
    } = await pool.query(
        query,
        values
    );


    return rows[0] || null;
};


/**
 * ============================================================
 * GET PROPOSALS FOR A JUGAAD
 * ============================================================
 *
 * Used by My Jugaads.
 *
 * IMPORTANT FIX:
 *
 * The accepted proposal's conversation is linked using:
 *
 *     conversation.proposal_id
 *     conversation.jugaad_id
 *
 * Therefore the frontend receives the REAL
 * conversation_id and can show MESSAGE.
 */

export const findProposalsForJugaad = async (
    jugaadId,
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

            /*
             * REAL STUDENT / HELPER
             */
            u.name AS helper_name,
            u.email AS helper_email,
            u.number AS helper_number,
            u.location AS helper_location,

            /*
             * COLLEGE
             */
            college.name AS helper_college_name,

            /*
             * ====================================================
             * REAL CONVERSATION ID
             * ====================================================
             *
             * Only an accepted proposal should have a conversation.
             *
             * Match the exact proposal + exact Jugaad.
             *
             * The fallback handles older conversation rows that
             * may not have proposal_id populated.
             */
            conversation.id AS conversation_id

        FROM jugaad_proposals p

        INNER JOIN jugaads j
            ON j.id = p.jugaad_id

        INNER JOIN users u
            ON u.id = p.helper_id

        LEFT JOIN college
            ON college.id = u.college_id

        LEFT JOIN LATERAL (

            SELECT
                conv.id,
                conv.proposal_id,
                conv.jugaad_id

            FROM conversations conv

            WHERE

                /*
                 * PRIMARY MATCH:
                 * exact accepted proposal
                 */
                (
                    conv.proposal_id = p.id
                    AND conv.jugaad_id = p.jugaad_id
                )

                OR

                /*
                 * FALLBACK:
                 * older conversation without proposal_id
                 */
                (
                    conv.proposal_id IS NULL

                    AND conv.jugaad_id = p.jugaad_id

                    AND conv.user_one_id =
                        LEAST(
                            j.poster_id,
                            p.helper_id
                        )

                    AND conv.user_two_id =
                        GREATEST(
                            j.poster_id,
                            p.helper_id
                        )
                )

            ORDER BY

                /*
                 * Always prefer exact proposal match.
                 */
                CASE
                    WHEN conv.proposal_id = p.id
                        THEN 0

                    ELSE 1
                END,

                conv.id DESC

            LIMIT 1

        ) conversation
            ON TRUE

        WHERE
            p.jugaad_id = $1

            AND j.poster_id = $2

        ORDER BY
            p.created_at DESC;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            Number(jugaadId),
            Number(posterId)
        ]
    );


    return rows;
};


/**
 * ============================================================
 * GET PROPOSAL COUNT FOR A JUGAAD
 * ============================================================
 */

export const countProposalsForJugaad = async (
    jugaadId
) => {

    const query = `
        SELECT
            COUNT(*)::INTEGER AS count

        FROM jugaad_proposals

        WHERE jugaad_id = $1;
    `;


    const {
        rows
    } = await pool.query(
        query,
        [
            jugaadId
        ]
    );


    return rows[0]?.count || 0;
};