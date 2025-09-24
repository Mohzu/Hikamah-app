import { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2/promise';

// Middleware untuk mengecek apakah pengguna sudah login via sesi
export const protect = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session && req.session.user) {
    return next();
  } else {
    res.status(401).json({ message: 'Tidak terotentikasi, silakan login' });
  }
};

// Alias untuk protect, karena sepertinya digunakan di beberapa route
export const isLoggedIn = protect;

// Middleware untuk mengecek peran Admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'admin') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan admin' });
  }
};

// Middleware untuk mengecek peran Bendahara
export const isBendahara = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'bendahara') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan bendahara' });
  }
};

// Middleware untuk mengecek peran Guru
export const isGuru = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'guru') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan guru' });
  }
};

// Middleware untuk mengecek peran Santri
export const isSantri = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'santri') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan santri' });
  }
};

// Middleware untuk mengecek peran Wali Kelas
export const isWaliKelas = async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const role = req.session.user?.peran;
  if (!role) return res.status(401).json({ success: false, error: 'Tidak terotentikasi, silakan login' });
  const normalized = role.toLowerCase().replace(/\s+/g, '');

  // Jika sudah berperan "Wali Kelas", pastikan set id_kelas_wali juga
  if (normalized === 'walikelas') {
    try {
      // @ts-ignore
      const idPengguna = req.session.user.id_pengguna;
      const [guruRows] = await pool.query<RowDataPacket[] & { id: number }[]>(
        'SELECT id FROM guru WHERE id_pengguna = ? LIMIT 1',
        [idPengguna]
      );
      if (guruRows.length === 0) return res.status(403).json({ success: false, error: 'Profil guru tidak ditemukan.' });
      const idGuru = guruRows[0].id;
      const [kelasRows] = await pool.query<RowDataPacket[] & { id: number }[]>(
        'SELECT id FROM kelas WHERE id_wali_kelas = ? LIMIT 1',
        [idGuru]
      );
      if (kelasRows.length === 0) return res.status(403).json({ success: false, error: 'Anda bukan Wali Kelas dari kelas manapun.' });
      // @ts-ignore
      req.id_kelas_wali = kelasRows[0].id;
      return next();
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Gagal memverifikasi status wali kelas.' });
    }
  }

  // Jika Guru, verifikasi apakah dia wali kelas berdasarkan DB
  if (normalized === 'guru') {
    try {
      // @ts-ignore
      const idPengguna = req.session.user.id_pengguna;
      const [guruRows] = await pool.query<RowDataPacket[] & { id: number }[]>(
        'SELECT id FROM guru WHERE id_pengguna = ? LIMIT 1',
        [idPengguna]
      );
      if (guruRows.length === 0) return res.status(403).json({ success: false, error: 'Profil guru tidak ditemukan.' });
      const idGuru = guruRows[0].id;
      const [kelasRows] = await pool.query<RowDataPacket[] & { id: number }[]>(
        'SELECT id FROM kelas WHERE id_wali_kelas = ? LIMIT 1',
        [idGuru]
      );
      if (kelasRows.length === 0) return res.status(403).json({ success: false, error: 'Anda bukan Wali Kelas dari kelas manapun.' });
      // @ts-ignore
      req.id_kelas_wali = kelasRows[0].id;
      return next();
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Gagal memverifikasi status wali kelas.' });
    }
  }

  return res.status(403).json({ success: false, error: 'Akses ditolak, Anda bukan wali kelas' });
};