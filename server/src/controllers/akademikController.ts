// src/controllers/akademikController.ts

// --- IMPORTS ---
import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2/promise';
import { z } from 'zod';

// --- INTERFACES & SKEMA ---
interface MataPelajaran extends RowDataPacket { /*...*/ }
interface JadwalDetail extends RowDataPacket { /*...*/ }

// Skema untuk memvalidasi ID numerik dari req.params
const idParamSchema = z.object({ id: z.string().regex(/^\d+$/, "ID harus berupa angka") });
const multiIdParamSchema = z.object({
    id_kelas: z.string().regex(/^\d+$/, "ID kelas harus berupa angka"),
    id_mapel: z.string().regex(/^\d+$/, "ID mapel harus berupa angka"),
});
const idGuruParamSchema = z.object({ id_guru: z.string().regex(/^\d+$/, "ID Guru harus berupa angka") });

// Skema untuk body request
const mapelSchema = z.object({
    nama_mapel: z.string().min(1, "Nama mata pelajaran harus diisi"),
    deskripsi: z.string().optional().nullable()
});
// SKEMA UNTUK MENUGASKAN GURU
const assignGuruSchema = z.object({
    id_guru: z.number().int().positive("ID Guru harus angka positif"),
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY"),
    hari: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], { message: "Hari tidak valid." }),
    waktu_mulai: z.string().regex(/^\d{2}:\d{2}$/, "Format waktu mulai harus HH:MM"),
    waktu_selesai: z.string().regex(/^\d{2}:\d{2}$/, "Format waktu selesai harus HH:MM"),
});
const idJadwalParamsSchema = z.object({ id_jadwal: z.string().regex(/^\d+$/, "ID jadwal harus berupa angka") });

const updateJadwalSchema = z.object({
    id_guru: z.number().int().positive("ID Guru harus angka positif").optional(),
    id_mapel: z.number().int().positive("ID Mapel harus angka positif").optional(),
    id_kelas: z.number().int().positive("ID Kelas harus angka positif").optional(),
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY").optional(),
    hari: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], { message: "Hari tidak valid." }).optional(),
    waktu_mulai: z.string().regex(/^\d{2}:\d{2}$/, "Format waktu mulai harus HH:MM").optional(),
    waktu_selesai: z.string().regex(/^\d{2}:\d{2}$/, "Format waktu selesai harus HH:MM").optional(),
}).refine(data => Object.keys(data).length > 0, { message: "Setidaknya satu field harus diisi untuk update." });

// --- FUNGSI CONTROLLER ---

// --- MANAJEMEN MATA PELAJARAN ---

export const createMapel = async (req: Request, res: Response) => {
    const validation = mapelSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, error: "Data tidak valid", details: validation.error.flatten().fieldErrors });
    
    const { nama_mapel, deskripsi } = validation.data;
    try {
        await pool.query('INSERT INTO mata_pelajaran (nama_mapel, deskripsi) VALUES (?, ?)', [nama_mapel, deskripsi]);
        res.status(201).json({ success: true, data: { message: `Mata pelajaran '${nama_mapel}' berhasil dibuat.` } });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: "Mata pelajaran ini sudah ada." });
        res.status(500).json({ success: false, error: "Gagal membuat mata pelajaran." });
    }
};

export const getAllMapel = async (req: Request, res: Response) => {
    try {
        const [mapels] = await pool.query<MataPelajaran[]>('SELECT * FROM mata_pelajaran ORDER BY nama_mapel ASC');
        res.status(200).json({ success: true, data: mapels });
    } catch (error: any) {
        res.status(500).json({ success: false, error: "Gagal mengambil data mata pelajaran." });
    }
};

