import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import recipeRoutes from './recipeRoutes.js';
import aiRoutes from './aiRoutes.js';
import mealPlanRoutes from './mealPlanRoutes.js';
import shoppingListRoutes from './shoppingListRoutes.js';
import ingredientPriceRoutes from './ingredientPriceRoutes.js';

const router = Router();

// Health check endpoint
router.use('/health', healthRoutes);

// Authentication endpoints (/api/auth)
router.use('/auth', authRoutes);

// User profile endpoints (/api/users)
router.use('/users', userRoutes);

// Smart Kitchen Inventory endpoints (/api/inventory)
router.use('/inventory', inventoryRoutes);

// Recipe Management & Inventory Matching endpoints (/api/recipes)
router.use('/recipes', recipeRoutes);

// AI Kitchen Assistant endpoints (/api/ai)
router.use('/ai', aiRoutes);

// Meal Planning & Inventory Deduction endpoints (/api/meal-plans)
router.use('/meal-plans', mealPlanRoutes);

// Smart Shopping Lists & Budgets endpoints (/api/shopping-lists)
router.use('/shopping-lists', shoppingListRoutes);

// Ingredient Price Tracking endpoints (/api/ingredient-prices)
router.use('/ingredient-prices', ingredientPriceRoutes);

export default router;
