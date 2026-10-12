import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getRecipes,
  getMatches,
  getFavourites,
  getRecipe,
  createRecipeItem,
  updateRecipeItem,
  deleteRecipeItem,
  postFavourite,
  deleteFavourite
} from '../controllers/recipeController.js';

const router = Router();

// Require authentication for all recipe endpoints
router.use(requireAuth);

// Collection endpoints
router.get('/', getRecipes);
router.post('/', createRecipeItem);

// Inventory matching & Favourites collection endpoints (MUST precede /:id)
router.get('/matches', getMatches);
router.get('/favourites', getFavourites);

// Single recipe endpoints
router.get('/:id', getRecipe);
router.patch('/:id', updateRecipeItem);
router.delete('/:id', deleteRecipeItem);

// Favourite toggling on specific recipe
router.post('/:id/favourite', postFavourite);
router.delete('/:id/favourite', deleteFavourite);

export default router;
