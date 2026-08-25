import pool from '../config/db.js';

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

export const updateUserProfile = async (userId, userData) => {
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