/**
 * Smart Rasoi - Phase 9 Nutrition Routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import {
  getProfile,
  updateProfile,
  getRecipeNutritionEstimate,
  recalculateRecipeNutritionEstimate,
  getDaily,
  getWeekly,
  getHistory,
  logMeal,
  updateMeal,
  deleteMeal,
  getAssistantAdvice,
  getDashboardSummary
} from '../controllers/nutritionController.js';

const router = Router();

// All nutrition routes require an authenticated user session
router.use(requireAuth);

// Profile and Goals
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Recipe Nutrition Calculations
router.get('/recipes/:recipeId', getRecipeNutritionEstimate);
router.post('/recipes/:recipeId/calculate', recalculateRecipeNutritionEstimate);

// Daily & Weekly Tracking
router.get('/daily', getDaily);
router.get('/weekly', getWeekly);
router.get('/dashboard-summary', getDashboardSummary);

// Consumption History & Logging
router.get('/history', getHistory);
router.post('/consumption', logMeal);
router.patch('/consumption/:id', updateMeal);
router.delete('/consumption/:id', deleteMeal);

// AI Nutrition Assistant
router.post('/assistant', aiRateLimiter, getAssistantAdvice);

export default router;
