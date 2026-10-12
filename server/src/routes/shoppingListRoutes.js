import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as controller from '../controllers/shoppingListController.js';

const router = Router();

// Protect all shopping list endpoints
router.use(requireAuth);

// General budget settings & dashboard summary
router.get('/dashboard-summary', controller.getDashboardSummary);
router.get('/budget-settings', controller.getBudgetSettings);
router.patch('/budget-settings', controller.updateBudgetSettings);

// Top-level meal plan generation (creates new list or updates target)
router.post('/generate-from-meal-plan', controller.generateFromMealPlan);

// Core shopping list CRUD
router.get('/', controller.getShoppingLists);
router.post('/', controller.createShoppingList);
router.get('/:id', controller.getShoppingListById);
router.patch('/:id', controller.updateShoppingList);
router.delete('/:id', controller.deleteShoppingList);

// Summary & Optimisation
router.get('/:id/summary', controller.getShoppingListById);
router.get('/:id/optimisation', controller.getOptimisation);
router.post('/:id/ai-advice', controller.getAiAdvice);
router.post('/:id/generate-from-meal-plan', controller.generateFromMealPlan);

// Items CRUD
router.post('/:id/items', controller.addItem);
router.patch('/:id/items/:itemId', controller.updateItem);
router.delete('/:id/items/:itemId', controller.deleteItem);

// Purchase marking & Inventory addition
router.post('/:id/items/:itemId/purchase', controller.purchaseItem);
router.post('/:id/items/:itemId/add-to-inventory', controller.addItemToInventory);

export default router;
