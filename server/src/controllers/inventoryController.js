import {
  createInventoryItem,
  listInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  getInventorySummary
} from '../services/inventoryService.js';

/**
 * Controller: POST /api/inventory
 */
export const createItem = async (req, res, next) => {
  try {
    const item = await createInventoryItem(req.userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/inventory
 */
export const listItems = async (req, res, next) => {
  try {
    const items = await listInventoryItems(req.userId, req.query);
    return res.status(200).json({
      success: true,
      data: {
        items,
        count: items.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/inventory/summary
 */
export const getSummary = async (req, res, next) => {
  try {
    const summary = await getInventorySummary(req.userId);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/inventory/:id
 */
export const getItem = async (req, res, next) => {
  try {
    const item = await getInventoryItemById(req.userId, req.params.id);
    return res.status(200).json({
      success: true,
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: PATCH /api/inventory/:id
 */
export const updateItem = async (req, res, next) => {
  try {
    const updatedItem = await updateInventoryItem(req.userId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: { item: updatedItem }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: DELETE /api/inventory/:id
 */
export const deleteItem = async (req, res, next) => {
  try {
    const result = await deleteInventoryItem(req.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
