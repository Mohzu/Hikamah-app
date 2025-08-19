// --- IMPORTS ---
// Impor dasar dari express
import express, { Router, Request } from 'express';
// Impor 'path' untuk menangani ekstensi file
import path from 'path';
// Impor 'multer' untuk menangani upload file, dan tipenya
import multer, { FileFilterCallback } from 'multer';

// Impor middleware keamanan Anda
import { isSantri } from '../middleware/authMiddleware';

// Impor semua fungsi controller yang akan digunakan oleh rute ini
import {
    changePassword,
    changeUsername,
    updateBiodata,
    uploadPhoto, // Controller yang akan menggunakan multer
    getFullProfile,
    getMyNilai,
    getRaporSemester,
    getJadwalPelajaran
} from '../controllers/santriController';


// Buat instance router
const router: Router = express.Router();


// --- KONFIGURASI MULTER UNTUK UPLOAD FOTO PROFIL ---

// 1. Definisikan aturan penyimpanan (di mana & bagaimana file disimpan)
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        // PENJELASAN: 'public/uploads/' adalah path relatif dari root proyek server Anda.
        // Anda harus membuat folder 'public' dan di dalamnya folder 'uploads' secara manual.
        cb(null, 'public/uploads/');
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        // PENJELASAN: Membuat nama file unik untuk mencegah nama yang sama saling menimpa.
        // Contoh: santri-167888999123.jpg
        cb(null, `santri-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// 2. Definisikan aturan filter (file jenis apa yang boleh diupload)
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        // Jika tipe file sesuai, terima file dengan `cb(null, true)`
        return cb(null, true);
    }
    // Jika tipe file tidak sesuai, tolak file dengan mengirimkan Error
    cb(new Error('Tipe file tidak didukung. Hanya gambar (jpeg, jpg, png, gif) yang diizinkan.'));
};

// 3. Buat instance 'upload' dari multer dengan menggabungkan konfigurasi di atas
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 2 } // Batas ukuran file 2MB
});


// =======================================================================
// === ROUTE DEFINITIONS (DEFINISIKAN SEMUA RUTE DI SINI) ===
// =======================================================================

// Terapkan middleware 'isSantri' ke semua rute di bawah ini.
// Ini memastikan hanya santri yang sudah login yang bisa mengakses endpoint ini.
router.use(isSantri);

// Rute untuk manajemen akun
router.post('/change-password', changePassword);
router.put('/change-username', changeUsername);

// Rute untuk manajemen profil dan biodata
router.get('/profile', getFullProfile);
router.put('/update-biodata', updateBiodata);

// Rute untuk upload foto. Perhatikan `upload.single('profilePhoto')` disisipkan
// sebagai middleware SEBELUM controller `uploadPhoto` dijalankan.
router.post('/upload-photo', upload.single('profilePhoto'), uploadPhoto);

// Rute untuk melihat data akademik
router.get('/jadwal', getJadwalPelajaran);
router.get('/my-nilai', getMyNilai);
router.get('/rapor', getRaporSemester);


// Ekspor router agar bisa digunakan di index.ts
export default router;