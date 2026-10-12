import { Router } from 'express';
import {
  createItem,
  listItems,
  getSummary,
  getItem,
  updateItem,
  deleteItem
} from '../controllers/inventoryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all inventory routes with authentication middleware
router.use(requireAuth);

// Collection endpoints
router.post('/', createItem);
router.get('/', listItems);
router.get('/summary', getSummary);

// Individual item endpoints
router.get('/:id', getItem);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
