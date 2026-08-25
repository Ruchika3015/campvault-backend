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


// ================================================================
// LINKS & PROFILES
// ================================================================

export const getLinksByUserId = async (userId) => {
    const query = `
        SELECT
            id,
            platform,
            url,
            created_at,
            updated_at
        FROM user_links
        WHERE user_id = $1
        ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
};


export const createLink = async (
    userId,
    linkData
) => {
    const {
        platform,
        url
    } = linkData;

    const query = `
        INSERT INTO user_links (
            user_id,
            platform,
            url
        )
        VALUES ($1, $2, $3)
        RETURNING
            id,
            platform,
            url,
            created_at,
            updated_at;
    `;

    const values = [
        userId,
        platform,
        url
    ];

    const { rows } = await pool.query(
        query,
        values
    );

    return rows[0];
};


export const updateLink = async (
    userId,
    linkId,
    linkData
) => {
    const {
        platform,
        url
    } = linkData;

    const query = `
        UPDATE user_links
        SET
            platform = $1,
            url = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND user_id = $4
        RETURNING
            id,
            platform,
            url,
            created_at,
            updated_at;
    `;

    const values = [
        platform,
        url,
        linkId,
        userId
    ];

    const { rows } = await pool.query(
        query,
        values
    );

    return rows[0];
};


export const deleteLink = async (
    userId,
    linkId
) => {
    const query = `
        DELETE FROM user_links
        WHERE id = $1
          AND user_id = $2
        RETURNING id;
    `;

    const { rows } = await pool.query(
        query,
        [linkId, userId]
    );

    return rows[0];
};


// ================================================================
// PROJECTS
// ================================================================

export const getProjectsByUserId = async (userId) => {
    const query = `
        SELECT
            id,
            name,
            description,
            technologies,
            github,
            link,
            created_at,
            updated_at
        FROM user_projects
        WHERE user_id = $1
        ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
};


export const createProject = async (
    userId,
    projectData
) => {
    const {
        name,
        description,
        technologies,
        github,
        link
    } = projectData;

    const query = `
        INSERT INTO user_projects (
            user_id,
            name,
            description,
            technologies,
            github,
            link
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            name,
            description,
            technologies,
            github,
            link,
            created_at,
            updated_at;
    `;

    const values = [
        userId,
        name,
        description || null,
        technologies || null,
        github || null,
        link || null
    ];

    const { rows } = await pool.query(
        query,
        values
    );

    return rows[0];
};


export const updateProject = async (
    userId,
    projectId,
    projectData
) => {
    const {
        name,
        description,
        technologies,
        github,
        link
    } = projectData;

    const query = `
        UPDATE user_projects
        SET
            name = $1,
            description = $2,
            technologies = $3,
            github = $4,
            link = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
          AND user_id = $7
        RETURNING
            id,
            name,
            description,
            technologies,
            github,
            link,
            created_at,
            updated_at;
    `;

    const values = [
        name,
        description || null,
        technologies || null,
        github || null,
        link || null,
        projectId,
        userId
    ];

    const { rows } = await pool.query(
        query,
        values
    );

    return rows[0];
};


export const deleteProject = async (
    userId,
    projectId
) => {
    const query = `
        DELETE FROM user_projects
        WHERE id = $1
          AND user_id = $2
        RETURNING id;
    `;

    const { rows } = await pool.query(
        query,
        [projectId, userId]
    );

    return rows[0];
};


// ================================================================
// CERTIFICATIONS & ACHIEVEMENTS
// ================================================================

export const getCertificationsByUserId = async (
    userId
) => {
    const query = `
        SELECT
            id,
            title,
            organization,
            date,
            description,
            credential_url,
            created_at,
            updated_at
        FROM user_certifications
        WHERE user_id = $1
        ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(
        query,
        [userId]
    );

    return rows;
};


export const createCertification = async (
    userId,
    certificationData
) => {
    const {
        title,
        organization,
        date,
        description,
        credential_url
    } = certificationData;

    const query = `
        INSERT INTO user_certifications (
            user_id,
            title,
            organization,
            date,
            description,
            credential_url
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            title,
            organization,
            date,
            description,
            credential_url,
            created_at,
            updated_at;
    `;

    const values = [
        userId,
        title,
        organization || null,
        date || null,
        description || null,
        credential_url || null
    ];

    const { rows } = await pool.query(
        query,
        values
    );

    return rows[0];
};


export const updateCertification = async (
    userId,
    certificationId,
    certificationData
) => {
    const {
        title,
        organization,
        date,
        description,
        credential_url
    } = certificationData;

    const query = `
        UPDATE user_certifications
        SET
            title = $1,
            organization = $2,
            date = $3,
            description = $4,
            credential_url = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
          AND user_id = $7
        RETURNING
            id,
            title,
            organization,
            date,
            description,
            credential_url,
            created_at,
            updated_at;
    `;

    const values = [
        title,
        organization || null,
        date || null,
        description || null,
        credential_url || null,
        certificationId,
        userId
    ];

    const { rows } = await pool.query(
        query,
        values
    );

    return rows[0];
};


export const deleteCertification = async (
    userId,
    certificationId
) => {
    const query = `
        DELETE FROM user_certifications
        WHERE id = $1
          AND user_id = $2
        RETURNING id;
    `;

    const { rows } = await pool.query(
        query,
        [certificationId, userId]
    );

    return rows[0];
};