
import { Request, Response } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { OkPacket, RowDataPacket } from 'mysql2/promise';
import z from 'zod';

// --- Zod Schemas for Validation ---

const validasiPembayaranSchema = z.object({
    id_pembayaran: z.coerce.number().int().positive(),
    status: z.enum(['Diverifikasi', 'Ditolak']),
    alasan_penolakan: z.string().optional().nullable() // Diperbaiki: Boleh null
});

export const rincianPembayaranSchema = z.object({
    nama_bank: z.string().min(1, 'Nama bank harus diisi.'),
    nomor_rekening: z.string().min(1, 'Nomor rekening harus diisi.'),
    atas_nama: z.string().min(1, 'Nama pemilik rekening harus diisi.'),
    deskripsi: z.string().optional().nullable() // Diperbaiki: Boleh null
});

export const updateProfileSchema = z.object({
  nama: z.string().min(1, 'Nama harus diisi'),
  email: z.string().email('Email tidak valid').min(1, 'Email harus diisi'),
});

export const updateCredentialsSchema = z.object({
  username: z.string().min(1, 'Username harus diisi').optional(),
  currentPassword: z.string().min(1, 'Kata sandi saat ini harus diisi').optional(),
  newPassword: z.string().min(6, 'Password baru minimal harus 6 karakter').optional(),
}).refine(data => data.username || data.newPassword, {
  message: 'Username baru atau password baru harus diisi',
  path: ['username', 'newPassword'],
}).refine(data => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Kata sandi saat ini diperlukan untuk mengubah password',
  path: ['currentPassword'],
});

export const verifikasiPembayaranSchema = z.object({
  status: z.enum(['Diverifikasi', 'Ditolak'], { message: 'Status pembayaran tidak valid. Harus "Diverifikasi" atau "Ditolak".' }),
});

export const createBiayaSchema = z.object({
  nama_biaya: z.string().min(1, 'Nama biaya harus diisi.'),
  jumlah: z.coerce.number().positive('Jumlah harus angka positif.'),
  keterangan: z.string().optional().nullable(),
  tahun_ajaran: z.string().min(1, 'Tahun ajaran harus diisi.'),
});

const createTagihanSchema = z.object({
    id_santri: z.coerce.number().int().positive('ID Santri harus angka integer positif.'),
    id_biaya: z.coerce.number().int().positive('ID Biaya harus angka integer positif.'),
    id_bank: z.coerce.number().int().positive('ID Bank harus angka integer positif.'),
    jumlah: z.coerce.number().positive('Jumlah harus angka positif.'),
    status: z.enum(['BelumDibayar', 'MenungguVerifikasi']).default('BelumDibayar'),
});


// --- Controller Functions for Bendahara ---

/**
 * Mengambil daftar semua pembayaran yang menunggu verifikasi.
 * Hanya untuk Bendahara.
 */
