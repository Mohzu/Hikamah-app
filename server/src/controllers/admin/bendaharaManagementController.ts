// src/controllers/admin/bendaharaManagementController.ts

import { Request, Response } from 'express';
import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';

const createBendaharaSchema = z.object({
  nama_lengkap: z.string().min(1, { message: "Nama lengkap harus diisi." }),
  username: z.string().min(3, { message: "Username minimal 3 karakter." }),
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter." }),
});

export const createBendaharaAccount = async (req: Request, res: Response) => {
  const validationResult = createBendaharaSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: "Data yang dikirim tidak valid",
      details: validationResult.error.flatten().fieldErrors
    });
  }

  const { nama_lengkap, username, email, password } = validationResult.data;
  let connection: PoolConnection | undefined;
  try {
    connection = await pool.getConnection();
    if (!connection) { throw new Error("Gagal mendapatkan koneksi database."); }
    await connection.beginTransaction();

    const [existingUser] = await connection.query<RowDataPacket[]>('SELECT id FROM pengguna WHERE username = ? OR email = ?', [username, email]);
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: "Username atau email sudah digunakan." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [resultPengguna] = await connection.query<OkPacket>(
      'INSERT INTO pengguna (nama_lengkap, username, email, kata_sandi, peran, status_aktif) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_lengkap, username, email, hashedPassword, 'Bendahara', true]
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      data: {
        message: `Akun bendahara ${nama_lengkap} berhasil dibuat.`,
        id_pengguna_baru: resultPengguna.insertId
      }
    });
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Error saat membuat akun bendahara:", error);
    res.status(500).json({ success: false, error: "Gagal membuat akun bendahara karena kesalahan server." });
  } finally {
    if (connection) connection.release();
  }
};