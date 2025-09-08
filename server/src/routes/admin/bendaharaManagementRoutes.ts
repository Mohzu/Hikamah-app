import express from 'express';
import { isAdmin } from '../../middleware/authMiddleware.js';
import { getAllBendahara, createBendahara, deleteBendahara } from '../../controllers/admin/bendaharaManagementController.js';

const router = express.Router();

router.route('/')
  .get(isAdmin, getAllBendahara)
  .post(isAdmin, createBendahara);

router.route('/:id')
  .delete(isAdmin, deleteBendahara);

export default router;