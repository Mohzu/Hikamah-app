// --- IMPORTS ---
import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';
import { z } from 'zod'; // Impor Zod

// --- INTERFACES & TYPES ---
// Interface ini masih berguna untuk memberi tipe pada hasil query dari database
interface GuruListItem extends RowDataPacket {
    id_guru: number;
    id_pengguna: number;
    nama_lengkap: string;
    username: string;
    email: string;
    jabatan: string;
}

interface WaliKelasRow extends RowDataPacket {
    id_kelas: number;
    nama_kelas: string;
    nama_jenjang: string;
    id_guru: number | null;
    nama_wali_kelas: string | null;
    username_wali_kelas: string | null;
}

type IdGuruParams = { id_guru: string };

// --- SKEMA VALIDASI ZOD ---
// Satu skema ini akan kita gunakan untuk membuat dan mengupdate data guru.
const guruSchema = z.object({
    nama_lengkap: z.string({ required_error: "Nama lengkap harus diisi" }).min(3, { message: "Nama lengkap minimal 3 karakter" }),
    username: z.string().min(3, { message: "Username minimal 3 karakter" }),
    email: z.string().email({ message: "Format email tidak valid" }),
    tanggal_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal lahir harus YYYY-MM-DD" }),
    jabatan: z.string().min(1, { message: "Jabatan harus diisi" }),
    // Properti opsional kita definisikan sebagai nullable agar bisa di-handle oleh DB
    tempat_lahir: z.string().optional().nullable(),
    alamat: z.string().optional().nullable(),
    tahun_mengajar: z.number().int().positive().optional().nullable(),
    pendidikan_tertinggi: z.string().optional().nullable(),
});


// --- FUNGSI CONTROLLER ---

// Admin: Membuat Akun Guru Baru
export const createGuru = async (req: Request, res: Response) => {
    const validationResult = guruSchema.safeParse(req.body);

    if (!validationResult.success) {
        return res.status(400).json({ 
            success: false,
            error: "Data yang dikirim tidak valid",
            details: validationResult.error.flatten().fieldErrors 
        });
    }

    const { 
        nama_lengkap, username, email, tanggal_lahir, tempat_lahir, 
        alamat, tahun_mengajar, pendidikan_tertinggi, jabatan 
    } = validationResult.data;

    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        if (!connection) {
            throw new Error("Gagal mendapatkan koneksi database.");
        }
        await connection.beginTransaction();

        const [existingUser] = await connection.query<RowDataPacket[]>('SELECT id FROM pengguna WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, error: "Username atau email sudah digunakan." });
        }

        const defaultPassword = tanggal_lahir.replace(/-/g, '');
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const [resultPengguna] = await connection.query<OkPacket>('INSERT INTO pengguna (nama_lengkap, username, email, kata_sandi, peran, status_aktif) VALUES (?, ?, ?, ?, ?, ?)', [nama_lengkap, username, email, hashedPassword, 'Guru', true]);
        const idPenggunaGuru = resultPengguna.insertId;

        await connection.query('INSERT INTO guru (id_pengguna, tempat_lahir, tanggal_lahir, alamat, tahun_mengajar, pendidikan_tertinggi, jabatan) VALUES (?, ?, ?, ?, ?, ?, ?)', [idPenggunaGuru, tempat_lahir, tanggal_lahir, alamat, tahun_mengajar, pendidikan_tertinggi, jabatan]);

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            data: {
                message: `Akun untuk guru ${nama_lengkap} berhasil dibuat.`, 
                username, 
                password: defaultPassword 
            }
        });
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("Error saat membuat akun guru:", error);
        res.status(500).json({ success: false, error: "Gagal membuat akun guru karena kesalahan server." });
    } finally {
        if (connection) connection.release();
    }
};

