// src/routes/bendaharaRoutes.ts

import { Router } from 'express';
import { isLoggedIn, isBendahara } from '../middleware/authMiddleware.js';
import {
  getPembayaranMasuk,
  validasiPembayaran,
  createTagihan,
  setRincianPembayaran,
  createRincianBiaya, // <-- Diimpor
  getSemuaRincianBiaya // <-- Diimpor
} from '../controllers/bendaharaController.js';

const router: Router = Router();

// Middleware ini memastikan hanya bendahara yang sudah login yang bisa mengakses rute di bawahnya
router.use(isLoggedIn, isBendahara);


// --- Rute untuk Master Data Biaya ---

// Membuat rincian biaya baru
router.post('/rincian-biaya', createRincianBiaya);

// Mengambil semua rincian biaya
router.get('/rincian-biaya', getSemuaRincianBiaya);


// --- Rute Khusus Bendahara untuk Mengelola Pembayaran ---

// Mengelola rincian bank untuk tujuan transfer
router.post('/rincian-pembayaran', setRincianPembayaran);

// Membuat tagihan baru untuk santri
router.post('/create-tagihan', createTagihan);

// Melihat semua pembayaran yang masuk dan menunggu verifikasi
router.get('/pembayaran-masuk', getPembayaranMasuk);

// Memverifikasi atau menolak pembayaran
router.post('/verifikasi/:id_pembayaran', validasiPembayaran);

export default router;