import prisma from '../config/prisma.js';

export class InventoryError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'InventoryError';
    this.statusCode = statusCode;
  }
}

/**
 * Validates and parses a date value
 * Returns a valid Date object or null if falsy, throws if invalid
 */
const parseDate = (val, fieldName) => {
  if (val === undefined || val === null || val === '') return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    throw new InventoryError(`Invalid date format for ${fieldName}`, 400);
  }
  return d;
};

/**
 * Whitelist of permitted sort fields
 */
const ALLOWED_SORT_FIELDS = ['name', 'quantity', 'expiryDate', 'createdAt'];

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (userId, data) => {
  const {
    name,
    category,
    quantity,
    unit,
    minimumQuantity,
    purchaseDate,
    expiryDate,
    notes
  } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new InventoryError('Ingredient name is required and cannot be empty', 400);
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    throw new InventoryError('Category is required', 400);
  }

  if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
    throw new InventoryError('Quantity is required and must be a number', 400);
  }

  const numQuantity = Number(quantity);
  if (numQuantity < 0) {
    throw new InventoryError('Quantity cannot be negative', 400);
  }

  if (!unit || typeof unit !== 'string' || !unit.trim()) {
    throw new InventoryError('Unit of measurement is required', 400);
  }

  let numMinQuantity = 1;
  if (minimumQuantity !== undefined && minimumQuantity !== null && minimumQuantity !== '') {
    if (isNaN(Number(minimumQuantity))) {
      throw new InventoryError('Minimum quantity must be a valid number', 400);
    }
    numMinQuantity = Number(minimumQuantity);
    if (numMinQuantity < 0) {
      throw new InventoryError('Minimum quantity cannot be negative', 400);
    }
  }

  const parsedPurchaseDate = parseDate(purchaseDate, 'purchaseDate');
  const parsedExpiryDate = parseDate(expiryDate, 'expiryDate');

  const trimmedNotes = notes && typeof notes === 'string' ? notes.trim() : null;

  const item = await prisma.inventoryItem.create({
    data: {
      name: name.trim(),
      category: category.trim(),
      quantity: numQuantity,
      unit: unit.trim(),
      minimumQuantity: numMinQuantity,
      purchaseDate: parsedPurchaseDate,
      expiryDate: parsedExpiryDate,
      notes: trimmedNotes,
      userId
    }
  });

  return item;
};

/**
 * List inventory items for a user with search, filtering, and sorting
 */
export const listInventoryItems = async (userId, query = {}) => {
  const {
    search,
    category,
    expiry,
    lowStock,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  // Validate sort parameters
  const validSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = ['asc', 'desc'].includes(String(sortOrder).toLowerCase())
    ? String(sortOrder).toLowerCase()
    : 'desc';

  const where = {
    userId
  };

  // Search by name
  if (search && typeof search === 'string' && search.trim()) {
    where.name = {
      contains: search.trim()
    };
  }

  // Filter by category
  if (category && typeof category === 'string' && category.trim() && category !== 'all') {
    where.category = category.trim();
  }

  const now = new Date();
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Filter by expiry status
  if (expiry) {
    if (expiry === 'expired') {
      where.expiryDate = {
        lt: now
      };
    } else if (expiry === 'expiring-soon') {
      where.expiryDate = {
        gte: now,
        lte: sevenDaysAhead
      };
    } else if (expiry === 'fresh') {
      where.expiryDate = {
        gt: sevenDaysAhead
      };
    }
  }

  // Fetch items sorted
  let items = await prisma.inventoryItem.findMany({
    where,
    orderBy: {
      [validSortBy]: validSortOrder
    }
  });

  // Filter low stock if requested (quantity <= minimumQuantity)
  if (lowStock === 'true' || lowStock === true) {
    items = items.filter((item) => item.quantity <= item.minimumQuantity);
  }

  return items;
};

/**
 * Get a single inventory item by ID (with ownership verification)
 */
export const getInventoryItemById = async (userId, itemId) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId }
  });

  if (!item || item.userId !== userId) {
    throw new InventoryError('Inventory item not found', 404);
  }

  return item;
};

/**
 * Update an inventory item
 */
