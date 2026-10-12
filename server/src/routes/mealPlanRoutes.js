import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  listMealPlans,
  getMealPlan,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  skipMealPlan,
  cancelMealPlan,
  getRequirements,
  getCookPreview,
  cookMeal,
  reverseConsumption,
  getDashboardSummary
} from '../controllers/mealPlanController.js';

const router = Router();

// Require authentication for all meal-plan endpoints
router.use(requireAuth);

// Collection endpoints
router.get('/', listMealPlans);
router.post('/', createMealPlan);

// Specialized collection endpoints (placed before /:id)
router.get('/requirements', getRequirements);
router.get('/dashboard-summary', getDashboardSummary);

// Single meal plan endpoints
router.get('/:id', getMealPlan);
router.patch('/:id', updateMealPlan);
router.delete('/:id', deleteMealPlan);

// Cooking & consumption workflow endpoints
router.post('/:id/cook-preview', getCookPreview);
router.post('/:id/cook', cookMeal);
router.post('/:id/reverse-consumption', reverseConsumption);

// Status transition endpoints
router.post('/:id/skip', skipMealPlan);
router.post('/:id/cancel', cancelMealPlan);

export default router;
