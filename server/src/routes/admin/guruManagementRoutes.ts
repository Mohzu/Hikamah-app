import express, { Router } from 'express';
import { isAdmin } from '../../middleware/authMiddleware.js';
import {
    createGuru,
    getAllGuru,
    updateGuru,
    deleteGuru,
    getAllWaliKelas
} from '../../controllers/admin/guruManagementController.js';

const router: Router = express.Router();

// Semua rute di sini hanya untuk Admin
router.use(isAdmin);

// CRUD untuk data guru
router.post('/guru', createGuru);
router.get('/guru', getAllGuru);
router.put('/guru/:id_guru', updateGuru);
router.delete('/guru/:id_guru', deleteGuru);

// Rute untuk manajemen wali kelas
router.get('/wali-kelas', getAllWaliKelas);

export default router;