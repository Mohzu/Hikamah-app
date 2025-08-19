// --- IMPORTS ---
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });


// --- Konfigurasi Koneksi Database ---
// Membuat pool koneksi yang akan digunakan di seluruh aplikasi.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Ekspor Pool Koneksi ---
export default pool;