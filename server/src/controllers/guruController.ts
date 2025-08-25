// --- IMPORTS ---
import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { z } from 'zod';

// --- INTERFACES & SKEMA ZOD ---
interface GuruProfile extends RowDataPacket {
    nama_lengkap: string;
    username: string;
    email: string;
    tempat_lahir: string;
    tanggal_lahir: Date;
    alamat: string;
    tahun_mengajar: number;
    pendidikan_tertinggi: string;
    jabatan: string;
}

// Skema untuk satu item hafalan
const hafalanItemSchema = z.object({
    id_santri: z.number().int().positive(),
    nama_juz_surah: z.string().min(1, "Nama Juz/Surah tidak boleh kosong"),
    ayat_awal: z.number().int().positive().optional().nullable(),
    ayat_akhir: z.number().int().positive().optional().nullable(),
    status_hafalan: z.enum(['Lulus', 'Ulangi', 'Belum Sempurna']),
    catatan_guru: z.string().optional().nullable(),
});

// Skema untuk body request inputHafalan. Tambahkan id_mapel untuk validasi.
const inputHafalanSchema = z.object({
    id_mapel: z.number().int().positive(), // Field penting untuk validasi
    tanggal_setoran: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
    hafalan_data: z.array(hafalanItemSchema).min(1, "Data hafalan tidak boleh kosong")
});

// Skema untuk satu item absensi
const absensiItemSchema = z.object({
    id_santri: z.number().int().positive(),
    status: z.enum(['Hadir', 'Sakit', 'Izin', 'Alpa']),
    keterangan: z.string().optional().nullable()
});

// Skema untuk body request createAbsensi
const createAbsensiSchema = z.object({
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
    absensi_data: z.array(absensiItemSchema).min(1, "Data absensi tidak boleh kosong")
});

// Skema untuk body request inputNilai
const inputNilaiSchema = z.object({
    id_santri: z.number().int().positive(),
    id_mapel: z.number().int().positive(),
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY"),
    semester: z.enum(['Ganjil', 'Genap']),
    nilai_tugas: z.number().min(0).max(100).optional().nullable(),
    nilai_uts: z.number().min(0).max(100).optional().nullable(),
    nilai_uas: z.number().min(0).max(100).optional().nullable(),
    deskripsi_guru: z.string().optional().nullable()
});

// Skema untuk validasi query parameter jadwal
const jadwalQuerySchema = z.object({
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY")
});

// --- FUNGSI CONTROLLER ---

export const getProfile = async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ success: false, error: "Akses ditolak." });
    const { id_pengguna } = req.session.user;

    try {
        const query = `
            SELECT p.nama_lengkap, p.username, p.email, g.tempat_lahir, g.tanggal_lahir, 
                    g.alamat, g.tahun_mengajar, g.pendidikan_tertinggi, g.jabatan
            FROM guru g JOIN pengguna p ON g.id_pengguna = p.id WHERE p.id = ?`;
        const [guruProfile] = await pool.query<GuruProfile[]>(query, [id_pengguna]);
        
        if (guruProfile.length === 0) return res.status(404).json({ success: false, error: "Data profil guru tidak ditemukan." });
        
        res.status(200).json({ success: true, data: guruProfile[0] });
    } catch (error: any) {
        console.error("Error saat mengambil profil guru:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil data profil." });
    }
};

export const createAbsensi = async (req: Request, res: Response) => {
    const validationResult = createAbsensiSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ success: false, error: "Data absensi tidak valid", details: validationResult.error.flatten().fieldErrors });
    }

    if (!req.session.user) return res.status(401).json({ success: false, error: "Akses ditolak." });
    
    const { id_pengguna } = req.session.user;
    const { tanggal, absensi_data } = validationResult.data;

    const tahun_ajaran = `${tanggal.substring(0, 4)}/${parseInt(tanggal.substring(0, 4)) + 1}`;
    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        if (!connection) {
            return res.status(500).json({ success: false, error: "Gagal mendapatkan koneksi database." });
        }
        const [guruData] = await connection.query<{ id: number }[] & RowDataPacket[]>('SELECT id FROM guru WHERE id_pengguna = ?', [id_pengguna]);
        if (guruData.length === 0) return res.status(404).json({ success: false, error: "Data guru tidak ditemukan." });
        const id_guru = guruData[0].id;

        await connection.beginTransaction();
        for (const absen of absensi_data) {
            const sql = 'INSERT INTO absensi (id_santri, id_guru, tanggal, tahun_ajaran, status, keterangan) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status), keterangan=VALUES(keterangan)';
            await connection.query(sql, [absen.id_santri, id_guru, tanggal, tahun_ajaran, absen.status, absen.keterangan]);
        }
        await connection.commit();
        res.status(201).json({ success: true, data: { message: "Data absensi berhasil disimpan." } });
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("Error saat menyimpan absensi:", error);
        res.status(500).json({ success: false, error: "Gagal menyimpan data absensi." });
    } finally {
        if (connection) connection.release();
    }
};

