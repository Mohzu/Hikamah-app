import express, { Router } from 'express';
import { isGuru } from '../middleware/authMiddleware.js';
import { 
    getProfile, 
    createAbsensi, 
    inputNilai, 
    getJadwalGuru,
    inputHafalan
} from '../controllers/guruController.js';

const router: Router = express.Router();

// Semua rute di sini memerlukan verifikasi bahwa pengguna adalah seorang Guru (atau Admin)
router.use(isGuru);

router.get('/profile', getProfile);
router.post('/absensi', createAbsensi);
router.post('/nilai', inputNilai);
router.get('/jadwal', getJadwalGuru);
router.post('/hafalan', isGuru, inputHafalan);

export default router;