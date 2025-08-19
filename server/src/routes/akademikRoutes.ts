import express, { Router } from 'express';
import { isAdmin } from '../middleware/authMiddleware.js';
import {
    createMapel,
    getAllMapel,
    deleteMapel,
    addMapelToJenjang,
    assignGuruToJadwal,
    getAllJadwal,
    updateGuruOnJadwal,
    deleteJadwal,
    updateJadwalMengajar
} from '../controllers/akademikController.js';

const router: Router = express.Router();

// Semua rute di sini hanya bisa diakses oleh Admin
router.use(isAdmin);

// === Rute Manajemen Mata Pelajaran ===
router.post('/mapel', createMapel);
router.get('/mapel', getAllMapel);
router.delete('/mapel/:id_mapel', deleteMapel);

// === Rute Manajemen Kurikulum ===
router.post('/jenjang/:id_jenjang/mapel', addMapelToJenjang);

// === Rute Manajemen Jadwal Mengajar ===
router.get('/jadwal', getAllJadwal);
router.delete('/jadwal/:id_jadwal', deleteJadwal);
router.put('/jadwal/:id_jadwal/update-guru', updateGuruOnJadwal);
router.put('/jadwal/:id_jadwal', updateJadwalMengajar);
router.post('/kelas/:id_kelas/mapel/:id_mapel/assign-guru', assignGuruToJadwal);

export default router;