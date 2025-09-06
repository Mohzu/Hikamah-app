// --- IMPORTS ---
import { Request, Response } from 'express';
import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';
import { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';
import { z } from 'zod';

// --- INTERFACES & TYPES & SKEMA ---
interface UnverifiedRow extends RowDataPacket { /*...*/ }
interface SantriForVerification extends RowDataPacket { /*...*/ }
interface SantriForDeletion extends RowDataPacket { /*...*/ }

// Skema untuk memvalidasi parameter ID
const idParamsSchema = z.object({
    id_pendaftaran: z.string().regex(/^\d+$/, "ID Pendaftaran harus berupa angka").optional(),
    id_santri: z.string().regex(/^\d+$/, "ID Santri harus berupa angka").optional(),
});

// Skema untuk body request update NISN
const nisnSchema = z.object({
    nisn: z.string().min(1, "NISN harus diisi").regex(/^\d+$/, "NISN harus berupa angka")
});

// --- FUNGSI CONTROLLER ---

export const getUnverifiedRegistrations = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT s.id, s.nama_lengkap AS nama_santri, p.nama_lengkap AS nama_wali, p.email AS email_wali, s.tanggal_daftar
            FROM santri s
            JOIN pengguna p ON s.id_wali = p.id
            WHERE p.status_aktif = FALSE OR p.status_aktif IS NULL`;
        const [rows] = await pool.query<UnverifiedRow[]>(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
        console.error('Error saat mengambil pendaftaran belum terverifikasi:', error);
        res.status(500).json({ success: false, error: 'Gagal mengambil data pendaftaran.' });
    }
};

// --- FUNGSI getAllSantri YANG DIPERBARUI ---
export const getAllSantri = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                s.*, -- Mengambil semua kolom dari tabel santri
                s.id AS id_santri, -- Alias untuk konsistensi
                s.nama_lengkap AS nama_santri,
                w.nama_lengkap AS nama_wali,
                w.email AS email_wali,
                (
                    SELECT k.nama_kelas 
                    FROM kelas k 
                    JOIN santri_kelas sk ON k.id = sk.id_kelas 
                    WHERE sk.id_santri = s.id 
                    ORDER BY sk.tahun_ajaran DESC 
                    LIMIT 1
                ) AS nama_kelas,
                (
                    SELECT jp.nama_jenjang 
                    FROM jenjang_pendidikan jp 
                    JOIN kelas k ON jp.id = k.id_jenjang 
                    JOIN santri_kelas sk ON k.id = sk.id_kelas 
                    WHERE sk.id_santri = s.id 
                    ORDER BY sk.tahun_ajaran DESC 
                    LIMIT 1
                ) AS nama_jenjang,
                ayah.nama_lengkap AS nama_ayah,
                ayah.pekerjaan AS pekerjaan_ayah,
                ayah.nomor_hp AS nomor_hp_ayah,
                ibu.nama_lengkap AS nama_ibu,
                ibu.pekerjaan AS pekerjaan_ibu,
                ibu.nomor_hp AS nomor_hp_ibu
            FROM santri s
            LEFT JOIN pengguna w ON s.id_wali = w.id
            LEFT JOIN orang_tua ayah ON s.id = ayah.id_santri AND ayah.status_hubungan = 'Ayah'
            LEFT JOIN orang_tua ibu ON s.id = ibu.id_santri AND ibu.status_hubungan = 'Ibu'
            WHERE s.id_pengguna IS NOT NULL -- Hanya ambil santri yang sudah punya akun (terverifikasi)
            ORDER BY s.nama_lengkap ASC`;
            
        const [santriList] = await pool.query<RowDataPacket[]>(query);
        
        // Mengirimkan data sebagai flat array, bukan lagi dikelompokkan
        res.status(200).json({ success: true, data: santriList });

    } catch (error: any) {
        console.error('Error saat mengambil semua data santri:', error);
        res.status(500).json({ success: false, error: 'Gagal mengambil data semua santri.' });
    }
};

