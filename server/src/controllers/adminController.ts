// --- IMPORTS ---
import { Request, Response } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';

// --- INTERFACES & SKEMA ---
interface UserPasswordRow extends RowDataPacket {
    kata_sandi: string;
}

// Skema untuk validasi ganti password
const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, { message: "Password lama harus diisi" }),
    newPassword: z.string().min(6, { message: "Password baru minimal 6 karakter" })
});

// Skema untuk validasi ganti username
const changeUsernameSchema = z.object({
    newUsername: z.string().min(3, { message: "Username baru minimal 3 karakter" })
});

// --- FUNGSI MIDDLEWARE ---
// (Middleware isAdmin tetap sama, tidak perlu diubah)
export const isAdmin = (req: Request, res: Response, next: () => void) => {
    // ...
};

// --- FUNGSI CONTROLLER ---

// Admin: Mengganti password sendiri
export const changePassword = async (req: Request, res: Response) => {
    const validationResult = changePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ 
            success: false,
            error: "Data yang dikirim tidak valid",
            details: validationResult.error.flatten().fieldErrors 
        });
    }

    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Anda harus login terlebih dahulu.' });
    }
    
    const { oldPassword, newPassword } = validationResult.data;
    const { id_pengguna } = req.session.user; 

    try {
        const [users] = await pool.query<UserPasswordRow[]>('SELECT kata_sandi FROM pengguna WHERE id = ?', [id_pengguna]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'Akun admin tidak ditemukan.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, users[0].kata_sandi);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Password lama salah.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE pengguna SET kata_sandi = ? WHERE id = ?', [hashedNewPassword, id_pengguna]);

        res.status(200).json({ success: true, data: { message: 'Password Anda berhasil diubah.' } });
    } catch (error: any) {
        console.error("Error saat admin ganti password:", error);
        res.status(500).json({ success: false, error: "Gagal mengubah password karena kesalahan server." });
    }
};

// Admin: Mengganti username sendiri
export const changeUsername = async (req: Request, res: Response) => {
    const validationResult = changeUsernameSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ 
            success: false,
            error: "Data yang dikirim tidak valid",
            details: validationResult.error.flatten().fieldErrors 
        });
    }
    
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Anda harus login terlebih dahulu.' });
    }
    
    const { newUsername } = validationResult.data;
    const { id_pengguna, username: oldUsername } = req.session.user;

    if (newUsername === oldUsername) {
        return res.status(400).json({ success: false, error: 'Username baru tidak boleh sama dengan username lama.' });
    }

    try {
        await pool.query('UPDATE pengguna SET username = ? WHERE id = ?', [newUsername, id_pengguna]);
        
        req.session.user.username = newUsername; 
        req.session.save(err => {
            if (err) {
                console.error("Gagal menyimpan sesi:", err);
                return res.status(500).json({ success: false, error: "Username diubah, tapi gagal update sesi. Harap login kembali." });
            }
            res.status(200).json({ success: true, data: { message: 'Username Anda berhasil diubah.', newUsername } });
        });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Username ini sudah digunakan.' });
        }
        console.error("Error saat admin ganti username:", error);
        res.status(500).json({ success: false, error: "Gagal mengubah username karena kesalahan server." });
    }
};