export const deleteMapel = async (req: Request<{ id_mapel: string }>, res: Response) => {
    const { id_mapel } = req.params;
    try {
        const [result] = await pool.query<OkPacket>('DELETE FROM mata_pelajaran WHERE id = ?', [id_mapel]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: `Mata pelajaran dengan ID ${id_mapel} tidak ditemukan.` });
        res.status(200).json({ success: true, data: { message: "Mata pelajaran berhasil dihapus." } });
    } catch (error: any) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ success: false, error: "Gagal menghapus. Mata pelajaran ini masih memiliki catatan nilai." });
        res.status(500).json({ success: false, error: "Gagal menghapus mata pelajaran." });
    }
};

// --- MANAJEMEN KURIKULUM ---

export const addMapelToJenjang = async (req: Request<{ id_jenjang: string }>, res: Response) => {
    const validation = z.object({ id_mapel: z.number().int().positive() }).safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, error: "Data tidak valid", details: validation.error.flatten().fieldErrors });

    const { id_jenjang } = req.params;
    const { id_mapel } = validation.data;
    try {
        await pool.query('INSERT INTO kurikulum (id_mapel, id_jenjang) VALUES (?, ?)', [id_mapel, id_jenjang]);
        res.status(201).json({ success: true, data: { message: "Mata pelajaran berhasil ditambahkan ke kurikulum." } });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: "Mata pelajaran ini sudah ada di kurikulum jenjang ini." });
        res.status(500).json({ success: false, error: "Gagal menambahkan mata pelajaran." });
    }
};

// --- MANAJEMEN JADWAL MENGAJAR ---

export const assignGuruToJadwal = async (req: Request<{ id_kelas: string, id_mapel: string }>, res: Response) => {
    const paramsValidation = multiIdParamSchema.safeParse(req.params);
    const bodyValidation = assignGuruSchema.safeParse(req.body);
    if (!paramsValidation.success || !bodyValidation.success) {
        return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid" });
    }

    const { id_kelas, id_mapel } = paramsValidation.data;
    const { id_guru, tahun_ajaran, hari, waktu_mulai, waktu_selesai } = bodyValidation.data;
    
    try {
        const [guru] = await pool.query('SELECT id FROM guru WHERE id = ?', [id_guru]);
        const [mapel] = await pool.query('SELECT id FROM mata_pelajaran WHERE id = ?', [id_mapel]);
        const [kelas] = await pool.query('SELECT id FROM kelas WHERE id = ?', [id_kelas]);

        if (guru.length === 0 || mapel.length === 0 || kelas.length === 0) {
            return res.status(404).json({ success: false, error: "ID guru, mata pelajaran, atau kelas tidak ditemukan." });
        }
        
        await pool.query("UPDATE guru SET jabatan = 'Guru Mapel' WHERE id = ?", [id_guru]);

        const sql = 'INSERT INTO jadwal_mengajar (id_guru, id_mapel, id_kelas, tahun_ajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, ?, ?, ?, ?, ?)';
        await pool.query(sql, [id_guru, id_mapel, id_kelas, tahun_ajaran, hari, waktu_mulai, waktu_selesai]);
        
        res.status(201).json({ success: true, data: { message: "Guru berhasil ditugaskan." } });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "Penugasan guru untuk mata pelajaran dan kelas ini sudah ada." });
        }
        console.error("Error saat menugaskan guru:", error);
        res.status(500).json({ success: false, error: "Gagal menugaskan guru." });
    }
};

export const updateGuruOnJadwal = async (req: Request<{ id_jadwal: string }>, res: Response) => {
    const validation = z.object({ id_guru_baru: z.number().int().positive() }).safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, error: "Data tidak valid", details: validation.error.flatten().fieldErrors });
    
    const { id_jadwal } = req.params;
    const { id_guru_baru } = validation.data;
    
    try {
        const [guruBaru] = await pool.query('SELECT id FROM guru WHERE id = ?', [id_guru_baru]);
        if (guruBaru.length === 0) {
            return res.status(404).json({ success: false, error: "ID guru baru tidak ditemukan." });
        }

        const [result] = await pool.query<OkPacket>('UPDATE jadwal_mengajar SET id_guru = ? WHERE id = ?', [id_guru_baru, id_jadwal]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: `Jadwal dengan ID ${id_jadwal} tidak ditemukan.` });
        }
        
        await pool.query("UPDATE guru SET jabatan = 'Guru Mapel' WHERE id = ?", [id_guru_baru]);
        
        res.status(200).json({ success: true, data: { message: "Guru pengajar berhasil diubah." } });
    } catch (error: any) {
        console.error("Error saat mengupdate guru di jadwal:", error);
        res.status(500).json({ success: false, error: "Gagal mengupdate guru di jadwal." });
    }
};

