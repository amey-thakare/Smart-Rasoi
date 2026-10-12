import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected current user endpoint
router.get('/me', requireAuth, getMe);

export default router;