// Admin: Mendapatkan Daftar Semua Guru
export const getAllGuru = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT g.id AS id_guru, p.id AS id_pengguna, p.nama_lengkap, p.username, p.email, g.jabatan
            FROM guru g JOIN pengguna p ON g.id_pengguna = p.id
            ORDER BY p.nama_lengkap ASC`;
        const [guruList] = await pool.query<GuruListItem[]>(query);
        res.status(200).json({ success: true, data: guruList });
    } catch (error: any) {
        console.error("Error saat mengambil data guru:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil data guru." });
    }
};

// Admin: Mengupdate Data Guru
export const updateGuru = async (req: Request<IdGuruParams>, res: Response) => {
    // 1. Validasi input body menggunakan skema Zod yang sama
    const validationResult = guruSchema.safeParse(req.body);

    if (!validationResult.success) {
        return res.status(400).json({ 
            success: false,
            error: "Data yang dikirim tidak valid",
            details: validationResult.error.flatten().fieldErrors 
        });
    }

    const { id_guru } = req.params;
    // 2. Gunakan data yang sudah bersih dan aman dari Zod
    const { 
        nama_lengkap, username, email, tempat_lahir, tanggal_lahir, 
        alamat, tahun_mengajar, pendidikan_tertinggi, jabatan 
    } = validationResult.data;

    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        if (!connection) {
            throw new Error("Gagal mendapatkan koneksi database.");
        }
        await connection.beginTransaction();

        const [guruData] = await connection.query<{ id_pengguna: number }[] & RowDataPacket[]>('SELECT id_pengguna FROM guru WHERE id = ?', [id_guru]);
        if (guruData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: "Data guru tidak ditemukan." });
        }
        const id_pengguna = guruData[0].id_pengguna;

        await connection.query('UPDATE pengguna SET nama_lengkap = ?, username = ?, email = ? WHERE id = ?', [nama_lengkap, username, email, id_pengguna]);
        await connection.query('UPDATE guru SET tempat_lahir = ?, tanggal_lahir = ?, alamat = ?, tahun_mengajar = ?, pendidikan_tertinggi = ?, jabatan = ? WHERE id = ?', [tempat_lahir, tanggal_lahir, alamat, tahun_mengajar, pendidikan_tertinggi, jabatan, id_guru]);

        await connection.commit();
        res.status(200).json({ success: true, data: { message: "Data guru berhasil diperbarui." } });
    } catch (error: any) {
        if (connection) await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "Username atau email sudah digunakan oleh pengguna lain." });
        }
        console.error("Error saat update data guru:", error);
        res.status(500).json({ success: false, error: "Gagal update data guru karena kesalahan server." });
    } finally {
        if (connection) connection.release();
    }
};

// Admin: Menghapus Data Guru
export const deleteGuru = async (req: Request<IdGuruParams>, res: Response) => {
    const { id_guru } = req.params;
    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        if (!connection) {
            throw new Error("Gagal mendapatkan koneksi database.");
        }
        await connection.beginTransaction();

        const [guruData] = await connection.query<{ id_pengguna: number }[] & RowDataPacket[]>('SELECT id_pengguna FROM guru WHERE id = ?', [id_guru]);
        if (guruData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: "Data guru tidak ditemukan." });
        }
        const id_pengguna = guruData[0].id_pengguna;

        await connection.query('DELETE FROM guru WHERE id = ?', [id_guru]);
        await connection.query('DELETE FROM pengguna WHERE id = ?', [id_pengguna]);

        await connection.commit();
        res.status(200).json({ success: true, data: { message: "Data guru dan akun pengguna terkait berhasil dihapus." } });
    } catch (error: any) {
        if (connection) await connection.rollback();
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ success: false, error: "Gagal menghapus. Guru ini masih memiliki catatan nilai yang terhubung." });
        }
        console.error("Error saat hapus guru:", error);
        res.status(500).json({ success: false, error: "Gagal menghapus guru karena kesalahan server." });
    } finally {
        if (connection) connection.release();
    }
};


// Admin: Melihat Daftar Semua Wali Kelas
export const getAllWaliKelas = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT k.id AS id_kelas, k.nama_kelas, jp.nama_jenjang, g.id AS id_guru,
                   p.nama_lengkap AS nama_wali_kelas, p.username AS username_wali_kelas
            FROM kelas k
            JOIN jenjang_pendidikan jp ON k.id_jenjang = jp.id
            LEFT JOIN guru g ON k.id_wali_kelas = g.id
            LEFT JOIN pengguna p ON g.id_pengguna = p.id
            ORDER BY jp.id, k.nama_kelas ASC`;

        const [waliKelasList] = await pool.query<WaliKelasRow[]>(query);

        const groupedByJenjang = waliKelasList.reduce((acc, item) => {
            const jenjang = item.nama_jenjang;
            if (!acc[jenjang]) {
                acc[jenjang] = [];
            }
            acc[jenjang].push({
                id_kelas: item.id_kelas,
                nama_kelas: item.nama_kelas,
                id_guru: item.id_guru,
                nama_wali_kelas: item.nama_wali_kelas
            });
            return acc;
        }, {} as Record<string, any[]>);

        res.status(200).json(groupedByJenjang);
    } catch (error: any) {
        console.error("Error saat mengambil data wali kelas:", error);
        res.status(500).json({ message: "Gagal mengambil data wali kelas." });
    }
};