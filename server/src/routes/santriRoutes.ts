// --- IMPORTS ---
import express, { Router, Request } from 'express';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { isSantri } from '../middleware/authMiddleware.js';

import {
    changePassword,
    changeUsername,
    updateBiodata,
    uploadPhoto, 
    getFullProfile,
    getMyNilai,
    getRaporSemester,
    getMyHafalan,
    getJadwalPelajaran,
    getSantriDashboardSummary,
    getAvailableRaporPeriods,
    getAvailableAcademicYears // Tambahkan ini
} from '../controllers/santriController.js';

const router: Router = express.Router();


// --- KONFIGURASI MULTER UNTUK UPLOAD FOTO PROFIL ---

// 1. Definisikan aturan penyimpanan (di mana & bagaimana file disimpan)
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, 'public/uploads/');
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        cb(null, `santri-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// 2. Definisikan aturan filter (file jenis apa yang boleh diupload)
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Tipe file tidak didukung. Hanya gambar (jpeg, jpg, png, gif) yang diizinkan.'));
};

// 3. Buat instance 'upload' dari multer dengan menggabungkan konfigurasi di atas
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 2 }
});


// =======================================================================
// === ROUTE DEFINITIONS (DEFINISIKAN SEMUA RUTE DI SINI) ===
// =======================================================================

router.use(isSantri);

// Rute untuk manajemen akun
router.post('/change-password', changePassword);
router.put('/change-username', changeUsername);

// Rute untuk manajemen profil dan biodata
router.get('/profile', getFullProfile);
router.put('/update-biodata', updateBiodata);

// Rute untuk upload foto
router.post('/upload-photo', upload.single('profilePhoto'), uploadPhoto);

// Rute untuk melihat data akademik
router.get('/jadwal', getJadwalPelajaran);
router.get('/my-nilai', getMyNilai);
router.get('/rapor', getRaporSemester);
router.get("/hafalan", getMyHafalan);
router.get("/available-rapor-periods", isSantri, getAvailableRaporPeriods);
router.get("/available-academic-years", getAvailableAcademicYears); // Tambahkan rute baru ini

// Rute baru untuk ringkasan dashboard santri
router.get('/dashboard-summary', getSantriDashboardSummary);


// Ekspor router agar bisa digunakan di index.ts
export default router;