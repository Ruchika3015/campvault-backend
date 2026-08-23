import pool from '../config/db.js';

/**
 * Create a new Jugaad
 */
export const createJugaad = async (jugaadData) => {
    const {
        posterId,
        collegeId,
        title,
        description,
        category,
        requiredSkills = [],
        budget,
        deadline,
        priority = 'medium',
        attachmentUrl = null
    } = jugaadData;

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
            attachment_url,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')
        RETURNING *;
    `;

    const values = [
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
    ];

    const { rows } = await pool.query(query, values);

    return rows[0];
};


/**
 * Find one Jugaad by ID
 */
export const findJugaadById = async (id) => {
    const query = `
        SELECT
            j.id,
            j.title,
            j.description,
            j.category,
            j.required_skills,
            j.budget,
            j.deadline,
            j.priority,
            j.attachment_url,
            j.status,
            j.created_at,
            j.updated_at,
            j.college_id,

            c.name AS college_name,

            j.poster_id,

            poster.name AS poster_name,
            poster.email AS poster_email,
            poster.number AS poster_number,
            poster.location AS poster_location,

            j.helper_id,

            helper.name AS helper_name,
            helper.email AS helper_email,

            COALESCE(prop.proposal_count, 0)::INTEGER AS proposal_count

        FROM jugaads j

        JOIN users poster
            ON poster.id = j.poster_id

        JOIN college c
            ON c.id = j.college_id

        LEFT JOIN users helper
            ON helper.id = j.helper_id

        LEFT JOIN (
            SELECT
                jugaad_id,
                COUNT(*) AS proposal_count
            FROM jugaad_proposals
            WHERE status != 'withdrawn'
            GROUP BY jugaad_id
        ) prop
            ON prop.jugaad_id = j.id

        WHERE j.id = $1;
    `;

    const { rows } = await pool.query(query, [id]);

    return rows[0];
};


/**
 * Update Jugaad
 */
export const updateJugaad = async (id, posterId, updateData) => {
    const {
        title,
        description,
        category,
        requiredSkills,
        budget,
        deadline,
        priority,
        attachmentUrl
    } = updateData;

    const query = `
        UPDATE jugaads
        SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            category = COALESCE($3, category),
            required_skills = COALESCE($4, required_skills),
            budget = COALESCE($5, budget),
            deadline = COALESCE($6, deadline),
            priority = COALESCE($7, priority),
            attachment_url = COALESCE($8, attachment_url),
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $9
          AND poster_id = $10
          AND status = 'open'

        RETURNING *;
    `;

    const values = [
        title ?? null,
        description ?? null,
        category ?? null,
        requiredSkills ?? null,
        budget ?? null,
        deadline ?? null,
        priority ?? null,
        attachmentUrl ?? null,
        id,
        posterId
    ];

    const { rows } = await pool.query(query, values);

    return rows[0];
};


/**
 * Cancel/Delete Jugaad
 *
 * We keep the row in the database and mark it as cancelled.
 */
export const cancelOrDeleteJugaad = async (id, posterId) => {
    const query = `
        UPDATE jugaads
        SET
            status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $1
          AND poster_id = $2
          AND status = 'open'

        RETURNING *;
    `;

    const { rows } = await pool.query(query, [
        id,
        posterId
    ]);

    return rows[0];
};


/**
 * Get all Jugaads created by a user
 */
export const findMyJugaads = async (
    posterId,
    status = null
) => {
    let query = `
        SELECT
            j.*,

            c.name AS college_name,

            COALESCE(prop.proposal_count, 0)::INTEGER
                AS proposal_count

        FROM jugaads j

        JOIN college c
            ON c.id = j.college_id

        LEFT JOIN (
            SELECT
                jugaad_id,
                COUNT(*) AS proposal_count

            FROM jugaad_proposals

            WHERE status != 'withdrawn'

            GROUP BY jugaad_id
        ) prop
            ON prop.jugaad_id = j.id

        WHERE j.poster_id = $1
    `;

    const values = [posterId];

    if (status) {
        values.push(status);

        query += `
            AND j.status = $${values.length}
        `;
    }

    query += `
        ORDER BY j.created_at DESC;
    `;

    const { rows } = await pool.query(
        query,
        values
    );

    return rows;
};


/**
 * Find Jugaads for discovery feed
 */
export const findDiscoverableJugaads = async ({
    currentUserId,
    userCollegeId = null,
    collegeId = null,
    category = null,
    skills = null,
    search = null,
    minBudget = null,
    maxBudget = null,
    limit = 20,
    offset = 0
}) => {
    const conditions = [
        `j.poster_id != $1`,
        `j.status = 'open'`,
        `j.deadline > CURRENT_TIMESTAMP`,
        `
        j.id NOT IN (
            SELECT jugaad_id
            FROM jugaad_not_interested
            WHERE user_id = $1
        )
        `
    ];

    const values = [
        currentUserId
    ];

    /*
     * Prefer explicitly requested college.
     * Otherwise use user's college.
     */
    const targetCollegeId =
        collegeId || userCollegeId;

    if (targetCollegeId) {
        values.push(targetCollegeId);

        conditions.push(
            `j.college_id = $${values.length}`
        );
    }

    /*
     * Category filter
     */
    if (category) {
        values.push(category);

        conditions.push(
            `j.category ILIKE $${values.length}`
        );
    }

    /*
     * Search filter
     */
    if (search) {
        values.push(`%${search}%`);

        conditions.push(`
            (
                j.title ILIKE $${values.length}
                OR
                j.description ILIKE $${values.length}
            )
        `);
    }

    /*
     * Minimum budget
     */
    if (
        minBudget !== null &&
        minBudget !== undefined
    ) {
        values.push(minBudget);

        conditions.push(
            `j.budget >= $${values.length}`
        );
    }

    /*
     * Maximum budget
     */
    if (
        maxBudget !== null &&
        maxBudget !== undefined
    ) {
        values.push(maxBudget);

        conditions.push(
            `j.budget <= $${values.length}`
        );
    }

    /*
     * Required skills filter
     */
    if (
        skills &&
        Array.isArray(skills) &&
        skills.length > 0
    ) {
        values.push(skills);

        conditions.push(
            `j.required_skills && $${values.length}::text[]`
        );
    }

    /*
     * Pagination
     */
    values.push(limit);

    const limitIndex = values.length;

    values.push(offset);

    const offsetIndex = values.length;

    const query = `
        SELECT
            j.id,
            j.title,
            j.description,
            j.category,
            j.required_skills,
            j.budget,
            j.deadline,
            j.priority,
            j.attachment_url,
            j.status,
            j.created_at,
            j.college_id,

            c.name AS college_name,

            poster.name AS poster_name,

            COALESCE(
                prop.proposal_count,
                0
            )::INTEGER AS proposal_count,

            CASE
                WHEN j.priority = 'urgent' THEN 4
                WHEN j.priority = 'high' THEN 3
                WHEN j.priority = 'medium' THEN 2
                ELSE 1
            END AS priority_weight

        FROM jugaads j

        JOIN users poster
            ON poster.id = j.poster_id

        JOIN college c
            ON c.id = j.college_id

        LEFT JOIN (
            SELECT
                jugaad_id,
                COUNT(*) AS proposal_count

            FROM jugaad_proposals

            WHERE status != 'withdrawn'

            GROUP BY jugaad_id
        ) prop
            ON prop.jugaad_id = j.id

        WHERE ${conditions.join(' AND ')}

        ORDER BY
            priority_weight DESC,
            j.deadline ASC,
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
 * Mark a Jugaad as "not interested" for a user
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

        ON CONFLICT (
            user_id,
            jugaad_id
        )
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

    return (
        rows[0] || {
            user_id: userId,
            jugaad_id: jugaadId,
            already_marked: true
        }
    );
};