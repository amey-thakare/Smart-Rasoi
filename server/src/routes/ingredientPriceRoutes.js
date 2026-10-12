import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as controller from '../controllers/shoppingListController.js';

const router = Router();

// Protect all ingredient price endpoints
router.use(requireAuth);

router.get('/trends', controller.getIngredientPriceTrends);
router.get('/', controller.getIngredientPrices);
router.post('/', controller.recordIngredientPrice);

export default router;
