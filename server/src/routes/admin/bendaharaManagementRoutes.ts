// src/routes/admin/bendaharaManagementRoutes.ts

import express, { Router } from 'express';
import { isAdmin } from '../../middleware/authMiddleware.js'; 
import { createBendaharaAccount } from '../../controllers/admin/bendaharaManagementController.js';

const router: Router = express.Router();

// Terapkan middleware isAdmin untuk semua rute di file ini
router.use(isAdmin);

// Rute untuk membuat akun bendahara baru
// PATH: /api/admin/bendahara/create
router.post('/create', createBendaharaAccount);

export default router;
