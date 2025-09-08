
import { Request, Response } from 'express';
import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';

// @desc    Get all bendahara
// @route   GET /api/admin/bendahara
// @access  Private/Admin
export const getAllBendahara = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nama_lengkap, email, peran, created_at FROM pengguna WHERE LOWER(peran) = 'bendahara' ORDER BY nama_lengkap"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new bendahara
// @route   POST /api/admin/bendahara
// @access  Private/Admin
export const createBendahara = async (req: Request, res: Response) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Check if pengguna with that email already exists
    const [existingPengguna]: any = await pool.execute('SELECT id FROM pengguna WHERE email = ?', [email]);
    if (existingPengguna.length > 0) {
      return res.status(400).json({ message: 'Pengguna with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [penggunaResult]: any = await pool.execute(
      'INSERT INTO pengguna (nama_lengkap, email, kata_sandi, peran) VALUES (?, ?, ?, ?)',
      [nama, email, hashedPassword, 'bendahara']
    );

    const penggunaId = penggunaResult.insertId;

    res.status(201).json({
      id: penggunaId,
      nama_lengkap: nama,
      email,
      peran: 'bendahara',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a bendahara
// @route   DELETE /api/admin/bendahara/:id
// @access  Private/Admin
export const deleteBendahara = async (req: Request, res: Response) => {
  const { id: penggunaId } = req.params; // This is the pengguna ID

  try {
    // First, verify the pengguna exists and is a bendahara before deleting
    const [penggunaRows]: any = await pool.execute('SELECT peran FROM pengguna WHERE id = ?', [penggunaId]);

    if (penggunaRows.length === 0) {
      return res.status(404).json({ message: 'Pengguna not found' });
    }

    // Case-insensitive check
    if (penggunaRows[0].peran.toLowerCase() !== 'bendahara') {
      return res.status(403).json({ message: `This pengguna is not a bendahara, but a ${penggunaRows[0].peran}` });
    }

    // Proceed with deletion
    await pool.execute('DELETE FROM pengguna WHERE id = ?', [penggunaId]);

    res.status(200).json({ message: 'Bendahara account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
