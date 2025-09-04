// src/middleware/uploadMiddleware.ts

import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Konfigurasi penyimpanan untuk multer
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        // Tentukan folder untuk menyimpan bukti transfer
        // Pastikan Anda membuat folder ini secara manual di proyek Anda: `public/uploads/bukti-transfer`
        cb(null, 'public/uploads/bukti-transfer');
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        // Buat nama file unik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
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

export default upload;