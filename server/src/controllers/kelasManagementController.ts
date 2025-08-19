// --- IMPORTS ---
import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2/promise';
import { z } from 'zod';

// --- INTERFACES & SKEMA ZOD ---
interface KelasRow extends RowDataPacket { id_wali_kelas: number | null; }

// Skema untuk parameter ID
const idKelasParamsSchema = z.object({ id_kelas: z.string().regex(/^\d+$/, "ID kelas harus berupa angka") });
const removeSantriParamsSchema = z.object({
    id_kelas: z.string().regex(/^\d+$/, "ID kelas harus berupa angka"),
    id_santri: z.string().regex(/^\d+$/, "ID santri harus berupa angka")
});

// Skema untuk body request
const createKelasSchema = z.object({
    nama_kelas: z.string().min(1, "Nama kelas harus diisi"),
    id_jenjang: z.number().int().positive("ID Jenjang harus angka positif")
});
const assignWaliSchema = z.object({ id_guru: z.number().int().positive("ID Guru harus angka positif") });
const assignSantriSchema = z.object({
    id_santri: z.number().int().positive("ID Santri harus angka positif"),
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY")
});
const removeSantriSchema = z.object({ tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY") });

// --- FUNGSI CONTROLLER ---

export const createKelas = async (req: Request, res: Response) => {
    const validation = createKelasSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, error: "Data tidak valid", details: validation.error.flatten().fieldErrors });

    const { nama_kelas, id_jenjang } = validation.data;
    try {
        await pool.query('INSERT INTO kelas (nama_kelas, id_jenjang) VALUES (?, ?)', [nama_kelas, id_jenjang]);
        res.status(201).json({ success: true, data: { message: `Kelas '${nama_kelas}' berhasil dibuat.` } });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: "Nama kelas ini sudah ada." });
        console.error("Error saat membuat kelas:", error);
        res.status(500).json({ success: false, error: "Gagal membuat kelas." });
    }
};

export const assignWaliKelas = async (req: Request, res: Response) => {
    const paramsValidation = idKelasParamsSchema.safeParse(req.params);
    const bodyValidation = assignWaliSchema.safeParse(req.body);
    if (!paramsValidation.success || !bodyValidation.success) return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid" });
    
    const { id_kelas } = paramsValidation.data;
    const { id_guru } = bodyValidation.data;
    try {
        // Logika asli Anda sudah benar
        await pool.query("UPDATE guru SET jabatan = 'Wali Kelas' WHERE id = ?", [id_guru]);
        await pool.query("UPDATE kelas SET id_wali_kelas = ? WHERE id = ?", [id_guru, id_kelas]);
        res.status(200).json({ success: true, data: { message: "Wali kelas berhasil ditetapkan." } });
    } catch (error: any) {
        console.error("Error saat menetapkan wali kelas:", error);
        res.status(500).json({ success: false, error: "Gagal menetapkan wali kelas." });
    }
};

export const unassignWaliKelas = async (req: Request, res: Response) => {
    const paramsValidation = idKelasParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) return res.status(400).json({ success: false, error: "Parameter URL tidak valid", details: paramsValidation.error.flatten().fieldErrors });
    
    const { id_kelas } = paramsValidation.data;
    try {
        const [kelasData] = await pool.query<KelasRow[]>('SELECT id_wali_kelas FROM kelas WHERE id = ?', [id_kelas]);
        if (kelasData.length === 0 || !kelasData[0].id_wali_kelas) return res.status(404).json({ success: false, error: "Kelas tidak ditemukan atau tidak memiliki wali kelas." });
        
        const id_guru = kelasData[0].id_wali_kelas;
        // Logika asli Anda sudah benar
        await pool.query('UPDATE kelas SET id_wali_kelas = NULL WHERE id = ?', [id_kelas]);
        await pool.query("UPDATE guru SET jabatan = 'Guru Mapel' WHERE id = ?", [id_guru]);
        res.status(200).json({ success: true, data: { message: "Jabatan wali kelas berhasil dilepaskan." } });
    } catch (error: any) {
        console.error("Error saat melepaskan jabatan wali kelas:", error);
        res.status(500).json({ success: false, error: "Gagal melepaskan jabatan wali kelas." });
    }
};

export const assignSantriToKelas = async (req: Request, res: Response) => {
    const paramsValidation = idKelasParamsSchema.safeParse(req.params);
    const bodyValidation = assignSantriSchema.safeParse(req.body);
    if (!paramsValidation.success || !bodyValidation.success) return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid" });
    
    const { id_kelas } = paramsValidation.data;
    const { id_santri, tahun_ajaran } = bodyValidation.data;
    try {
        // Query asli Anda sudah benar dan efisien
        const sql = 'INSERT INTO santri_kelas (id_santri, id_kelas, tahun_ajaran) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id_kelas = VALUES(id_kelas)';
        await pool.query(sql, [id_santri, id_kelas, tahun_ajaran]);
        res.status(200).json({ success: true, data: { message: "Santri berhasil ditempatkan di kelas." } });
    } catch (error: any) {
        console.error("Error saat menempatkan santri:", error);
        res.status(500).json({ success: false, error: "Gagal menempatkan santri." });
    }
};

export const removeSantriFromKelas = async (req: Request, res: Response) => {
    const paramsValidation = removeSantriParamsSchema.safeParse(req.params);
    const bodyValidation = removeSantriSchema.safeParse(req.body);
    if (!paramsValidation.success || !bodyValidation.success) return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid" });
    
    const { id_kelas, id_santri } = paramsValidation.data;
    const { tahun_ajaran } = bodyValidation.data;
    try {
        const [result] = await pool.query<OkPacket>('DELETE FROM santri_kelas WHERE id_santri = ? AND id_kelas = ? AND tahun_ajaran = ?', [id_santri, id_kelas, tahun_ajaran]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Data penempatan santri di kelas ini tidak ditemukan." });
        
        res.status(200).json({ success: true, data: { message: "Santri berhasil dihapus dari kelas." } });
    } catch (error: any) {
        console.error("Error saat menghapus santri dari kelas:", error);
        res.status(500).json({ success: false, error: "Gagal menghapus santri dari kelas." });
    }
};

export const deleteKelas = async (req: Request, res: Response) => {
    const paramsValidation = idKelasParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) return res.status(400).json({ success: false, error: "Parameter URL tidak valid", details: paramsValidation.error.flatten().fieldErrors });
    
    const { id_kelas } = paramsValidation.data;
    try {
        const [result] = await pool.query<OkPacket>('DELETE FROM kelas WHERE id = ?', [id_kelas]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: `Kelas dengan ID ${id_kelas} tidak ditemukan.` });
        
        res.status(200).json({ success: true, data: { message: `Kelas berhasil dihapus.` } });
    } catch (error: any) {
        console.error("Error saat menghapus kelas:", error);
        res.status(500).json({ success: false, error: "Gagal menghapus kelas." });
    }
};