export const inputHafalan = async (req: Request, res: Response) => {
    // 1. Validasi body request menggunakan skema Zod
    const validationResult = inputHafalanSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ 
            success: false, 
            error: "Data hafalan tidak valid", 
            details: validationResult.error.flatten().fieldErrors 
        });
    }

    // 2. Pastikan pengguna adalah guru dan sudah login
    if (!req.session.user || req.session.user.peran !== 'Guru') {
        return res.status(401).json({ success: false, error: "Akses ditolak. Anda harus login sebagai Guru." });
    }
    
    const { id_pengguna } = req.session.user;
    const { tanggal_setoran, hafalan_data, id_mapel } = validationResult.data;

    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        if (!connection) {
            return res.status(500).json({ success: false, error: "Gagal mendapatkan koneksi database." });
        }

        // 3. Dapatkan id_guru dari id_pengguna
        const [guruData] = await connection.query<{ id: number }[] & RowDataPacket[]>('SELECT id FROM guru WHERE id_pengguna = ?', [id_pengguna]);
        if (guruData.length === 0) {
            return res.status(404).json({ success: false, error: "Data guru tidak ditemukan." });
        }
        const id_guru = guruData[0].id;

        // 4. Validasi bahwa guru berwenang menginput hafalan berdasarkan kategori mapel
        const [penugasanValid] = await connection.query<RowDataPacket[]>(`
            SELECT jm.id
            FROM jadwal_mengajar jm
            JOIN mata_pelajaran mp ON jm.id_mapel = mp.id
            WHERE jm.id_guru = ? AND mp.id = ? AND mp.kategori = 'Diniyah'
        `, [id_guru, id_mapel]);

        if (penugasanValid.length === 0) {
            connection.release();
            return res.status(403).json({ success: false, error: "Anda tidak berwenang menginput hafalan melalui mata pelajaran ini." });
        }

        await connection.beginTransaction();

        // 5. Looping untuk menyimpan setiap data hafalan
        for (const hafalan of hafalan_data) {
            const sql = `
                INSERT INTO progres_hafalan 
                (id_santri, id_guru, tanggal_setoran, nama_juz_surah, ayat_awal, ayat_akhir, status_hafalan, catatan_guru) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                status_hafalan=VALUES(status_hafalan), catatan_guru=VALUES(catatan_guru)
            `;
            await connection.query(sql, [
                hafalan.id_santri, 
                id_guru, 
                tanggal_setoran, 
                hafalan.nama_juz_surah, 
                hafalan.ayat_awal, 
                hafalan.ayat_akhir, 
                hafalan.status_hafalan, 
                hafalan.catatan_guru
            ]);
        }
        
        await connection.commit();
        res.status(201).json({ success: true, data: { message: "Data hafalan berhasil disimpan." } });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("Error saat menyimpan hafalan:", error);
        res.status(500).json({ success: false, error: "Gagal menyimpan data hafalan." });
    } finally {
        if (connection) connection.release();
    }
};

