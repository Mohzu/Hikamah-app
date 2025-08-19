import express, { Router } from 'express';
import { isAdmin } from '../middleware/authMiddleware.js';
import {
getUnverifiedRegistrations,
getAllSantri,
verifyRegistration,
updateNisn,
deleteSantri
} from '../controllers/santriManagementController.js';
const router: Router = express.Router();
// Semua rute di file ini hanya untuk Admin
router.use(isAdmin);
// Rute untuk manajemen pendaftaran
router.get('/pendaftaran', getUnverifiedRegistrations);
router.post('/verifikasi/:id_pendaftaran', verifyRegistration);
// Rute CRUD untuk data santri
router.get('/santri', getAllSantri);
router.put('/santri/:id_santri/nisn', updateNisn);
router.delete('/santri/:id_santri', deleteSantri);
export default router;