export const deleteJadwal = async (req: Request<{ id_jadwal: string }>, res: Response) => {
    const { id_jadwal } = req.params;
    try {
        const [result] = await pool.query<OkPacket>('DELETE FROM jadwal_mengajar WHERE id = ?', [id_jadwal]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: `Jadwal dengan ID ${id_jadwal} tidak ditemukan.` });
        res.status(200).json({ success: true, data: { message: "Jadwal mengajar berhasil dihapus." } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: "Gagal menghapus jadwal." });
    }
};

export const getAllJadwal = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT
                jm.id AS id_jadwal,
                jm.tahun_ajaran,
                k.nama_kelas,
                mp.nama_mapel,
                p.nama_lengkap AS nama_guru,
                jm.hari,
                jm.waktu_mulai,
                jm.waktu_selesai
            FROM jadwal_mengajar jm
            JOIN kelas k ON jm.id_kelas = k.id
            JOIN mata_pelajaran mp ON jm.id_mapel = mp.id
            JOIN guru g ON jm.id_guru = g.id
            JOIN pengguna p ON g.id_pengguna = p.id
            ORDER BY FIELD(jm.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), jm.waktu_mulai ASC
        `;
        
        const [jadwalList] = await pool.query<JadwalDetail[]>(query);
        
        if (jadwalList.length === 0) {
            return res.status(200).json({ success: true, data: {} });
        }
        
        const groupedJadwal = jadwalList.reduce((acc, item) => {
            const key = `${item.nama_kelas} (${item.tahun_ajaran})`;
            if (!acc[key]) acc[key] = {};
            
            if (!acc[key][item.hari]) acc[key][item.hari] = [];
            
            acc[key][item.hari].push({
                id_jadwal: item.id_jadwal,
                nama_mapel: item.nama_mapel,
                nama_guru: item.nama_guru,
                waktu_mulai: item.waktu_mulai,
                waktu_selesai: item.waktu_selesai
            });
            
            return acc;
        }, {} as Record<string, any[]>);

        res.status(200).json({ success: true, data: groupedJadwal });
    } catch (error: any) {
        console.error("Error saat mengambil semua jadwal mengajar:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil semua jadwal mengajar." });
    }
};

export const updateJadwalMengajar = async (req: Request, res: Response) => {
    const idJadwalParamsSchema = z.object({ id_jadwal: z.string().regex(/^\d+$/, "ID jadwal harus berupa angka") });
    const paramsValidation = idJadwalParamsSchema.safeParse(req.params);
    const bodyValidation = updateJadwalSchema.safeParse(req.body);

    if (!paramsValidation.success || !bodyValidation.success) {
        return res.status(400).json({ success: false, error: "Data atau parameter URL tidak valid" });
    }

    const { id_jadwal } = paramsValidation.data;
    const fieldsToUpdate = bodyValidation.data;

    try {
        const updateKeys = Object.keys(fieldsToUpdate);
        const setClause = updateKeys.map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), id_jadwal];
        
        const sql = `UPDATE jadwal_mengajar SET ${setClause} WHERE id = ?`;
        const [result] = await pool.query<OkPacket>(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Jadwal tidak ditemukan atau tidak ada perubahan." });
        }

        res.status(200).json({ success: true, data: { message: "Jadwal berhasil diperbarui." } });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "Jadwal dengan data ini sudah ada." });
        }
        console.error("Error saat mengupdate jadwal:", error);
        res.status(500).json({ success: false, error: "Gagal memperbarui jadwal." });
    }
};