export const updateInventoryItem = async (userId, itemId, updateData) => {
  // Check existence & ownership
  const existingItem = await prisma.inventoryItem.findUnique({
    where: { id: itemId }
  });

  if (!existingItem || existingItem.userId !== userId) {
    throw new InventoryError('Inventory item not found', 404);
  }

  if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
    throw new InventoryError('Update payload cannot be empty', 400);
  }

  const allowedFields = [
    'name',
    'category',
    'quantity',
    'unit',
    'minimumQuantity',
    'purchaseDate',
    'expiryDate',
    'notes'
  ];

  // Disallow updates to protected fields
  const forbiddenFields = ['id', 'userId', 'createdAt', 'updatedAt'];
  for (const key of Object.keys(updateData)) {
    if (forbiddenFields.includes(key)) {
      throw new InventoryError(`Field '${key}' cannot be modified`, 400);
    }
    if (!allowedFields.includes(key)) {
      throw new InventoryError(`Unsupported field '${key}' in update payload`, 400);
    }
  }

  const cleanData = {};

  if (updateData.name !== undefined) {
    if (typeof updateData.name !== 'string' || !updateData.name.trim()) {
      throw new InventoryError('Ingredient name cannot be empty', 400);
    }
    cleanData.name = updateData.name.trim();
  }

  if (updateData.category !== undefined) {
    if (typeof updateData.category !== 'string' || !updateData.category.trim()) {
      throw new InventoryError('Category cannot be empty', 400);
    }
    cleanData.category = updateData.category.trim();
  }

  if (updateData.quantity !== undefined) {
    if (isNaN(Number(updateData.quantity))) {
      throw new InventoryError('Quantity must be a valid number', 400);
    }
    const numQ = Number(updateData.quantity);
    if (numQ < 0) {
      throw new InventoryError('Quantity cannot be negative', 400);
    }
    cleanData.quantity = numQ;
  }

  if (updateData.unit !== undefined) {
    if (typeof updateData.unit !== 'string' || !updateData.unit.trim()) {
      throw new InventoryError('Unit of measurement cannot be empty', 400);
    }
    cleanData.unit = updateData.unit.trim();
  }

  if (updateData.minimumQuantity !== undefined) {
    if (isNaN(Number(updateData.minimumQuantity))) {
      throw new InventoryError('Minimum quantity must be a valid number', 400);
    }
    const numMin = Number(updateData.minimumQuantity);
    if (numMin < 0) {
      throw new InventoryError('Minimum quantity cannot be negative', 400);
    }
    cleanData.minimumQuantity = numMin;
  }

  if (updateData.purchaseDate !== undefined) {
    cleanData.purchaseDate = parseDate(updateData.purchaseDate, 'purchaseDate');
  }

  if (updateData.expiryDate !== undefined) {
    cleanData.expiryDate = parseDate(updateData.expiryDate, 'expiryDate');
  }

  if (updateData.notes !== undefined) {
    cleanData.notes = updateData.notes && typeof updateData.notes === 'string' ? updateData.notes.trim() : null;
  }

  const updatedItem = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: cleanData
  });

  return updatedItem;
};

/**
 * Delete an inventory item
 */
export const deleteInventoryItem = async (userId, itemId) => {
  const existingItem = await prisma.inventoryItem.findUnique({
    where: { id: itemId }
  });

  if (!existingItem || existingItem.userId !== userId) {
    throw new InventoryError('Inventory item not found', 404);
  }

  await prisma.inventoryItem.delete({
    where: { id: itemId }
  });

  return { success: true, message: 'Item deleted successfully' };
};

/**
 * Get inventory statistics and summary counts for a user
 */
export const getInventorySummary = async (userId) => {
  const now = new Date();
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [totalItems, expiredItems, expiringSoonItems, allUserItems] = await Promise.all([
    prisma.inventoryItem.count({ where: { userId } }),
    prisma.inventoryItem.count({
      where: {
        userId,
        expiryDate: { lt: now }
      }
    }),
    prisma.inventoryItem.count({
      where: {
        userId,
        expiryDate: {
          gte: now,
          lte: sevenDaysAhead
        }
      }
    }),
    prisma.inventoryItem.findMany({
      where: { userId },
      select: { quantity: true, minimumQuantity: true }
    })
  ]);

  const lowStockItems = allUserItems.filter((i) => i.quantity <= i.minimumQuantity).length;

  return {
    totalItems,
    expiredItems,
    expiringSoonItems,
    lowStockItems
  };
};
