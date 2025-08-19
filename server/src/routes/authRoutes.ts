import express, { Router, Request, Response, NextFunction } from 'express';
import { register, login, logout, getLoginStatus } from '../controllers/authController.js';
import { isLoggedIn } from '../middleware/authMiddleware.js';

const router: Router = express.Router();

// Middleware logging khusus untuk file rute ini
router.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[AUTH ROUTE] Request diterima di authRoutes untuk path: ${req.path}`);
    next();
});

// Rute-rute
router.post('/register', register);
router.post('/login', login);
router.get('/status', getLoginStatus);
router.post('/logout', isLoggedIn, logout);

export default router;