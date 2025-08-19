// --- IMPORTS ---
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import path from 'path';
import dotenv from 'dotenv';
import { Store } from 'express-session';

import pool from './config/db'; 

dotenv.config();

// --- INISIALISASI APLIKASI EXPRESS ---
const app: Express = express();
const PORT = process.env.PORT || 5000;

// --- TES KONEKSI DATABASE SAAT STARTUP ---
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
app.use(express.static(path.join(__dirname, '../../public')));


// --- KONFIGURASI SESI DENGAN LOG ---
const MySQLStore = MySQLStoreFactory(session as any);
const sessionStore: Store = new MySQLStore({
    expiration: 1000 * 60 * 60 * 24,
    createDatabaseTable: true,       
    schema: { tableName: 'sessions', columnNames: { session_id: 'session_id', expires: 'expires', data: 'data' } }
}, pool);

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

// Middleware logging untuk sesi
app.use((req, res, next) => {
    console.log(`[MIDDLEWARE] Request masuk ke: ${req.method} ${req.path}`);
    next();
});

// Menerapkan middleware session
app.use(session(sessionConfig) as any);

// Middleware logging setelah sesi
app.use((req, res, next) => {
    console.log(`[MIDDLEWARE] Sesi ${req.session ? 'BERHASIL' : 'GAGAL'} diinisialisasi untuk request.`);
    next();
});


// --- IMPOR & GUNAKAN RUTE ---
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import akademikRoutes from './routes/akademikRoutes';
import guruRoutes from './routes/guruRoutes';
import guruManagementRoutes from './routes/guruManagementRoutes';
import kelasManagementRoutes from './routes/kelasManagementRoutes';
import santriRoutes from './routes/santriRoutes';
import santriManagementRoutes from './routes/santriManagementRoutes';
import waliKelasRoutes from './routes/walikelasRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/account/admin', adminRoutes);
app.use('/api/account/guru', guruRoutes);
app.use('/api/account/santri', santriRoutes);
app.use('/api/account/wali-kelas', waliKelasRoutes);
app.use('/api/manage/akademik', akademikRoutes);
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