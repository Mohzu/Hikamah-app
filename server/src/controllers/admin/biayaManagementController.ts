// src/controllers/admin/biayaManagementController.ts

import { Request, Response } from 'express';
import pool from '../../config/db.js';
import { z } from 'zod';
import { RowDataPacket } from 'mysql2/promise';

// Skema untuk validasi data rincian biaya baru
const createBiayaSchema = z.object({
  nama_biaya: z.string().min(1, { message: "Nama biaya harus diisi." }),
  jumlah: z.number().positive({ message: "Jumlah harus angka positif." }),
  keterangan: z.string().optional(),
  tahun_ajaran: z.string().min(1, { message: "Tahun ajaran harus diisi." })
});

// Admin: Menambahkan rincian biaya baru
export const createRincianBiaya = async (req: Request, res: Response) => {
  const validationResult = createBiayaSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: "Data yang dikirim tidak valid",
      details: validationResult.error.flatten().fieldErrors
    });
  }

  const { nama_biaya, jumlah, keterangan, tahun_ajaran } = validationResult.data;

  try {
    const [result] = await pool.query(
      'INSERT INTO rincian_biaya (nama_biaya, jumlah, keterangan, tahun_ajaran) VALUES (?, ?, ?, ?)',
      [nama_biaya, jumlah, keterangan, tahun_ajaran]
    );

    res.status(201).json({
      success: true,
      data: {
        message: 'Rincian biaya berhasil ditambahkan.',
        id_biaya_baru: (result as any).insertId
      }
    });
  } catch (error: any) {
    console.error("Error saat menambahkan rincian biaya:", error);
    res.status(500).json({ success: false, error: "Gagal menambahkan rincian biaya karena kesalahan server." });
  }
};

// Admin: Mengambil semua rincian biaya
export const getSemuaRincianBiaya = async (req: Request, res: Response) => {
  try {
    const [biaya] = await pool.query<RowDataPacket[]>('SELECT * FROM rincian_biaya ORDER BY tahun_ajaran DESC, tanggal_dibuat ASC');
    res.status(200).json({ success: true, data: biaya });
  } catch (error: any) {
    console.error("Error saat mengambil rincian biaya:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil rincian biaya karena kesalahan server." });
  }
};