export const verifyRegistration = async (req: Request, res: Response) => {
    const paramsValidation = idParamsSchema.safeParse(req.params);
    if (!paramsValidation.success || !paramsValidation.data.id_pendaftaran) return res.status(400).json({ success: false, error: "Parameter ID Pendaftaran tidak valid" });
    
    const { id_pendaftaran } = paramsValidation.data;
    let connection: PoolConnection | undefined;

    try {
        const query = `
            SELECT s.id, s.nama_lengkap AS nama_santri, s.tanggal_lahir, p.id AS id_wali 
            FROM santri s JOIN pengguna p ON s.id_wali = p.id 
            WHERE s.id = ? AND (p.status_aktif = FALSE OR p.status_aktif IS NULL)`;
        const [santriData] = await pool.query<SantriForVerification[]>(query, [id_pendaftaran]);
        if (santriData.length === 0) return res.status(404).json({ success: false, error: 'Data pendaftaran tidak ditemukan atau sudah diverifikasi.' });
        
        const santri = santriData[0];
        connection = await pool.getConnection();
        if (!connection) throw new Error('Failed to obtain a database connection.');
        await connection.beginTransaction();

        // Logika pembuatan username unik Anda sudah benar
        let baseUsername = santri.nama_santri.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
        let finalUsername = baseUsername;
        let isUnique = false, counter = 0;
        while (!isUnique) {
            const [existingUser] = await connection.query<RowDataPacket[]>('SELECT id FROM pengguna WHERE username = ?', [finalUsername]);
            if (existingUser.length === 0) isUnique = true;
            else { counter++; finalUsername = `${baseUsername}${counter}`; }
        }
        
        const passwordSantri = new Date(santri.tanggal_lahir).toISOString().slice(0, 10).replace(/-/g, '');
        const hashedPasswordSantri = await bcrypt.hash(passwordSantri, 10);
        
        const [resultPenggunaSantri] = await connection.query<OkPacket>('INSERT INTO pengguna (nama_lengkap, username, kata_sandi, peran, status_aktif) VALUES (?, ?, ?, ?, ?)', [santri.nama_santri, finalUsername, hashedPasswordSantri, 'Santri', true]);
        const idPenggunaSantri = resultPenggunaSantri.insertId;

        await connection.query('UPDATE santri SET id_pengguna = ? WHERE id = ?', [idPenggunaSantri, id_pendaftaran]);
        await connection.query('UPDATE pengguna SET status_aktif = TRUE WHERE id = ?', [santri.id_wali]);
        
        await connection.commit();
        res.status(200).json({ success: true, data: { message: 'Pendaftaran berhasil diverifikasi.', username: finalUsername, password: passwordSantri }});
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error('Error verifikasi:', error);
        res.status(500).json({ success: false, error: 'Verifikasi gagal.' });
    } finally {
        if (connection) connection.release();
    }
};

export const updateNisn = async (req: Request, res: Response) => {
    const paramsValidation = idParamsSchema.safeParse(req.params);
    const bodyValidation = nisnSchema.safeParse(req.body);
    if (!paramsValidation.success || !paramsValidation.data.id_santri || !bodyValidation.success) {
        return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid" });
    }

    const { id_santri } = paramsValidation.data;
    const { nisn } = bodyValidation.data;
    try {
        const [nisnCheck] = await pool.query<RowDataPacket[]>('SELECT id FROM santri WHERE nisn = ? AND id != ?', [nisn, id_santri]);
        if (nisnCheck.length > 0) return res.status(409).json({ success: false, error: 'NISN ini sudah digunakan.' });

        const [result] = await pool.query<OkPacket>('UPDATE santri SET nisn = ? WHERE id = ?', [nisn, id_santri]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: `Santri dengan ID ${id_santri} tidak ditemukan.` });

        res.status(200).json({ success: true, data: { message: 'NISN berhasil diperbarui.' } });
    } catch (error: any) {
        console.error('Error saat update NISN:', error);
        res.status(500).json({ success: false, error: 'Gagal memperbarui NISN.' });
    }
};

export const deleteSantri = async (req: Request, res: Response) => {
    const paramsValidation = idParamsSchema.safeParse(req.params);
    if (!paramsValidation.success || !paramsValidation.data.id_santri) return res.status(400).json({ success: false, error: "Parameter ID Santri tidak valid" });

    const { id_santri } = paramsValidation.data;
    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        if (!connection) throw new Error('Failed to obtain a database connection.');
        await connection.beginTransaction();

        const [santriData] = await connection.query<SantriForDeletion[]>('SELECT id_pengguna, id_wali FROM santri WHERE id = ?', [id_santri]);
        if (santriData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Santri tidak ditemukan.' });
        }
        const { id_pengguna: id_pengguna_santri, id_wali: id_pengguna_wali } = santriData[0];
        
        // Logika penghapusan berurutan Anda sudah benar
        await connection.query('DELETE FROM absensi WHERE id_santri = ?', [id_santri]);
        await connection.query('DELETE FROM nilai WHERE id_santri = ?', [id_santri]);
        await connection.query('DELETE FROM catatan_perilaku WHERE id_santri = ?', [id_santri]);
        await connection.query('DELETE FROM santri_kelas WHERE id_santri = ?', [id_santri]);
        await connection.query('DELETE FROM orang_tua WHERE id_santri = ?', [id_santri]);
        await connection.query('DELETE FROM santri WHERE id = ?', [id_santri]);
        if (id_pengguna_santri) await connection.query('DELETE FROM pengguna WHERE id = ?', [id_pengguna_santri]);
        if (id_pengguna_wali) await connection.query('DELETE FROM pengguna WHERE id = ?', [id_pengguna_wali]);

        await connection.commit();
        res.status(200).json({ success: true, data: { message: `Santri dan semua data terkait berhasil dihapus.` } });
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error('Error saat menghapus santri:', error);
        res.status(500).json({ success: false, error: 'Gagal menghapus data santri.' });
    } finally {
        if (connection) connection.release();
    }
};