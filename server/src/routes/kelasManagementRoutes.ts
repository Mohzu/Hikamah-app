import express, { Router } from 'express';
import { isAdmin } from '../middleware/authMiddleware.js';
import {
    createKelas,
    assignWaliKelas,
    unassignWaliKelas,
    assignSantriToKelas,
    removeSantriFromKelas,
    deleteKelas
} from '../controllers/kelasManagementController.js';

const router: Router = express.Router();

// Semua rute di file ini dilindungi oleh middleware Admin
router.use(isAdmin);

// Rute CRUD untuk Kelas
router.post('/kelas', createKelas);
router.delete('/kelas/:id_kelas', deleteKelas);

// Rute untuk manajemen Wali Kelas
router.put('/kelas/:id_kelas/assign-wali', assignWaliKelas);
router.delete('/kelas/:id_kelas/unassign-wali', unassignWaliKelas);

router.post('/:id_kelas/assign-santri', assignSantriToKelas);
router.delete('/:id_kelas/remove-santri/:id_santri', removeSantriFromKelas);

export default router;