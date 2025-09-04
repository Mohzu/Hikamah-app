// src/routes/admin/biayaManagementRoutes.ts

import express, { Router } from 'express';
import { isAdmin } from '../../middleware/authMiddleware.js';
import { createRincianBiaya, getSemuaRincianBiaya } from '../../controllers/admin/biayaManagementController.js';

const router: Router = express.Router();

// Terapkan middleware isAdmin untuk semua rute di file ini
router.use(isAdmin);

// Rute untuk membuat rincian biaya baru
router.post('/create', createRincianBiaya);

// Rute untuk mengambil semua rincian biaya
router.get('/', getSemuaRincianBiaya);

export default router;