export const getPembayaranMasuk = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                p.id,
                s.nama_lengkap AS nama_santri,
                p.jumlah_pembayaran,
                p.bukti_pembayaran,
                p.status,
                p.dibuat_pada
            FROM pembayaran p
            JOIN santri s ON p.id_santri = s.id
            WHERE p.status = 'MenungguVerifikasi'
            ORDER BY p.dibuat_pada ASC
        `;
        const [pembayaran] = await pool.query<RowDataPacket[]>(query);
        res.status(200).json({ success: true, data: pembayaran });
    } catch (error: any) {
        console.error("Kesalahan saat mengambil pembayaran masuk:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil data pembayaran masuk." });
    }
};

/**
 * Memvalidasi atau menolak sebuah pembayaran.
 * Hanya untuk Bendahara.
 */
export const validasiPembayaran = async (req: Request, res: Response) => {
    const validationResult = validasiPembayaranSchema.safeParse({ ...req.body, id_pembayaran: req.params.id });
    if (!validationResult.success) {
        return res.status(400).json({ success: false, error: 'Data validasi tidak valid.', details: validationResult.error.flatten().fieldErrors });
    }
    
    const { id_pembayaran, status, alasan_penolakan } = validationResult.data;
    const id_bendahara = req.session.user?.id_pengguna; // Mengambil ID pengguna dari sesi

    try {
        await pool.query<OkPacket>(
            `UPDATE pembayaran SET status = ?, alasan_penolakan = ?, id_bendahara = ? WHERE id = ?`,
            [status, alasan_penolakan || null, id_bendahara, id_pembayaran]
        );

        res.status(200).json({ success: true, message: `Status pembayaran berhasil diperbarui menjadi ${status}.` });
    } catch (error) {
        console.error('Error saat memvalidasi pembayaran:', error);
        res.status(500).json({ success: false, error: 'Gagal memvalidasi pembayaran.' });
    }
};

/**
 * Membuat tagihan baru untuk seorang santri.
 * Hanya untuk Bendahara.
 */
export const createTagihan = async (req: Request, res: Response) => {
    const validation = createTagihanSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            success: false,
            error: 'Data tidak valid.',
            details: validation.error.flatten().fieldErrors,
        });
    }

    const { id_santri, id_biaya, id_bank, jumlah, status } = validation.data;

    try {
        const [result] = await pool.query<OkPacket>(
            `INSERT INTO pembayaran (id_santri, id_biaya, id_bank, jumlah_pembayaran, status, dibuat_pada) VALUES (?, ?, ?, ?, ?, NOW())`,
            [id_santri, id_biaya, id_bank, jumlah, status]
        );
        
        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, error: 'Gagal membuat tagihan.' });
        }

        res.status(201).json({ success: true, message: 'Tagihan berhasil dibuat.' });
    } catch (error: any) {
        console.error('Error saat membuat tagihan:', error);
        res.status(500).json({ success: false, error: 'Gagal membuat tagihan karena kesalahan server.' });
    }
};

/**
 * Mengatur atau memperbarui rincian rekening bank untuk tujuan transfer.
 * Hanya untuk Bendahara.
 */
export const setRincianPembayaran = async (req: Request, res: Response) => {
    const validationResult = rincianPembayaranSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ success: false, error: 'Data rincian tidak valid.', details: validationResult.error.flatten().fieldErrors });
    }
    
    const { nama_bank, nomor_rekening, atas_nama, deskripsi } = validationResult.data;
    
    try {
        await pool.query(
            'INSERT INTO rincian_bank (id, nama_bank, nomor_rekening, atas_nama, deskripsi) VALUES (1, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_bank = VALUES(nama_bank), nomor_rekening = VALUES(nomor_rekening), atas_nama = VALUES(atas_nama), deskripsi = VALUES(deskripsi)',
            [nama_bank, nomor_rekening, atas_nama, deskripsi]
        );
        res.status(201).json({ success: true, message: 'Rincian pembayaran berhasil diperbarui.' });
    } catch (error: any) {
        console.error("Error saat memperbarui rincian pembayaran:", error);
        res.status(500).json({ success: false, error: "Gagal memperbarui rincian pembayaran." });
    }
};

/**
 * Menambahkan jenis biaya baru.
 * Hanya untuk Bendahara.
 */
export const createBiaya = async (req: Request, res: Response) => {
    const validationResult = createBiayaSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ success: false, error: 'Data biaya tidak valid.', details: validationResult.error.flatten().fieldErrors });
    }

    const { nama_biaya, jumlah, keterangan, tahun_ajaran } = validationResult.data;

    try {
        const [result] = await pool.query<OkPacket>(
            'INSERT INTO rincian_biaya (nama_biaya, jumlah, keterangan, tahun_ajaran, tanggal_dibuat) VALUES (?, ?, ?, ?, NOW())',
            [nama_biaya, jumlah, keterangan || null, tahun_ajaran]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, error: 'Gagal menambahkan jenis biaya.' });
        }

        res.status(201).json({ success: true, message: 'Jenis biaya berhasil ditambahkan.', id: result.insertId });
    } catch (error: any) {
        console.error('Error saat menambahkan jenis biaya:', error);
        res.status(500).json({ success: false, error: 'Gagal menambahkan jenis biaya karena kesalahan server.' });
    }
};

/**
 * Mengambil daftar semua rincian biaya.
 * Hanya untuk Bendahara.
 */
export const getAllBiaya = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT
                id,
                nama_biaya,
                jumlah,
                keterangan,
                tahun_ajaran,
                tanggal_dibuat
            FROM rincian_biaya
            ORDER BY tanggal_dibuat DESC
        `;
        const [biaya] = await pool.query<RowDataPacket[]>(query);
        res.status(200).json({ success: true, data: biaya });
    } catch (error: any) {
        console.error("Kesalahan saat mengambil semua rincian biaya:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil data rincian biaya." });
    }
};


