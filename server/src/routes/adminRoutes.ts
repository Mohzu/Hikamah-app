import express, { Router } from 'express';
import { isAdmin } from '../middleware/authMiddleware.js';
import { changePassword, changeUsername } from '../controllers/adminController.js';

const router: Router = express.Router();

// Terapkan middleware isAdmin untuk semua rute di file ini
router.use(isAdmin);

// Rute untuk admin mengubah detail akun pribadinya
router.post('/change-password', changePassword);
router.put('/change-username', changeUsername);

export default router;