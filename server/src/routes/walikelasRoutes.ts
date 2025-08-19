import express, { Router } from 'express';
import { isWaliKelas } from '../middleware/authMiddleware'; // Middleware khusus untuk wali kelas
import {
    getSantriByWaliKelas,
    setKenaikanKelas,
    createCatatanPerilaku,
    getCatatanPerilaku,
    updateCatatanPerilaku,
    deleteCatatanPerilaku
} from '../controllers/walikelasController';

const router: Router = express.Router();
router.use(isWaliKelas);
router.get('/santri', getSantriByWaliKelas);
router.put('/santri/:id_santri/status-kenaikan', setKenaikanKelas);
router.post('/santri/:id_santri/perilaku', createCatatanPerilaku);
router.get('/santri/:id_santri/perilaku', getCatatanPerilaku);
router.put('/perilaku/:id_catatan', updateCatatanPerilaku);
router.delete('/perilaku/:id_catatan', deleteCatatanPerilaku);

export default router;