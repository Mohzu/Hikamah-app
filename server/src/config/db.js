// --- IMPORTS ---
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Muat variabel lingkungan dari file .env
dotenv.config();

// --- Konfigurasi Koneksi Database ---
// Membuat pool koneksi yang akan digunakan di seluruh aplikasi.
// Pool ini akan mengelola beberapa koneksi secara efisien.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, // Menunggu koneksi tersedia jika semua sedang digunakan
    connectionLimit: 10,      // Jumlah maksimum koneksi dalam pool
    queueLimit: 0             // Tidak ada batasan antrian permintaan koneksi
});

// Mengekspor pool agar bisa diimpor dan digunakan oleh file lain (misalnya, controller).
export default pool;