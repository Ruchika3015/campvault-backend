import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT)
});

pool.on('connect', () => {
    console.log('PostgreSQL Connection Pool initialized successfully 🐘');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
});

export default pool;