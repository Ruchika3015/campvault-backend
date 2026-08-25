import pool from '../config/db.js';


// ================================================================
// USERS
// ================================================================

export const findUserByEmail = async (email) => {
    const query = `
        SELECT *
        FROM users
        WHERE email = $1;
    `;

    const { rows } = await pool.query(query, [email]);

    return rows[0];
};


export const createUser = async (userData) => {
    const {
        name,
        email,
        password_hash,
        role,
        number,
        location,
        college_id
    } = userData;

    const query = `
        INSERT INTO users (
            name,
            email,
            password_hash,
            role,
            number,
            location,
            college_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id,
            name,
            email,
            number,
            location,
            college_id;
    `;

    const values = [
        name,
        email,
        password_hash,
        role,
        number,
        location,
        college_id
    ];

    const { rows } = await pool.query(query, values);

    return rows[0];
};


export const updateUserProfile = async (
    userId,
    userData
) => {
    const {
        name,
        email,
        number,
        location,
        college_id
    } = userData;

    const query = `
        UPDATE users
        SET
            name = $1,
            email = $2,
            number = $3,
            location = $4,
            college_id = $5
        WHERE id = $6
        RETURNING
            id,
            name,
            email,
            number,
            location,
            college_id;
    `;

    const values = [
        name,
        email,
        number,
        location,
        college_id,
        userId
    ];

    const { rows } = await pool.query(query, values);

    return rows[0];
};


// ================================================================
// SKILLS
// ================================================================

export const getSkillsByUserId = async (userId) => {
    const query = `
        SELECT
            id,
            name,
            category,
            level,
            created_at,
            updated_at
        FROM user_skills
        WHERE user_id = $1
        ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
};


export const createSkill = async (
    userId,
    skillData
) => {
    const {
        name,
        category,
        level
    } = skillData;

    const query = `
        INSERT INTO user_skills (
            user_id,
            name,
            category,
            level
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            name,
            category,
            level,
            created_at,
            updated_at;
    `;

    const values = [
        userId,
        name,
        category || null,
        level || null
    ];

    const { rows } = await pool.query(
        query,
        values
    );

    return rows[0];
};


export const updateSkill = async (
    userId,
    skillId,
    skillData
) => {
    const {
        name,
        category,
        level
    } = skillData;

    const query = `
        UPDATE user_skills
        SET
            name = $1,
            category = $2,
            level = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
          AND user_id = $5
        RETURNING
            id,
            name,
            category,
            level,
            created_at,
            updated_at;
    `;

    const values = [
        name,
        category || null,
        level || null,
        skillId,
        userId
    ];

    const { rows } = await pool.query(
        query,
        values
    );

    return rows[0];
};


export const deleteSkill = async (
    userId,
    skillId
) => {
    const query = `
        DELETE FROM user_skills
        WHERE id = $1
          AND user_id = $2
        RETURNING id;
    `;

    const { rows } = await pool.query(
        query,
        [skillId, userId]
    );

    return rows[0];
};