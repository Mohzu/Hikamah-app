
import { Request, Response } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

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
      'SELECT id, nama_lengkap, email, peran, created_at FROM pengguna WHERE id = ?',
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

    if (!nama || !email) {
      return res.status(400).json({ message: 'Nama dan email harus diisi' });
    }

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

    if (!username && !newPassword) {
      return res.status(400).json({ message: 'Username baru atau password baru harus diisi' });
    }

    let updateQuery = 'UPDATE pengguna SET';
    const queryParams: (string | number)[] = [];

    // Logika untuk mengubah password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Kata sandi saat ini diperlukan untuk mengubah password' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password baru minimal harus 6 karakter' });
      }

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
