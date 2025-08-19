// --- IMPORTS ---
import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2/promise';

// --- INTERFACES & TYPES ---
export interface RequestWithWaliKelas extends Request {
    id_kelas_wali?: number;
}


// --- FUNGSI MIDDLEWARE ---

// Middleware untuk memeriksa apakah pengguna sudah login
export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {

    if (req.session.user) {
        return next();
    }
    res.status(401).json({ message: 'Akses ditolak. Anda harus login terlebih dahulu.' });
};

// Middleware untuk memeriksa peran 'Admin'
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {

    if (req.session.user && req.session.user.peran === 'Admin') {
        return next();
    }
    res.status(403).json({ message: 'Akses ditolak. Rute ini hanya untuk Admin.' });
};

// Middleware untuk memeriksa peran 'Guru' (Admin juga diizinkan)
export const isGuru = (req: Request, res: Response, next: NextFunction) => {

    if (req.session.user && (req.session.user.peran === 'Guru' || req.session.user.peran === 'Admin')) {
        return next();
    }
    res.status(403).json({ message: 'Akses ditolak. Rute ini hanya untuk Guru atau Admin.' });
};

// Middleware untuk memeriksa peran 'Santri'
export const isSantri = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user && req.session.user.peran === 'Santri' && req.session.user.id_santri) {
        // --- TAMBAHKAN BARIS INI ---
        (req as any).id_santri = req.session.user.id_santri;
        return next();
    }
    return res.status(401).json({ success: false, error: "Akses ditolak. Anda harus login sebagai santri." });
};


// Middleware untuk memverifikasi apakah Guru yang login adalah seorang Wali Kelas
export const isWaliKelas = async (req: RequestWithWaliKelas, res: Response, next: NextFunction) => {

    if (!req.session.user || req.session.user.peran !== 'Guru') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya Guru yang bisa menjadi Wali Kelas.' });
    }
    
    try {

        const [guruData] = await pool.query<RowDataPacket[] & { id: number }[]>('SELECT id FROM guru WHERE id_pengguna = ?', [req.session.user.id_pengguna]);
        if (guruData.length === 0) {
            return res.status(403).json({ message: "Profil guru tidak ditemukan untuk sesi ini." });
        }
        const id_guru = guruData[0].id;

        const [kelasData] = await pool.query<RowDataPacket[] & { id: number }[]>('SELECT id FROM kelas WHERE id_wali_kelas = ?', [id_guru]);
        
        if (kelasData.length === 0) {
            return res.status(403).json({ message: 'Akses ditolak. Anda bukan Wali Kelas dari kelas manapun.' });
        }

        req.id_kelas_wali = kelasData[0].id;
        next(); 
    } catch (error) {
        console.error("Error saat verifikasi wali kelas:", error);
        res.status(500).json({ message: "Gagal memverifikasi status wali kelas." });
    }
};