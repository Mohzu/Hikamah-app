// --- IMPORTS ---
import { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, OkPacket } from 'mysql2/promise';
import { z } from 'zod';

// --- INTERFACES & TYPES & SKEMA ZOD ---

export interface RequestWithWaliKelas extends Request {
    id_kelas_wali?: number;
}

// Skema untuk memvalidasi parameter ID
const idSantriParamsSchema = z.object({ id_santri: z.string().regex(/^\d+$/, "ID Santri harus berupa angka") });
const idCatatanParamsSchema = z.object({ id_catatan: z.string().regex(/^\d+$/, "ID Catatan harus berupa angka") });

// Skema untuk body request
const setKenaikanSchema = z.object({
    status_kenaikan: z.enum(['Naik Kelas', 'Tidak Naik Kelas', 'Lulus']),
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY")
});
const catatanPerilakuSchema = z.object({
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY"),
    semester: z.enum(['Ganjil', 'Genap']),
    tanggal_catatan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
    kategori: z.enum(['Positif', 'Negatif', 'Lainnya']),
    deskripsi: z.string().min(1, "Deskripsi harus diisi")
});

// --- FUNGSI MIDDLEWARE ---
export const isWaliKelas = async (req: RequestWithWaliKelas, res: Response, next: NextFunction) => {
    if (!req.session.user || req.session.user.peran !== 'Guru') return res.status(401).json({ success: false, error: "Akses ditolak." });
    
    try {
        const [guruData] = await pool.query<RowDataPacket[] & { id: number }[]>('SELECT id FROM guru WHERE id_pengguna = ?', [req.session.user.id_pengguna]);
        if (guruData.length === 0) return res.status(403).json({ success: false, error: "Profil guru tidak ditemukan." });
        
        const [kelasData] = await pool.query<RowDataPacket[] & { id: number }[]>('SELECT id FROM kelas WHERE id_wali_kelas = ?', [guruData[0].id]);
        if (kelasData.length === 0) return res.status(403).json({ success: false, error: "Anda bukan Wali Kelas dari kelas manapun." });

        req.id_kelas_wali = kelasData[0].id;
        next();
    } catch (error) {
        res.status(500).json({ success: false, error: "Gagal memverifikasi status wali kelas." });
    }
};

// --- FUNGSI CONTROLLER ---

export const getSantriByWaliKelas = async (req: RequestWithWaliKelas, res: Response) => {
    const id_kelas = req.id_kelas_wali;
    const tahun_ajaran = String(req.query.tahun_ajaran || new Date().getFullYear());
    try {
        const query = `
            SELECT s.id, s.nama_lengkap, s.nisn, s.foto_profil, jp.nama_jenjang, k.nama_kelas
            FROM santri s
            JOIN santri_kelas sk ON s.id = sk.id_santri
            JOIN kelas k ON sk.id_kelas = k.id
            JOIN jenjang_pendidikan jp ON k.id_jenjang = jp.id
            WHERE sk.id_kelas = ? AND sk.tahun_ajaran = ? ORDER BY s.nama_lengkap ASC`;
        const [santriList] = await pool.query<RowDataPacket[]>(query, [id_kelas, tahun_ajaran]);
        res.status(200).json({ success: true, data: santriList });
    } catch (error: any) {
        res.status(500).json({ success: false, error: "Gagal mengambil data santri." });
    }
};

