// src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2/promise';

// Middleware untuk memeriksa apakah pengguna sudah login
export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Akses ditolak. Anda harus login terlebih dahulu.' });
};

// Middleware untuk Bendahara
export const isBendahara = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user || req.session.user.peran !== 'Bendahara') {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Rute ini hanya untuk Bendahara.' });
    }
    next();
};

// Middleware untuk Santri
export const isSantri = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user || req.session.user.peran !== 'Santri') {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Rute ini hanya untuk Santri.' });
    }
    next();
};

// Middleware untuk Guru
export const isGuru = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user || req.session.user.peran !== 'Guru') {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Rute ini hanya untuk Guru.' });
    }
    next();
};

// Middleware untuk Admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user || req.session.user.peran !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Rute ini hanya untuk Admin.' });
    }
    next();
};

// Middleware untuk Wali Kelas
export const isWaliKelas = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user || req.session.user.peran !== 'Guru') {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Rute ini hanya untuk Wali Kelas.' });
    }
    
    try {
        const [guruData] = await pool.query<RowDataPacket[] & { id: number }[]>('SELECT id FROM guru WHERE id_pengguna = ?', [req.session.user.id_pengguna]);
        if (guruData.length === 0) {
            return res.status(403).json({ success: false, message: 'Profil guru tidak ditemukan untuk sesi ini.' });
        }
        const id_guru = guruData[0].id;

        const [kelasData] = await pool.query<RowDataPacket[] & { id: number }[]>('SELECT id FROM kelas WHERE id_wali_kelas = ?', [id_guru]);
        
        if (kelasData.length === 0) {
            return res.status(403).json({ success: false, message: 'Akses ditolak. Anda bukan Wali Kelas.' });
        }

        (req as any).id_kelas_wali = kelasData[0].id;
        next();
    } catch (error) {
        console.error("Error saat verifikasi wali kelas:", error);
        res.status(500).json({ success: false, message: "Gagal memverifikasi status wali kelas." });
    }
};