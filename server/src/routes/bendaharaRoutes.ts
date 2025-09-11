import express from 'express';
import { protect, isBendahara } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { 
  getMyProfile, 
  updateMyProfile, 
  updateMyCredentials,
  getPembayaranMasuk, 
  validasiPembayaran,
  createTagihan,
  createBiaya,
  getAllBiaya,
  setRincianPembayaran,
  rincianPembayaranSchema,
  updateProfileSchema,
  updateCredentialsSchema,
  verifikasiPembayaranSchema,
  createBiayaSchema
} from '../controllers/bendaharaController.js';

const router = express.Router();

router.route('/profile')
  .get(protect, isBendahara, getMyProfile)
  .put(protect, isBendahara, validate(updateProfileSchema), updateMyProfile);

router.route('/credentials')
  .put(protect, isBendahara, validate(updateCredentialsSchema), updateMyCredentials);

// Payment Routes
router.route('/pembayaran')
  .get(protect, isBendahara, getPembayaranMasuk);

router.route('/pembayaran/verifikasi/:id')
  .put(protect, isBendahara, validate(verifikasiPembayaranSchema), validasiPembayaran);

router.route('/tagihan')
  .post(protect, isBendahara, createTagihan);

router.route('/biaya')
  .post(protect, isBendahara, validate(createBiayaSchema), createBiaya)
  .get(protect, isBendahara, getAllBiaya);

router.route('/rincian-pembayaran')
  .put(protect, isBendahara, validate(rincianPembayaranSchema), setRincianPembayaran);

export default router;