// @desc    Get bendahara profile
// @route   GET /api/bendahara/profile
// @access  Private
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    if (!req.session.user) {
      return res.status(401).json({ message: 'Tidak terotentikasi' });
    }
    // @ts-ignore
    const penggunaId = req.session.user.id_pengguna;

    if (!penggunaId) {
      return res.status(401).json({ message: 'Sesi pengguna tidak valid (tidak ada ID)' });
    }

    const [rows]: any = await pool.execute(
      'SELECT id, nama_lengkap, email, peran FROM pengguna WHERE id = ?',
      [penggunaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update bendahara profile
// @route   PUT /api/bendahara/profile
// @access  Private
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    if (!req.session.user) {
      return res.status(401).json({ message: 'Tidak terotentikasi' });
    }
    // @ts-ignore
    const penggunaId = req.session.user.id_pengguna;

    if (!penggunaId) {
      return res.status(401).json({ message: 'Sesi pengguna tidak valid (tidak ada ID)' });
    }

    const { nama, email } = req.body;

    const [existingPengguna]: any = await pool.execute(
      'SELECT id FROM pengguna WHERE email = ? AND id != ?',
      [email, penggunaId]
    );

    if (existingPengguna.length > 0) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }

    await pool.execute(
      'UPDATE pengguna SET nama_lengkap = ?, email = ? WHERE id = ?',
      [nama, email, penggunaId]
    );

    const [updatedPengguna]: any = await pool.execute(
      'SELECT id, nama_lengkap, email, peran FROM pengguna WHERE id = ?',
      [penggunaId]
    );

    res.status(200).json(updatedPengguna[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update bendahara credentials (username/password)
// @route   PUT /api/bendahara/credentials
// @access  Private
export const updateMyCredentials = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    if (!req.session.user) {
      return res.status(401).json({ message: 'Tidak terotentikasi' });
    }
    // @ts-ignore
    const penggunaId = req.session.user.id_pengguna;

    if (!penggunaId) {
      return res.status(401).json({ message: 'Sesi pengguna tidak valid (tidak ada ID)' });
    }

    const { username, currentPassword, newPassword } = req.body;

    let updateQuery = 'UPDATE pengguna SET';
    const queryParams: (string | number)[] = [];

    // Logika untuk mengubah password
    if (newPassword) {
      const [userRows]: any = await pool.execute('SELECT kata_sandi FROM pengguna WHERE id = ?', [penggunaId]);
      if (userRows.length === 0) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
      }
      const storedPassword = userRows[0].kata_sandi;

      const isMatch = await bcrypt.compare(currentPassword, storedPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Kata sandi saat ini salah' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      updateQuery += ' kata_sandi = ?,';
      queryParams.push(hashedPassword);
    }

    // Logika untuk mengubah username
    if (username) {
      const [existingPengguna]: any = await pool.execute(
        'SELECT id FROM pengguna WHERE username = ? AND id != ?',
        [username, penggunaId]
      );
      if (existingPengguna.length > 0) {
        return res.status(400).json({ message: 'Username sudah digunakan' });
      }
      updateQuery += ' username = ?,';
      queryParams.push(username);
    }

    updateQuery = updateQuery.slice(0, -1) + ' WHERE id = ?';
    queryParams.push(penggunaId);

    await pool.execute(updateQuery, queryParams);

    // Hancurkan sesi setelah update berhasil
    // @ts-ignore
    req.session.destroy((err) => {
      if (err) {
        console.error('Gagal menghancurkan sesi:', err);
        return res.status(500).json({ message: 'Kredensial diperbarui, tapi sesi logout gagal.' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Kredensial berhasil diperbarui. Silakan login kembali.' });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};