export const inputNilai = async (req: Request, res: Response) => {
    const validationResult = inputNilaiSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ success: false, error: "Data nilai tidak valid", details: validationResult.error.flatten().fieldErrors });
    }

    if (!req.session.user) return res.status(401).json({ success: false, error: "Akses ditolak." });
    
    const { id_pengguna } = req.session.user;
    const { id_santri, id_mapel, tahun_ajaran, semester, nilai_tugas, nilai_uts, nilai_uas, deskripsi_guru } = validationResult.data;

    try {
        const [guruData] = await pool.query<{ id: number }[] & RowDataPacket[]>('SELECT id FROM guru WHERE id_pengguna = ?', [id_pengguna]);
        if (guruData.length === 0) return res.status(403).json({ success: false, error: "Profil guru tidak ditemukan." });
        const id_guru = guruData[0].id;
        
        const [jadwalCheck] = await pool.query<RowDataPacket[]>('SELECT id FROM jadwal_mengajar WHERE id_guru = ? AND id_mapel = ? AND tahun_ajaran = ?', [id_guru, id_mapel, tahun_ajaran]);
        if (jadwalCheck.length === 0) {
            return res.status(403).json({ success: false, error: "Anda tidak terdaftar sebagai pengajar mata pelajaran ini pada tahun ajaran tersebut." });
        }
        
        const BOBOT_TUGAS = 0.30, BOBOT_UTS = 0.30, BOBOT_UAS = 0.40;
        const tugas = nilai_tugas ?? 0;
        const uts = nilai_uts ?? 0;
        const uas = nilai_uas ?? 0;
        const nilai_akhir_calculated = (tugas * BOBOT_TUGAS) + (uts * BOBOT_UTS) + (uas * BOBOT_UAS);
        
        const sql = `
            INSERT INTO nilai 
                (id_santri, id_mapel, id_guru, tahun_ajaran, semester, nilai_tugas, nilai_uts, nilai_uas, nilai_akhir, deskripsi_guru) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                nilai_tugas = VALUES(nilai_tugas), 
                nilai_uts = VALUES(nilai_uts), 
                nilai_uas = VALUES(nilai_uas), 
                nilai_akhir = VALUES(nilai_akhir),
                deskripsi_guru = VALUES(deskripsi_guru)`;
        
        await pool.query(sql, [id_santri, id_mapel, id_guru, tahun_ajaran, semester, nilai_tugas, nilai_uts, nilai_uas, nilai_akhir_calculated, deskripsi_guru]);

        res.status(201).json({ success: true, data: { message: "Nilai dan deskripsi berhasil disimpan." } });
    } catch (error: any) {
        console.error("Error spesifik saat menginput nilai:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "Nilai untuk santri, mata pelajaran, dan periode ini sudah ada. Gunakan 'UPDATE' untuk mengubah nilai." });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ success: false, error: "ID santri, mata pelajaran, atau guru tidak ditemukan di database." });
        }
        res.status(500).json({ success: false, error: "Gagal menginput nilai." });
    }
};

export const getJadwalGuru = async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ success: false, error: "Akses ditolak." });
    const { id_pengguna } = req.session.user;

    const validation = jadwalQuerySchema.safeParse(req.query);
    if (!validation.success) {
        return res.status(400).json({ success: false, error: "Parameter query tidak valid.", details: validation.error.flatten().fieldErrors });
    }
    const { tahun_ajaran } = validation.data;

    try {
        const [guruData] = await pool.query<{ id: number }[] & RowDataPacket[]>('SELECT id FROM guru WHERE id_pengguna = ?', [id_pengguna]);
        if (guruData.length === 0) return res.status(404).json({ success: false, error: "Data guru tidak ditemukan." });
        const id_guru = guruData[0].id;
        
        const query = `
            SELECT 
                jm.hari, 
                jm.waktu_mulai, 
                jm.waktu_selesai, 
                mp.nama_mapel, 
                k.nama_kelas
            FROM jadwal_mengajar jm
            JOIN mata_pelajaran mp ON jm.id_mapel = mp.id
            JOIN kelas k ON jm.id_kelas = k.id
            WHERE jm.id_guru = ? AND jm.tahun_ajaran = ?
            ORDER BY FIELD(jm.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), jm.waktu_mulai ASC
        `;
        const [jadwal] = await pool.query<RowDataPacket[]>(query, [id_guru, tahun_ajaran]);
        
        if (jadwal.length === 0) {
            return res.status(404).json({ success: false, error: "Tidak ada jadwal ditemukan untuk Anda di tahun ajaran ini." });
        }

        const groupedJadwal = jadwal.reduce((acc, item) => {
            const hari = item.hari;
            if (!acc[hari]) acc[hari] = [];
            acc[hari].push({
                waktu_mulai: item.waktu_mulai,
                waktu_selesai: item.waktu_selesai,
                nama_mapel: item.nama_mapel,
                nama_kelas: item.nama_kelas,
            });
            return acc;
        }, {});

        res.status(200).json({ success: true, data: { tahun_ajaran, jadwal: groupedJadwal } });
    } catch (error: any) {
        console.error("Error saat mengambil jadwal guru:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil data jadwal guru." });
    }
};