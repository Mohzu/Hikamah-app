import { Request, Response } from 'express';
import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PoolConnection, RowDataPacket, OkPacket } from 'mysql2/promise';

// Skema validasi dari kode Anda yang sebelumnya berjalan
const createBendaharaSchema = z.object({
  nama_lengkap: z.string().min(1, { message: "Nama lengkap harus diisi." }),
  username: z.string().min(3, { message: "Username minimal 3 karakter." }),
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter." }),
});

// @desc    Get all bendahara
// @route   GET /api/admin/bendahara
// @access  Private/Admin
export const getAllBendahara = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nama_lengkap, email, username, peran, created_at, status_aktif FROM pengguna WHERE LOWER(peran) = 'bendahara' ORDER BY nama_lengkap"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new bendahara account (menggunakan kode Anda)
// @route   POST /api/admin/bendahara/create
// @access  Private/Admin
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


// @desc    Delete a bendahara
// @route   DELETE /api/admin/bendahara/:id
// @access  Private/Admin
export const deleteBendahara = async (req: Request, res: Response) => {
  const { id: penggunaId } = req.params;

  try {
    const [penggunaRows]: any = await pool.execute('SELECT peran FROM pengguna WHERE id = ?', [penggunaId]);

    if (penggunaRows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    if (penggunaRows[0].peran.toLowerCase() !== 'bendahara') {
      return res.status(403).json({ message: `This pengguna is not a bendahara, but a ${penggunaRows[0].peran}` });
    }

    await pool.execute('DELETE FROM pengguna WHERE id = ?', [penggunaId]);

    res.status(200).json({ message: 'Akun bendahara berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};