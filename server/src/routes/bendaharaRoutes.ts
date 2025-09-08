import express from 'express';
import { protect, isBendahara } from '../middleware/authMiddleware.js';
import { getMyProfile, updateMyProfile, updateMyCredentials } from '../controllers/bendaharaController.js';

const router = express.Router();

router.route('/profile')
  .get(protect, isBendahara, getMyProfile)
  .put(protect, isBendahara, updateMyProfile);

router.route('/credentials')
  .put(protect, isBendahara, updateMyCredentials);

export default router;