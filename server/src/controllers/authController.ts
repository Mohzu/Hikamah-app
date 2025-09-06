// src/controllers/authController.ts

import { Request, Response } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';
import { z } from 'zod';

// Tipe data dari database
interface UserRow extends RowDataPacket {
    id: number;
    kata_sandi: string;
    status_aktif: number;
    peran: 'Admin' | 'Guru' | 'Santri' | 'Wali Santri' | 'Bendahara';
    nama_lengkap: string;
    username: string;
}
interface SantriRow extends RowDataPacket {
    id: number;
    nama_lengkap: string;
}
interface GuruRow extends RowDataPacket {
    id: number;
    jabatan: string;
}

const loginSchema = z.object({
    username: z.string().min(1, "Username harus diisi"),
    kata_sandi: z.string().min(1, "Kata sandi harus diisi")
});

const registerSchema = z.object({
    nomor_induk: z.string().length(13, "Nomor Induk harus 13 digit").regex(/^\d+$/, "Nomor Induk hanya boleh berisi angka"),
    nama_santri: z.string().min(3, "Nama santri harus diisi"),
    tempat_lahir_santri: z.string().min(1, "Tempat lahir santri harus diisi"),
    tanggal_lahir_santri: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir harus YYYY-MM-DD"),
    jenis_kelamin: z.enum(['L', 'P']),
    anak_ke: z.number().int().positive(),
    dari_bersaudara: z.number().int().positive(),
    agama: z.string().min(1, "Agama harus diisi"),
    alamat_santri: z.string().min(1, "Alamat santri harus diisi"),
    nama_ayah: z.string().default(''), tempat_lahir_ayah: z.string().default(''), tanggal_lahir_ayah: z.string().default(''),
    pekerjaan_ayah: z.string().default(''), pendidikan_ayah: z.string().default(''), alamat_ayah: z.string().default(''), nomor_hp_ayah: z.string().default(''),
    nama_ibu: z.string().default(''), tempat_lahir_ibu: z.string().default(''), tanggal_lahir_ibu: z.string().default(''),
    pekerjaan_ibu: z.string().default(''), pendidikan_ibu: z.string().default(''), alamat_ibu: z.string().default(''), nomor_hp_ibu: z.string().default(''),
    email_wali: z.string().email("Format email wali tidak valid"),
    hubungan_wali: z.enum(['Ayah', 'Ibu'])
});

