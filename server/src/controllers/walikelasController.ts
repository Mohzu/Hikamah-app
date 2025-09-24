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
    // Default tahun ajaran ke format YYYY/YYYY+1
    const now = new Date();
    const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1; // asumsi ajaran mulai Juli
    const defaultTahunAjaran = `${startYear}/${startYear + 1}`;
    const tahun_ajaran = String(req.query.tahun_ajaran || defaultTahunAjaran);
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
        const [result] = await pool.query<OkPacket>(
            'UPDATE santri_kelas SET status_kenaikan = ? WHERE id_santri = ? AND id_kelas = ? AND tahun_ajaran = ?',
            [status_kenaikan, id_santri, id_kelas_wali, tahun_ajaran]
        );
        if (result.affectedRows === 0) {
            // Jika baris belum ada (misalnya untuk tahun ajaran berikutnya), coba buat barisnya
            try {
                await pool.query<OkPacket>(
                    'INSERT INTO santri_kelas (id_santri, id_kelas, tahun_ajaran, status_kenaikan) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status_kenaikan = VALUES(status_kenaikan)',
                    [id_santri, id_kelas_wali, tahun_ajaran, status_kenaikan]
                );
                return res.status(200).json({ success: true, data: { message: `Status kenaikan untuk santri berhasil ditetapkan.` } });
            } catch (e: any) {
                // Jika insert gagal (mis. constraint lain), kembalikan pesan yang informatif
                return res.status(404).json({ success: false, error: "Santri tidak ditemukan di kelas Anda pada tahun ajaran ini dan tidak dapat dibuat otomatis." });
            }
        }
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

// --- NILAI SANTRI OLEH WALI KELAS ---
export const getNilaiSantri = async (req: RequestWithWaliKelas, res: Response) => {
    const { id_santri } = req.params as { id_santri: string };
    const id_kelas = req.id_kelas_wali;
    const { tahun_ajaran, semester } = req.query as { tahun_ajaran?: string; semester?: string };

    try {
        // Pastikan santri ini berada di kelas wali pada tahun ajaran terkait (jika tahun ajaran diberikan)
        const whereTA = tahun_ajaran ? 'AND sk.tahun_ajaran = ?' : '';
        const params: any[] = [id_santri, id_kelas];
        if (tahun_ajaran) params.push(tahun_ajaran);

        const [cekSantri] = await pool.query<RowDataPacket[]>(
            `SELECT sk.id_santri FROM santri_kelas sk WHERE sk.id_santri = ? AND sk.id_kelas = ? ${whereTA} LIMIT 1`,
            params
        );
        if (cekSantri.length === 0) {
            return res.status(404).json({ success: false, error: 'Santri tidak ditemukan di kelas Anda pada tahun ajaran ini.' });
        }

        // Ambil nilai
        const nilaiParams: any[] = [id_santri];
        let nilaiWhere = 'WHERE n.id_santri = ?';
        if (tahun_ajaran) { nilaiWhere += ' AND n.tahun_ajaran = ?'; nilaiParams.push(tahun_ajaran); }
        if (semester) { nilaiWhere += ' AND n.semester = ?'; nilaiParams.push(semester); }

        const [nilaiList] = await pool.query<RowDataPacket[]>(
            `SELECT n.tahun_ajaran, n.semester, mp.nama_mapel, n.nilai_tugas, n.nilai_uts, n.nilai_uas, n.nilai_akhir
             FROM nilai n
             JOIN mata_pelajaran mp ON n.id_mapel = mp.id
             ${nilaiWhere}
             ORDER BY n.tahun_ajaran DESC, n.semester DESC, mp.nama_mapel ASC`,
            nilaiParams
        );

        const grouped = (nilaiList as any[]).reduce((acc: any, row: any) => {
            const key = `${row.tahun_ajaran} - Semester ${row.semester}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push({
                mata_pelajaran: row.nama_mapel,
                nilai_tugas: row.nilai_tugas,
                nilai_uts: row.nilai_uts,
                nilai_uas: row.nilai_uas,
                nilai_akhir: row.nilai_akhir,
            });
            return acc;
        }, {} as Record<string, any[]>);

        res.status(200).json({ success: true, data: grouped });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Gagal mengambil data nilai santri.' });
    }
};

// --- REKAP KEHADIRAN PER SANTRI ---
export const getRekapKehadiran = async (req: RequestWithWaliKelas, res: Response) => {
    const id_kelas = req.id_kelas_wali;
    const { tahun_ajaran } = req.query as { tahun_ajaran?: string };
    try {
        const whereTA = tahun_ajaran ? 'AND a.tahun_ajaran = ?' : '';
        const params: any[] = [id_kelas];
        if (tahun_ajaran) params.push(tahun_ajaran);
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT s.id AS id_santri, s.nama_lengkap, s.nisn,
                SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) AS hadir,
                SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END) AS sakit,
                SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END) AS izin,
                SUM(CASE WHEN a.status = 'Alfa' THEN 1 ELSE 0 END) AS alfa
             FROM santri s
             JOIN santri_kelas sk ON sk.id_santri = s.id
             LEFT JOIN absensi a ON a.id_santri = s.id
             WHERE sk.id_kelas = ? ${whereTA}
             GROUP BY s.id, s.nama_lengkap, s.nisn
             ORDER BY s.nama_lengkap`,
            params
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Gagal mengambil rekap kehadiran.' });
    }
};