export const setKenaikanKelas = async (req: RequestWithWaliKelas, res: Response) => {
    const paramsValidation = idSantriParamsSchema.safeParse(req.params);
    const bodyValidation = setKenaikanSchema.safeParse(req.body);
    if (!paramsValidation.success || !bodyValidation.success) return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid." });

    const id_kelas_wali = req.id_kelas_wali;
    const { id_santri } = paramsValidation.data;
    const { status_kenaikan, tahun_ajaran } = bodyValidation.data;
    
    try {
        const [result] = await pool.query<OkPacket>('UPDATE santri_kelas SET status_kenaikan = ? WHERE id_santri = ? AND id_kelas = ? AND tahun_ajaran = ?', [status_kenaikan, id_santri, id_kelas_wali, tahun_ajaran]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Santri tidak ditemukan di kelas Anda pada tahun ajaran ini." });
        
        res.status(200).json({ success: true, data: { message: `Status kenaikan untuk santri berhasil ditetapkan.` } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: "Gagal menetapkan status kenaikan." });
    }
};

export const createCatatanPerilaku = async (req: RequestWithWaliKelas, res: Response) => {
    const paramsValidation = idSantriParamsSchema.safeParse(req.params);
    const bodyValidation = catatanPerilakuSchema.safeParse(req.body);
    if (!paramsValidation.success || !bodyValidation.success) return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid." });

    const { id_santri } = req.params;
    const { id_pengguna } = req.session.user!;
    const { tahun_ajaran, semester, tanggal_catatan, kategori, deskripsi } = req.body;

    try {
        const [guruData] = await pool.query<{ id: number }[] & RowDataPacket[]>('SELECT id FROM guru WHERE id_pengguna = ?', [id_pengguna]);
        if (guruData.length === 0) return res.status(404).json({ success: false, error: "Profil guru tidak ditemukan." });
        
        const id_guru = guruData[0].id;
        
        // --- TAMBAHKAN LOGGING DI SINI ---
        console.log(`[DEBUG] Menambahkan catatan untuk Santri ID: ${id_santri}, oleh Guru ID: ${id_guru}`);

        const sql = 'INSERT INTO catatan_perilaku (id_santri, id_guru, tahun_ajaran, semester, tanggal_catatan, kategori, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [id_santri, id_guru, tahun_ajaran, semester, tanggal_catatan, kategori, deskripsi];

        console.log(`[DEBUG] Menjalankan query: ${sql} dengan nilai: ${values}`);
        
        await pool.query(sql, values);
        
        res.status(201).json({ success: true, data: { message: "Catatan perilaku berhasil ditambahkan." } });
    } catch (error: any) {
        // --- TAMBAHKAN KODE INI DI SINI ---
        console.error("Error spesifik saat menambahkan catatan perilaku:", error);
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
            return res.status(404).json({ success: false, error: "ID santri atau guru tidak ditemukan di database." });
        }
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, error: "Catatan perilaku untuk santri ini sudah ada pada tanggal yang sama." });
        }
        
        res.status(500).json({ success: false, error: "Gagal menambahkan catatan perilaku." });
    }
};

export const getCatatanPerilaku = async (req: RequestWithWaliKelas, res: Response) => {
    const paramsValidation = idSantriParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) return res.status(400).json({ success: false, error: "Parameter URL tidak valid" });
    
    const { id_santri } = paramsValidation.data;
    try {
        const [catatan] = await pool.query<RowDataPacket[]>('SELECT * FROM catatan_perilaku WHERE id_santri = ? ORDER BY tanggal_catatan DESC', [id_santri]);
        res.status(200).json({ success: true, data: catatan });
    } catch (error: any) {
        res.status(500).json({ success: false, error: "Gagal mengambil catatan perilaku." });
    }
};

export const updateCatatanPerilaku = async (req: RequestWithWaliKelas, res: Response) => {
    const paramsValidation = idCatatanParamsSchema.safeParse(req.params);
    const bodyValidation = catatanPerilakuSchema.pick({ kategori: true, deskripsi: true }).safeParse(req.body);
    if (!paramsValidation.success || !bodyValidation.success) return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid." });

    const { id_catatan } = paramsValidation.data;
    const { kategori, deskripsi } = bodyValidation.data;
    const { id_pengguna } = req.session.user!;
    
    try {
        const [guruData] = await pool.query<{ id: number }[] & RowDataPacket[]>('SELECT id FROM guru WHERE id_pengguna = ?', [id_pengguna]);
        if (guruData.length === 0) return res.status(404).json({ success: false, error: "Profil guru tidak ditemukan." });
        
        const id_guru = guruData[0].id;
        const [result] = await pool.query<OkPacket>('UPDATE catatan_perilaku SET kategori = ?, deskripsi = ? WHERE id = ? AND id_guru = ?', [kategori, deskripsi, id_catatan, id_guru]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Catatan tidak ditemukan atau Anda tidak punya hak edit." });
        
        res.status(200).json({ success: true, data: { message: "Catatan perilaku berhasil diperbarui." } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: "Gagal memperbarui catatan." });
    }
};

export const deleteCatatanPerilaku = async (req: RequestWithWaliKelas, res: Response) => {
    const paramsValidation = idCatatanParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) return res.status(400).json({ success: false, error: "Parameter URL tidak valid" });

    const { id_catatan } = paramsValidation.data;
    const { id_pengguna } = req.session.user!;
    try {
        const [guruData] = await pool.query<{ id: number }[] & RowDataPacket[]>('SELECT id FROM guru WHERE id_pengguna = ?', [id_pengguna]);
        if (guruData.length === 0) return res.status(404).json({ success: false, error: "Profil guru tidak ditemukan." });
        
        const id_guru = guruData[0].id;
        const [result] = await pool.query<OkPacket>('DELETE FROM catatan_perilaku WHERE id = ? AND id_guru = ?', [id_catatan, id_guru]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Catatan tidak ditemukan atau Anda tidak punya hak hapus." });
        
        res.status(200).json({ success: true, data: { message: "Catatan perilaku berhasil dihapus." } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: "Gagal menghapus catatan." });
    }
};