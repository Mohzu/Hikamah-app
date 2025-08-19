// --- IMPORTS ---
import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';
import { z } from 'zod';

// --- INTERFACES & SKEMA ZOD ---
interface UserRow extends RowDataPacket {
    id: number;
    kata_sandi: string;
    status_aktif: number;
    peran: 'Admin' | 'Guru' | 'Santri' | 'Wali Santri';
    nama_lengkap: string;
    username: string;
}
interface SantriRow extends RowDataPacket {
    id: number;
    nama_lengkap: string;
}
const loginSchema = z.object({
    username: z.string().min(1, "Username harus diisi"),
    kata_sandi: z.string().min(1, "Kata sandi harus diisi")
});
// Skema register tidak ditampilkan lagi untuk keringkasan

// --- FUNGSI CONTROLLER ---
export const register = async (req: Request, res: Response) => {
    // ... (kode register Anda)
};

export const login = async (req: Request, res: Response) => {
    console.log("[LOGIN CONTROLLER] 1. Fungsi login dimulai.");
    
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
        console.log("[LOGIN CONTROLLER] GAGAL: Validasi Zod gagal.");
        return res.status(400).json({ success: false, error: "Data login tidak valid", details: validationResult.error.flatten().fieldErrors });
    }

    console.log("[LOGIN CONTROLLER] 2. Validasi Zod berhasil.");
    const { username, kata_sandi } = validationResult.data;

    try {
        console.log(`[LOGIN CONTROLLER] 3. Mencoba mengambil pengguna dari DB: ${username}`);
        
        const [users] = await pool.query<UserRow[]>('SELECT id, kata_sandi, status_aktif, peran, nama_lengkap, username FROM pengguna WHERE username = ?', [username]);
        
        console.log("[LOGIN CONTROLLER] 4. Query pengguna selesai. Ditemukan:", users.length);

        if (users.length === 0) {
            console.log("[LOGIN CONTROLLER] GAGAL: Pengguna tidak ditemukan.");
            return res.status(401).json({ success: false, error: 'Username atau kata sandi salah.' });
        }
        
        const user = users[0];
        console.log("[LOGIN CONTROLLER] 5. Mencocokkan password...");
        
        const isMatch = await bcrypt.compare(kata_sandi, user.kata_sandi);
        console.log("[LOGIN CONTROLLER] 6. Pencocokan password selesai. Hasil:", isMatch);

        if (!isMatch) {
            console.log("[LOGIN CONTROLLER] GAGAL: Password tidak cocok.");
            return res.status(401).json({ success: false, error: 'Username atau kata sandi salah.' });
        }

        if (user.status_aktif !== 1) {
            console.log("[LOGIN CONTROLLER] GAGAL: Akun tidak aktif.");
            return res.status(403).json({ success: false, error: 'Akun ini tidak aktif.' });
        }
        
        console.log("[LOGIN CONTROLLER] 7. Login berhasil. Mempersiapkan sesi...");
        let sessionPayload;
        const userRole = user.peran.toLowerCase();

        if (userRole === 'santri') {
            const [santriRows] = await pool.query<SantriRow[]>('SELECT id, nama_lengkap FROM santri WHERE id_pengguna = ?', [user.id]);
            if (santriRows.length === 0) {
                console.log("[LOGIN CONTROLLER] GAGAL: Akun santri tidak tertaut.");
                return res.status(403).json({ success: false, error: 'Akun Pengguna Santri tidak tertaut.' });
            }
            sessionPayload = {
                id_pengguna: user.id, username: user.username, nama_santri: santriRows[0].nama_lengkap,
                peran: user.peran as 'Santri', id_santri: santriRows[0].id
            };
        } else if (userRole === 'admin' || userRole === 'guru') {
            sessionPayload = {
                id_pengguna: user.id, username: user.username, nama_pengguna: user.nama_lengkap,
                peran: user.peran as 'Admin' | 'Guru'
            };
        } else {
            console.log(`[LOGIN CONTROLLER] GAGAL: Peran tidak valid: ${user.peran}`);
            return res.status(403).json({ success: false, error: 'Peran pengguna tidak valid untuk login.' });
        }

        console.log("[LOGIN CONTROLLER] 8. Mencoba regenerate sesi...");
        req.session.regenerate(err => {
            if (err) {
                console.error("[LOGIN CONTROLLER] GAGAL: req.session.regenerate gagal", err);
                return res.status(500).json({ success: false, error: 'Gagal memulai sesi.' });
            }
            
            console.log("[LOGIN CONTROLLER] 9. Regenerate sesi berhasil. Menyimpan sesi...");
            req.session.user = sessionPayload;
            req.session.save(err => {
                if (err) {
                    console.error("[LOGIN CONTROLLER] GAGAL: req.session.save gagal", err);
                    return res.status(500).json({ success: false, error: 'Login gagal.' });
                }
                
                console.log("[LOGIN CONTROLLER] 10. Sesi berhasil disimpan. Mengirim respons.");
                res.status(200).json({ success: true, data: { message: 'Login berhasil.', user: sessionPayload } });
            });
        });

    } catch (error: any) {
        console.error("[LOGIN CONTROLLER] !!! TERJADI ERROR DI CATCH BLOCK:", error);
        res.status(500).json({ success: false, error: 'Login gagal karena kesalahan server.' });
    }
};

export const getLoginStatus = (req: Request, res: Response) => {
    // ... (kode getLoginStatus Anda)
};

export const logout = (req: Request, res: Response) => {
    // ... (kode logout Anda)
};