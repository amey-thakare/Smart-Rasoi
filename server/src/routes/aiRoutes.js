import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import {
  chat,
  getContext,
  generateRecipe,
  modifyRecipe,
  getSubstitutions,
  scaleRecipe
} from '../controllers/aiController.js';

const router = Router();

// All AI endpoints require authenticated sessions
router.use(requireAuth);

/**
 * Send message to AI Kitchen Assistant
 * POST /api/ai/chat
 */
router.post('/chat', aiRateLimiter, chat);

/**
 * Get AI Assistant safe context summary
 * GET /api/ai/context
 */
router.get('/context', getContext);

/**
 * Generate a new recipe using AI from ingredients and preferences
 * POST /api/ai/recipes/generate
 */
router.post('/recipes/generate', aiRateLimiter, generateRecipe);

/**
 * Modify an existing recipe using AI
 * POST /api/ai/recipes/:id/modify
 */
router.post('/recipes/:id/modify', aiRateLimiter, modifyRecipe);

/**
 * Suggest ingredient substitutions
 * POST /api/ai/substitutions
 */
router.post('/substitutions', aiRateLimiter, getSubstitutions);

/**
 * Adjust recipe serving size with non-linear guidance
 * POST /api/ai/recipes/:id/scale
 */
router.post('/recipes/:id/scale', scaleRecipe);

export default router;
