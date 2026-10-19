import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import {
  getExpiry,
  recordWaste,
  reverseWaste,
  getRecords,
  getAnalytics,
  getAtRisk,
  getRecipeSuggestions,
  getSummary,
  getAiAdvice
} from '../controllers/wasteController.js';

const router = Router();

// All waste and expiry routes require authentication
router.use(requireAuth);

// Expiry tracking
router.get('/expiry', getExpiry);
router.get('/at-risk', getAtRisk);
router.get('/recipe-suggestions', getRecipeSuggestions);

// Dashboard summary
router.get('/summary', getSummary);

// Analytics
router.get('/analytics', getAnalytics);

// Waste records CRUD & reversals
router.get('/records', getRecords);
router.post('/records', recordWaste);
router.post('/records/:id/reverse', reverseWaste);

// AI waste advisor
router.post('/ai-advice', aiRateLimiter, getAiAdvice);

export default router;
