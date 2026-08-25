import pool from '../config/db.js';

/**
 * ============================================================
 * JUGAAD REPOSITORY
 * ============================================================
 */

/**
 * Create a new Jugaad
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
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10
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

    const { rows } = await pool.query(query, values);

    return rows[0];
};


/**
 * ============================================================
 * GET JUGAAD BY ID
 * ============================================================
 */

export const findJugaadById = async (id) => {
    const query = `
        SELECT
            j.*,

            u.name AS poster_name,
            u.email AS poster_email,

            h.name AS helper_name,
            h.email AS helper_email,

            c.name AS college_name

        FROM jugaads j

        LEFT JOIN users u
            ON u.id = j.poster_id

        LEFT JOIN users h
            ON h.id = j.helper_id

        LEFT JOIN college c
            ON c.id = j.college_id

        WHERE j.id = $1
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [id]);

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

    if (title !== undefined) {
        fields.push(`title = $${index++}`);
        values.push(title);
    }

    if (description !== undefined) {
        fields.push(`description = $${index++}`);
        values.push(description);
    }

    if (category !== undefined) {
        fields.push(`category = $${index++}`);
        values.push(category);
    }

    if (requiredSkills !== undefined) {
        fields.push(`required_skills = $${index++}`);
        values.push(requiredSkills);
    }

    if (budget !== undefined) {
        fields.push(`budget = $${index++}`);
        values.push(budget);
    }

    if (deadline !== undefined) {
        fields.push(`deadline = $${index++}`);
        values.push(deadline);
    }

    if (priority !== undefined) {
        fields.push(`priority = $${index++}`);
        values.push(priority);
    }

    if (attachmentUrl !== undefined) {
        fields.push(`attachment_url = $${index++}`);
        values.push(attachmentUrl);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    values.push(posterId);

    const query = `
        UPDATE jugaads
        SET ${fields.join(', ')}
        WHERE id = $${index++}
          AND poster_id = $${index++}
        RETURNING *;
    `;

    const { rows } = await pool.query(query, values);

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

    const { rows } = await pool.query(query, [
        id,
        posterId
    ]);

    return rows[0] || null;
};


/**
 * ============================================================
 * GET MY JUGAADS
 * ============================================================
 */

export const findMyJugaads = async (
    posterId,
    status
) => {
    let query = `
        SELECT
            j.*,
            COUNT(DISTINCT p.id)::INTEGER AS proposal_count

        FROM jugaads j

        LEFT JOIN jugaad_proposals p
            ON p.jugaad_id = j.id

        WHERE j.poster_id = $1
    `;

    const values = [posterId];

    if (status) {
        query += ` AND j.status = $2`;
        values.push(status);
    }

    query += `
        GROUP BY j.id
        ORDER BY j.created_at DESC;
    `;

    const { rows } = await pool.query(
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

    /**
     * Prefer the user's college when no explicit
     * college filter is provided.
     */
    if (collegeId) {
        conditions.push(`j.college_id = $${index++}`);
        values.push(collegeId);
    } else if (userCollegeId) {
        conditions.push(`j.college_id = $${index++}`);
        values.push(userCollegeId);
    }

    if (category) {
        conditions.push(
            `LOWER(j.category) = LOWER($${index++})`
        );
        values.push(category);
    }

    if (skills && skills.length > 0) {
        conditions.push(
            `j.required_skills && $${index++}::TEXT[]`
        );
        values.push(skills);
    }

    if (search) {
        conditions.push(`
            (
                j.title ILIKE $${index}
                OR j.description ILIKE $${index}
                OR j.category ILIKE $${index}
            )
        `);

        values.push(`%${search}%`);
        index++;
    }

    if (minBudget !== null && minBudget !== undefined) {
        conditions.push(
            `j.budget >= $${index++}`
        );
        values.push(minBudget);
    }

    if (maxBudget !== null && maxBudget !== undefined) {
        conditions.push(
            `j.budget <= $${index++}`
        );
        values.push(maxBudget);
    }

    const limitIndex = index++;
    const offsetIndex = index++;

    values.push(limit);
    values.push(offset);

    const query = `
        SELECT
            j.*,

            u.name AS poster_name,
            u.email AS poster_email,

            c.name AS college_name

        FROM jugaads j

        LEFT JOIN users u
            ON u.id = j.poster_id

        LEFT JOIN college c
            ON c.id = j.college_id

        WHERE ${conditions.join(' AND ')}

        ORDER BY
            CASE
                WHEN j.priority = 'urgent' THEN 1
                WHEN j.priority = 'high' THEN 2
                WHEN j.priority = 'medium' THEN 3
                ELSE 4
            END,
            j.created_at DESC

        LIMIT $${limitIndex}
        OFFSET $${offsetIndex};
    `;

    const { rows } = await pool.query(
        query,
        values
    );

    return rows;
};


/**
 * ============================================================
 * MARK JUGAAD AS NOT INTERESTED
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
        VALUES ($1, $2)

        ON CONFLICT (user_id, jugaad_id)
        DO NOTHING

        RETURNING *;
    `;

    const { rows } = await pool.query(
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
 * This is important for the problem we are fixing.
 *
 * When a student clicks "INTERESTED", the request needs
 * to be stored in jugaad_proposals.
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

        ON CONFLICT (jugaad_id, helper_id)
        DO UPDATE SET
            proposal_message = EXCLUDED.proposal_message,
            proposed_price = EXCLUDED.proposed_price,
            status = 'pending',
            updated_at = CURRENT_TIMESTAMP

        RETURNING *;
    `;

    const values = [
        jugaadId,
        userId,
        message,
        proposedPrice
    ];

    const { rows } = await pool.query(
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
 * Used by "My Jugaads" to show:
 *
 * INTERESTED STUDENTS
 * -------------------
 * Student 1
 * Student 2
 * Student 3
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

            u.name AS helper_name,
            u.email AS helper_email,
            u.number AS helper_number,
            u.location AS helper_location,

            c.name AS helper_college_name

        FROM jugaad_proposals p

        INNER JOIN jugaads j
            ON j.id = p.jugaad_id

        INNER JOIN users u
            ON u.id = p.helper_id

        LEFT JOIN college c
            ON c.id = u.college_id

        WHERE p.jugaad_id = $1
          AND j.poster_id = $2

        ORDER BY p.created_at DESC;
    `;

    const { rows } = await pool.query(
        query,
        [
            jugaadId,
            posterId
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
        SELECT COUNT(*)::INTEGER AS count
        FROM jugaad_proposals
        WHERE jugaad_id = $1;
    `;

    const { rows } = await pool.query(
        query,
        [jugaadId]
    );

    return rows[0]?.count || 0;
};