export const register = async (req: Request, res: Response) => {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ success: false, error: "Data pendaftaran tidak valid", details: validationResult.error.flatten().fieldErrors });
    }
    
    const { 
        nomor_induk, nama_santri, tanggal_lahir_santri, email_wali, hubungan_wali, 
        nama_ayah, tempat_lahir_ayah, tanggal_lahir_ayah, pekerjaan_ayah, pendidikan_ayah, alamat_ayah, nomor_hp_ayah,
        nama_ibu, tempat_lahir_ibu, tanggal_lahir_ibu, pekerjaan_ibu, pendidikan_ibu, alamat_ibu, nomor_hp_ibu,
        ...dataLainnya 
    } = validationResult.data;

    let connection: PoolConnection | undefined; 
    try {
        connection = await pool.getConnection();
        if (!connection) throw new Error('Gagal mendapatkan koneksi database.');
        await connection.beginTransaction();

        const [emailCheck] = await connection.query<RowDataPacket[]>('SELECT id FROM pengguna WHERE email = ?', [email_wali]);
        if (emailCheck.length > 0) throw new Error('Email wali ini sudah terdaftar.');
        
        const [indukCheck] = await connection.query<RowDataPacket[]>('SELECT id FROM santri WHERE nomor_induk = ?', [nomor_induk]);
        if (indukCheck.length > 0) throw new Error('Nomor Induk ini sudah terdaftar.');

        const nama_wali_akun = hubungan_wali.toLowerCase() === 'ayah' ? nama_ayah : nama_ibu;
        const nomor_hp_wali_akun = hubungan_wali.toLowerCase() === 'ayah' ? nomor_hp_ayah : nomor_hp_ibu;
        
        const tempPassword = tanggal_lahir_santri.replace(/-/g, '');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const [resultWali] = await connection.query<OkPacket>('INSERT INTO pengguna (nama_lengkap, email, kata_sandi, nomor_hp, peran, status_aktif) VALUES (?, ?, ?, ?, ?, ?)', [nama_wali_akun, email_wali, hashedPassword, nomor_hp_wali_akun, 'Wali Santri', false]);
        const idWaliPengguna = resultWali.insertId;

        const [resultSantri] = await connection.query<OkPacket>('INSERT INTO santri (id_wali, nomor_induk, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, anak_ke, dari_bersaudara, agama, alamat, tanggal_daftar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [idWaliPengguna, nomor_induk, nama_santri, dataLainnya.tempat_lahir_santri, tanggal_lahir_santri, dataLainnya.jenis_kelamin, dataLainnya.anak_ke, dataLainnya.dari_bersaudara, dataLainnya.agama, dataLainnya.alamat_santri, new Date()]);
        const idSantri = resultSantri.insertId;
        
        await connection.query('INSERT INTO orang_tua (id_santri, status_hubungan, nama_lengkap, tempat_lahir, tanggal_lahir, pekerjaan, pendidikan_terakhir, alamat, nomor_hp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [idSantri, 'Ayah', nama_ayah, tempat_lahir_ayah, tanggal_lahir_ayah, pekerjaan_ayah, pendidikan_ayah, alamat_ayah, nomor_hp_ayah]);
        await connection.query('INSERT INTO orang_tua (id_santri, status_hubungan, nama_lengkap, tempat_lahir, tanggal_lahir, pekerjaan, pendidikan_terakhir, alamat, nomor_hp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [idSantri, 'Ibu', nama_ibu, tempat_lahir_ibu, tanggal_lahir_ibu, pekerjaan_ibu, pendidikan_ibu, alamat_ibu, nomor_hp_ibu]);
        
        await connection.commit();
        res.status(201).json({ success: true, data: { message: 'Pendaftaran berhasil. Data Anda akan diverifikasi oleh admin.' } });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error('Ada error saat pendaftaran:', error);
        
        if (error.message.includes('terdaftar')) {
            res.status(409).json({ success: false, error: error.message });
        } else {
            res.status(500).json({ success: false, error: 'Pendaftaran gagal karena kesalahan server.' });
        }
    } finally {
        if (connection) connection.release();
    }
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

        // PERBAIKAN: Check status aktif
        if (user.status_aktif !== 1) {
            console.log("[LOGIN CONTROLLER] GAGAL: Akun tidak aktif.");
            return res.status(403).json({ success: false, error: 'Akun ini tidak aktif.' });
        }
        
        console.log("[LOGIN CONTROLLER] 7. Login berhasil. Mempersiapkan sesi...");
        let sessionPayload;
        const userRole = user.peran.toLowerCase();

        if (userRole === 'santri') {
            // 1. Get santri basic info (including their own ID) using user.id from 'pengguna' table
            const [santriInfo] = await pool.query<RowDataPacket[]>('SELECT id, nama_lengkap FROM santri WHERE id_pengguna = ?', [user.id]);

            if (santriInfo.length === 0) {
                console.log("[LOGIN CONTROLLER] GAGAL: Akun santri tidak tertaut dengan data santri.");
                return res.status(403).json({ success: false, error: 'Akun Pengguna Santri tidak tertaut.' });
            }
            const santriId = santriInfo[0].id;
            const namaSantri = santriInfo[0].nama_lengkap;

            // 2. Get the latest class assignment for that santri
            const [classInfo] = await pool.query<RowDataPacket[]>(
                `SELECT k.nama_kelas, jp.nama_jenjang
                 FROM santri_kelas sk
                 JOIN kelas k ON sk.id_kelas = k.id
                 JOIN jenjang_pendidikan jp ON k.id_jenjang = jp.id
                 WHERE sk.id_santri = ?
                 ORDER BY sk.tahun_ajaran DESC
                 LIMIT 1`,
                [santriId]
            );

            // 3. Prepare session payload
            sessionPayload = {
                id_pengguna: user.id,
                username: user.username,
                nama_santri: namaSantri,
                peran: user.peran as 'Santri',
                id_santri: santriId,
                nama_kelas: classInfo.length > 0 ? classInfo[0].nama_kelas : null,
                nama_jenjang: classInfo.length > 0 ? classInfo[0].nama_jenjang : null,
            };
        } else if (userRole === 'admin') {
            sessionPayload = {
                id_pengguna: user.id, username: user.username, nama_pengguna: user.nama_lengkap,
                peran: user.peran as 'Admin'
            };
        } else if (userRole === 'guru') {
            // Logika guru
            const [guruRows] = await pool.query<GuruRow[]>('SELECT id, jabatan FROM guru WHERE id_pengguna = ?', [user.id]);
            if (guruRows.length === 0) {
                return res.status(403).json({ success: false, error: 'Akun Guru tidak tertaut.' });
            }
            sessionPayload = {
                id_pengguna: user.id, username: user.username, nama_pengguna: user.nama_lengkap,
                peran: user.peran as 'Guru', id_guru: guruRows[0].id, jabatan: guruRows[0].jabatan
            };
        } else if (userRole === 'bendahara') {
            sessionPayload = {
                id_pengguna: user.id, username: user.username, nama_pengguna: user.nama_lengkap,
                peran: user.peran as 'Bendahara'
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
    if (req.session.user) {
        res.status(200).json({ success: true, data: { loggedIn: true, user: req.session.user } });
    } else {
        res.status(200).json({ success: true, data: { loggedIn: false } });
    }
};

export const logout = (req: Request, res: Response) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Gagal menghancurkan sesi:", err);
            return res.status(500).json({ success: false, error: 'Gagal logout.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ success: true, data: { message: 'Logout berhasil.' } });
    });
};