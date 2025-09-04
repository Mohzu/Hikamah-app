// src/routes/santriRoutes.ts

import express, { Router, Request } from 'express';
import { isSantri } from '../middleware/authMiddleware.js';
// Impor semua controller yang relevan dari santriController.ts
import {
    changePassword,
    changeUsername,
    updateBiodata,
    uploadPhoto,
    getFullProfile,
    getJadwalPelajaran,
    getMyNilai,
    getRaporSemester,
    getMyHafalan,
    getSantriDashboardSummary,
    getAvailableAcademicYears,
    getAvailableRaporPeriods
} from '../controllers/santriController.js';

// PERBAIKAN: Jalur impor yang benar ke pembayaranController.js
import {
    getDaftarPembayaranSantri,
    getDaftarTagihanSantri,
    getRincianPembayaran,
    submitPayment
} from '../controllers/pembayaranController.js';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';


const router: Router = express.Router();

// --- KONFIGURASI MULTER UNTUK UPLOAD FOTO PROFIL ---

// 1. Definisikan aturan penyimpanan (di mana & bagaimana file disimpan)
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const uploadPath = path.join(process.cwd(), 'public', 'uploads');
        return cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const filename = `santri-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, filename);
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

// 3. Buat instance 'uploadProfilePhoto' dari multer dengan menggabungkan konfigurasi di atas
const uploadProfilePhoto = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 2 }
});

// Konfigurasi penyimpanan untuk multer bukti transfer pembayaran
const buktiTransferStorage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        // Tentukan folder untuk menyimpan bukti transfer
        const transferPath = path.join(process.cwd(), 'public', 'uploads', 'bukti-transfer');
        cb(null, transferPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        // Buat nama file unik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});
// untuk upload bukti transfer pembayaran
const uploadBuktiTransfer = multer({
    storage: buktiTransferStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Batasan ukuran file 2MB
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        // Filter jenis file yang diizinkan (gambar)
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diizinkan!'));
        }
    }
});


router.use(isSantri);

// Rute untuk manajemen akun
router.post('/change-password', changePassword);
router.put('/change-username', changeUsername);

// Rute untuk manajemen profil dan biodata
router.get('/profile', getFullProfile);
router.put('/update-biodata', updateBiodata);

// Rute untuk upload foto
router.post('/upload-photo', uploadProfilePhoto.single('profilePhoto'), uploadPhoto);

// Rute untuk melihat data akademik
router.get('/jadwal', getJadwalPelajaran);
router.get('/my-nilai', getMyNilai);
router.get('/rapor', getRaporSemester);
router.get("/hafalan", getMyHafalan);
router.get("/available-rapor-periods", isSantri, getAvailableRaporPeriods);
router.get("/available-academic-years", getAvailableAcademicYears); // Tambahkan rute baru ini

// Rute baru untuk ringkasan dashboard santri
router.get('/dashboard-summary', getSantriDashboardSummary);

// --- Rute Pembayaran Santri ---
// Menggunakan controller dari file pembayaranController.js
router.get('/pembayaran', getDaftarPembayaranSantri);
router.get('/pembayaran/tagihan', getDaftarTagihanSantri); // Rute untuk tagihan yang belum dibayar
router.get('/pembayaran/rincian-bank', getRincianPembayaran); // Rute untuk detail rekening bank
router.post('/pembayaran/submit', uploadBuktiTransfer.single('bukti_transfer'), submitPayment);

export default router;