// server/src/index.ts

// --- IMPORTS ---
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import dotenv from 'dotenv';
import { Store } from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Tambahkan ini untuk mendapatkan path direktori
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '..');

// Konfigurasi dotenv
dotenv.config();

// --- INISIALISASI APLIKASI EXPRESS ---
const app: Express = express();
const PORT = process.env.PORT || 5000;

// --- IMPOR RUTE ---
import authRoutes from './routes/authRoutes.js';
import adminAccountRoutes from './routes/admin/adminRoutes.js';
import bendaharaManagementRoutes from './routes/admin/bendaharaManagementRoutes.js'; 
import akademikManagementRoutes from './routes/admin/akademikRoutes.js';
import guruRoutes from './routes/guruRoutes.js';
import guruManagementRoutes from './routes/admin/guruManagementRoutes.js';
import kelasManagementRoutes from './routes/admin/kelasManagementRoutes.js';
import santriRoutes from './routes/santriRoutes.js';
import santriManagementRoutes from './routes/admin/santriManagementRoutes.js';
import waliKelasRoutes from './routes/walikelasRoutes.js';
import bendaharaRoutes from './routes/bendaharaRoutes.js'; // Rute baru untuk Bendahara

// --- TES KONEKSI DATABASE SAAT STARTUP ---
import pool from './config/db.js';

pool.getConnection()
    .then(connection => {
        console.log('✅ Koneksi ke database berhasil!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Koneksi ke database gagal! Server tidak dapat dimulai.', err.message);
        process.exit(1);
    });

// --- KONFIGURASI MIDDLEWARE UTAMA ---
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// BARIS PENTING: Tambahkan middleware untuk melayani file statis dari folder 'public'
app.use('/public/uploads', express.static(path.join(rootPath, 'public/uploads')));
app.use('/uploads', express.static(path.join(rootPath, 'public/uploads')));
console.log('Serving static files from:', path.join(rootPath, 'public/uploads'));

// --- KONFIGURASI SESI DENGAN LOG ---
const MySQLStore = MySQLStoreFactory(session as any);
const sessionStore: Store = new MySQLStore({
    expiration: 1000 * 60 * 60 * 24,
    createDatabaseTable: true,       
    schema: { tableName: 'sessions', columnNames: { session_id: 'session_id', expires: 'expires', data: 'data' } }
}, pool as any); 
const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-yang-sangat-aman',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 
    }
};

app.use(session(sessionConfig) as any);

// --- GUNAKAN RUTE ---
app.use('/api/auth', authRoutes);
app.use('/api/account/admin', adminAccountRoutes);
app.use('/api/account/guru', guruRoutes);
app.use('/api/account/santri', santriRoutes);
app.use('/api/account/wali-kelas', waliKelasRoutes);

// Rute khusus Bendahara
app.use('/api/bendahara', bendaharaRoutes);

// Rute Admin
app.use('/api/admin/bendahara', bendaharaManagementRoutes);
app.use('/api/manage/akademik', akademikManagementRoutes);
app.use('/api/manage/guru', guruManagementRoutes);
app.use('/api/manage/kelas', kelasManagementRoutes);
app.use('/api/manage/santri', santriManagementRoutes);

// --- RUTE DASAR & LISTENER SERVER ---
app.get('/api', (req: Request, res: Response) => {
    res.send('API untuk aplikasi Hikmah berjalan...');
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
