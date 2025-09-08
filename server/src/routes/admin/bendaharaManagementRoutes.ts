import express from 'express';
import { protect, isAdmin } from '../../middleware/authMiddleware.js';
import { getAllBendahara, createBendaharaAccount, deleteBendahara } from '../../controllers/admin/bendaharaManagementController.js';

const router = express.Router();

// GET all bendahara
router.route('/')
  .get(protect, isAdmin, getAllBendahara);

// POST a new bendahara
router.route('/create')
  .post(protect, isAdmin, createBendaharaAccount); // Menggunakan nama fungsi yang benar

// DELETE a bendahara
router.route('/:id')
  .delete(protect, isAdmin, deleteBendahara);

export default router;