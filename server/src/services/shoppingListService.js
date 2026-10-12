import prisma from '../config/prisma.js';
import { normalizeUnit, convertQuantity } from '../utils/unitUtils.js';
import { calculateRequirements } from './mealPlanService.js';
import { getLatestPriceForIngredient, recordPrice } from './ingredientPriceService.js';
import { generateGeminiContent } from './geminiService.js';

export class ShoppingListError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = 'ShoppingListError';
    this.status = status;
    this.statusCode = status;
    this.details = details;
  }
}

const normalizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase();
};

/**
 * Calculates metrics and totals for a shopping list and its items
 */
export const calculateListMetrics = (list) => {
  const items = list.items || [];
  let estimatedTotal = 0;
  let actualTotal = 0;
  let hasUnknownPrices = false;
  let purchasedCount = 0;

  for (const item of items) {
    if (item.isPurchased) {
      purchasedCount += 1;
      if (item.actualTotalPrice !== null && item.actualTotalPrice !== undefined) {
        actualTotal += item.actualTotalPrice;
      }
    } else {
      if (item.estimatedTotalPrice !== null && item.estimatedTotalPrice !== undefined) {
        estimatedTotal += item.estimatedTotalPrice;
      } else {
        hasUnknownPrices = true;
      }
    }
  }

  // Also include estimated cost of purchased items in overall estimated total for budget planning
  const fullEstimatedTotal = items.reduce((acc, item) => {
    return acc + (item.estimatedTotalPrice || 0);
  }, 0);

  const roundedEstimated = Number(fullEstimatedTotal.toFixed(2));
  const roundedActual = Number(actualTotal.toFixed(2));
  const budget = list.budget !== null && list.budget !== undefined ? Number(list.budget) : null;

  let remainingBudget = null;
  let budgetUtilisationPercent = null;
  let isOverBudget = false;

  if (budget !== null) {
    remainingBudget = Number((budget - roundedActual).toFixed(2));
    if (budget > 0) {
      budgetUtilisationPercent = Number(((roundedActual / budget) * 100).toFixed(1));
    }
    isOverBudget = roundedActual > budget || roundedEstimated > budget;
  }

  return {
    itemsCount: items.length,
    purchasedCount,
    pendingCount: items.length - purchasedCount,
    estimatedTotal: roundedEstimated,
    actualTotal: roundedActual,
    hasUnknownPrices,
    budget,
    remainingBudget,
    budgetUtilisationPercent,
    isOverBudget
  };
};

/**
 * Retrieves all shopping lists for user with summary metrics
 */
export const getShoppingLists = async (userId, filters = {}) => {
  const { status } = filters;

  const where = { userId };
  if (status && ['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(status.toUpperCase())) {
    where.status = status.toUpperCase();
  }

  const lists = await prisma.shoppingList.findMany({
    where,
    include: {
      items: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  return lists.map((list) => {
    const metrics = calculateListMetrics(list);
    return {
      ...list,
      ...metrics
    };
  });
};

/**
 * Creates a new persistent shopping list
 */
export const createShoppingList = async (userId, data = {}) => {
  const { name, budget, notes } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ShoppingListError('Shopping list name is required', 400);
  }

  let parsedBudget = null;
  if (budget !== undefined && budget !== null && budget !== '') {
    const numBudget = Number(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      throw new ShoppingListError('Budget must be a non-negative number', 400);
    }
    parsedBudget = Number(numBudget.toFixed(2));
  }

  const list = await prisma.shoppingList.create({
    data: {
      userId,
      name: name.trim(),
      budget: parsedBudget,
      status: 'ACTIVE',
      notes: notes && typeof notes === 'string' ? notes.trim() : null
    },
    include: {
      items: true
    }
  });

  const metrics = calculateListMetrics(list);
  return { ...list, ...metrics };
};

/**
 * Retrieves a single shopping list with detailed metrics and ordered items
 */
export const getShoppingListById = async (userId, listId) => {
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId },
    include: {
      items: {
        include: {
          inventoryItem: true
        },
        orderBy: [{ isPurchased: 'asc' }, { createdAt: 'desc' }]
      }
    }
  });

  if (!list) {
    throw new ShoppingListError('Shopping list not found', 404);
  }

  const metrics = calculateListMetrics(list);
  return { ...list, ...metrics };
};

/**
 * Updates a shopping list's metadata or budget
 */
export const updateShoppingList = async (userId, listId, updateData = {}) => {
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId }
  });

  if (!list) {
    throw new ShoppingListError('Shopping list not found', 404);
  }

  const dataToUpdate = {};

  if (updateData.name !== undefined) {
    if (!updateData.name || typeof updateData.name !== 'string' || !updateData.name.trim()) {
      throw new ShoppingListError('Shopping list name cannot be empty', 400);
    }
    dataToUpdate.name = updateData.name.trim();
  }

  if (updateData.budget !== undefined) {
    if (updateData.budget === null || updateData.budget === '') {
      dataToUpdate.budget = null;
    } else {
      const numBudget = Number(updateData.budget);
      if (isNaN(numBudget) || numBudget < 0) {
        throw new ShoppingListError('Budget must be a non-negative number', 400);
      }
      dataToUpdate.budget = Number(numBudget.toFixed(2));
    }
  }

  if (updateData.status !== undefined) {
    const s = String(updateData.status).toUpperCase();
    if (!['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(s)) {
      throw new ShoppingListError(`Invalid status: ${updateData.status}. Must be ACTIVE, COMPLETED, or ARCHIVED`, 400);
    }
    dataToUpdate.status = s;
  }

  if (updateData.notes !== undefined) {
    dataToUpdate.notes = updateData.notes && typeof updateData.notes === 'string' ? updateData.notes.trim() : null;
  }

  const updated = await prisma.shoppingList.update({
    where: { id: listId },
    data: dataToUpdate,
    include: { items: true }
  });

  const metrics = calculateListMetrics(updated);
  return { ...updated, ...metrics };
};

/**
 * Deletes a shopping list and all associated items
 */
export const deleteShoppingList = async (userId, listId) => {
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId }
  });

  if (!list) {
    throw new ShoppingListError('Shopping list not found', 404);
  }

  await prisma.shoppingList.delete({
    where: { id: listId }
  });

  return { success: true, deletedId: listId };
};

/**
 * Adds an item manually to a shopping list
 */
export const addItem = async (userId, listId, itemData = {}) => {
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId }
  });

  if (!list) {
    throw new ShoppingListError('Shopping list not found', 404);
  }

  const { ingredientName, quantity, unit, estimatedUnitPrice, notes } = itemData;

  if (!ingredientName || typeof ingredientName !== 'string' || !ingredientName.trim()) {
    throw new ShoppingListError('Ingredient name is required', 400);
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    throw new ShoppingListError('Quantity must be greater than zero', 400);
  }

  if (!unit || typeof unit !== 'string' || !unit.trim()) {
    throw new ShoppingListError('Unit is required', 400);
  }

  const cleanUnit = normalizeUnit(unit);
  let estUnitPrice = null;

  if (estimatedUnitPrice !== undefined && estimatedUnitPrice !== null && estimatedUnitPrice !== '') {
    const numPrice = Number(estimatedUnitPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new ShoppingListError('Estimated unit price must be a non-negative number', 400);
    }
    estUnitPrice = Number(numPrice.toFixed(2));
  } else {
    // Attempt automatic price lookup from user price history
    const historical = await getLatestPriceForIngredient(userId, ingredientName, cleanUnit);
    if (historical && historical.unitPrice) {
      estUnitPrice = Number(historical.unitPrice.toFixed(2));
    }
  }

  const estTotalPrice = estUnitPrice !== null ? Number((numQty * estUnitPrice).toFixed(2)) : null;

  const item = await prisma.shoppingListItem.create({
    data: {
      shoppingListId: listId,
      ingredientName: ingredientName.trim(),
      quantity: Number(numQty.toFixed(2)),
      unit: cleanUnit,
      estimatedUnitPrice: estUnitPrice,
      estimatedTotalPrice: estTotalPrice,
      notes: notes && typeof notes === 'string' ? notes.trim() : null
    }
  });

  return item;
};

/**
 * Updates an item in a shopping list
 */
export const updateItem = async (userId, listId, itemId, itemData = {}) => {
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, shoppingListId: listId, shoppingList: { userId } }
  });

  if (!item) {
    throw new ShoppingListError('Shopping list item not found', 404);
  }

  const dataToUpdate = {};

  if (itemData.ingredientName !== undefined) {
    if (!itemData.ingredientName || typeof itemData.ingredientName !== 'string' || !itemData.ingredientName.trim()) {
      throw new ShoppingListError('Ingredient name cannot be empty', 400);
    }
    dataToUpdate.ingredientName = itemData.ingredientName.trim();
  }

  let finalQty = item.quantity;
  if (itemData.quantity !== undefined) {
    const numQty = Number(itemData.quantity);
    if (isNaN(numQty) || numQty <= 0) {
      throw new ShoppingListError('Quantity must be greater than zero', 400);
    }
    finalQty = Number(numQty.toFixed(2));
    dataToUpdate.quantity = finalQty;
  }

  if (itemData.unit !== undefined) {
    if (!itemData.unit || typeof itemData.unit !== 'string' || !itemData.unit.trim()) {
      throw new ShoppingListError('Unit cannot be empty', 400);
    }
    dataToUpdate.unit = normalizeUnit(itemData.unit);
  }

  if (itemData.estimatedUnitPrice !== undefined) {
    if (itemData.estimatedUnitPrice === null || itemData.estimatedUnitPrice === '') {
      dataToUpdate.estimatedUnitPrice = null;
      dataToUpdate.estimatedTotalPrice = null;
    } else {
      const numPrice = Number(itemData.estimatedUnitPrice);
      if (isNaN(numPrice) || numPrice < 0) {
        throw new ShoppingListError('Estimated unit price must be a non-negative number', 400);
      }
      dataToUpdate.estimatedUnitPrice = Number(numPrice.toFixed(2));
      dataToUpdate.estimatedTotalPrice = Number((finalQty * numPrice).toFixed(2));
    }
  } else if (itemData.quantity !== undefined && item.estimatedUnitPrice !== null) {
    dataToUpdate.estimatedTotalPrice = Number((finalQty * item.estimatedUnitPrice).toFixed(2));
  }

  if (itemData.notes !== undefined) {
    dataToUpdate.notes = itemData.notes && typeof itemData.notes === 'string' ? itemData.notes.trim() : null;
  }

  const updated = await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: dataToUpdate
  });

  return updated;
};

/**
 * Deletes an item from a shopping list
 */
export const deleteItem = async (userId, listId, itemId) => {
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, shoppingListId: listId, shoppingList: { userId } }
  });

  if (!item) {
    throw new ShoppingListError('Shopping list item not found', 404);
  }

  await prisma.shoppingListItem.delete({
    where: { id: itemId }
  });

  return { success: true, deletedId: itemId };
};

/**
 * Marks an item as purchased (or unpurchased) with actual recorded price and quantity
 */
export const purchaseItem = async (userId, listId, itemId, purchaseData = {}) => {
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, shoppingListId: listId, shoppingList: { userId } }
  });

  if (!item) {
    throw new ShoppingListError('Shopping list item not found', 404);
  }

  const { isPurchased = true, purchasedQuantity, purchasedUnit, actualUnitPrice, actualTotalPrice, notes } = purchaseData;

  if (!isPurchased) {
    // Unmark as purchased
    const unmarked = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: {
        isPurchased: false,
        purchasedQuantity: null,
        purchasedUnit: null,
        actualUnitPrice: null,
        actualTotalPrice: null,
        purchasedAt: null
      }
    });
    return unmarked;
  }

  // Marking as purchased
  const cleanQty = purchasedQuantity !== undefined && purchasedQuantity !== null
    ? Number(purchasedQuantity)
    : item.quantity;

  if (isNaN(cleanQty) || cleanQty <= 0) {
    throw new ShoppingListError('Purchased quantity must be greater than zero', 400);
  }

  const cleanUnit = purchasedUnit ? normalizeUnit(purchasedUnit) : item.unit;

  let unitPrice = null;
  let totalPrice = null;

  if (actualTotalPrice !== undefined && actualTotalPrice !== null && actualTotalPrice !== '') {
    const numTotal = Number(actualTotalPrice);
    if (isNaN(numTotal) || numTotal < 0) {
      throw new ShoppingListError('Actual total price must be non-negative', 400);
    }
    totalPrice = Number(numTotal.toFixed(2));
    unitPrice = Number((totalPrice / cleanQty).toFixed(2));
  } else if (actualUnitPrice !== undefined && actualUnitPrice !== null && actualUnitPrice !== '') {
    const numUnit = Number(actualUnitPrice);
    if (isNaN(numUnit) || numUnit < 0) {
      throw new ShoppingListError('Actual unit price must be non-negative', 400);
    }
    unitPrice = Number(numUnit.toFixed(2));
    totalPrice = Number((cleanQty * unitPrice).toFixed(2));
  }

  const updated = await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: {
      isPurchased: true,
      purchasedQuantity: Number(cleanQty.toFixed(2)),
      purchasedUnit: cleanUnit,
      actualUnitPrice: unitPrice,
      actualTotalPrice: totalPrice,
      purchasedAt: new Date(),
      notes: notes !== undefined ? (notes ? notes.trim() : null) : item.notes
    }
  });

  // Automatically record this observation in user price history if price is known
  if (totalPrice !== null && totalPrice > 0) {
    try {
      await recordPrice(userId, {
        ingredientName: item.ingredientName,
        unit: cleanUnit,
        price: totalPrice,
        quantity: cleanQty,
        source: 'PURCHASE'
      });
    } catch {
      // Non-blocking for purchase marking
    }
  }

  return updated;
};

/**
 * Adds a purchased shopping list item to the user's kitchen inventory
 */
export const addItemToInventory = async (userId, listId, itemId, inventoryOptions = {}) => {
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, shoppingListId: listId, shoppingList: { userId } }
  });

  if (!item) {
    throw new ShoppingListError('Shopping list item not found', 404);
  }

  if (!item.isPurchased) {
    throw new ShoppingListError('Item must be marked as purchased before adding to kitchen inventory', 400);
  }

  if (item.addedToInventory) {
    throw new ShoppingListError('This purchased item has already been added to your kitchen inventory', 409);
  }

  const targetQty = item.purchasedQuantity || item.quantity;
  const targetUnit = item.purchasedUnit || item.unit;
  const targetName = inventoryOptions.name || item.ingredientName;
  const category = inventoryOptions.category || 'Pantry';

  const purchaseDate = inventoryOptions.purchaseDate ? new Date(inventoryOptions.purchaseDate) : new Date();
  let expiryDate = null;
  if (inventoryOptions.expiryDate) {
    expiryDate = new Date(inventoryOptions.expiryDate);
  } else if (inventoryOptions.expiryDays && Number(inventoryOptions.expiryDays) > 0) {
    const d = new Date(purchaseDate);
    d.setDate(d.getDate() + Number(inventoryOptions.expiryDays));
    expiryDate = d;
  }

  // Transaction: match existing inventory or create new, link to item, and set addedToInventory
  const result = await prisma.$transaction(async (tx) => {
    // Find active user inventory items matching name
    const existingItems = await tx.inventoryItem.findMany({
      where: { userId }
    });

    const match = existingItems.find(
      (inv) => normalizeName(inv.name) === normalizeName(targetName)
    );

    let inventoryRecord;

    if (match) {
      // Check unit compatibility
      const conversion = convertQuantity(targetQty, targetUnit, match.unit);
      if (conversion.compatible) {
        // Safe to add to existing stock
        inventoryRecord = await tx.inventoryItem.update({
          where: { id: match.id },
          data: {
            quantity: Number((match.quantity + conversion.convertedQuantity).toFixed(2)),
            purchaseDate: purchaseDate,
            expiryDate: expiryDate || match.expiryDate
          }
        });
      } else {
        // Unit incompatible - create separate safe item to avoid corrupting stock
        inventoryRecord = await tx.inventoryItem.create({
          data: {
            userId,
            name: targetName.trim(),
            quantity: Number(targetQty.toFixed(2)),
            unit: targetUnit,
            category,
            purchaseDate,
            expiryDate,
            notes: `Added from shopping list: ${item.ingredientName}`
          }
        });
      }
    } else {
      // New inventory item
      inventoryRecord = await tx.inventoryItem.create({
        data: {
          userId,
          name: targetName.trim(),
          quantity: Number(targetQty.toFixed(2)),
          unit: targetUnit,
          category,
          purchaseDate,
          expiryDate,
          notes: `Added from shopping list: ${item.ingredientName}`
        }
      });
    }

    const updatedItem = await tx.shoppingListItem.update({
      where: { id: itemId },
      data: {
        addedToInventory: true,
        inventoryItemId: inventoryRecord.id
      }
    });

    return { item: updatedItem, inventoryItem: inventoryRecord };
  });

  return result;
};

/**
 * Generates or updates a shopping list from meal plan ingredient shortfalls
 */
export const generateFromMealPlan = async (userId, options = {}) => {
  const {
    from,
    to,
    mealPlanIds,
    targetListId,
    newListName,
    budget,
    includeOptional = false
  } = options;

  // 1. Calculate requirements from mealPlanService
  const reqResult = await calculateRequirements(userId, { from, to, mealPlanIds });
  const rawShortfalls = reqResult.requirements || reqResult.results || [];
  const summary = reqResult.summary || {};

  // 2. Filter for items that need to be purchased
  const shortfallItems = rawShortfalls.filter((r) => {
    if (!includeOptional && r.isOptional) return false;
    return r.shortfall > 0 || r.status === 'missing' || r.status === 'shortfall' || r.status === 'review_needed';
  });

  // 3. For each shortfall, find estimated prices
  const proposedItems = [];
  for (const sf of shortfallItems) {
    const historical = await getLatestPriceForIngredient(userId, sf.name, sf.unit);
    const estUnitPrice = historical?.unitPrice ? Number(historical.unitPrice.toFixed(2)) : null;
    const estTotalPrice = estUnitPrice !== null ? Number((sf.shortfall * estUnitPrice).toFixed(2)) : null;

    proposedItems.push({
      ingredientName: sf.name,
      quantity: sf.shortfall,
      unit: sf.unit,
      estimatedUnitPrice: estUnitPrice,
      estimatedTotalPrice: estTotalPrice,
      isOptional: sf.isOptional,
      requiresManualReview: sf.requiresManualReview,
      meals: sf.meals
    });
  }

  // 4. If targetListId provided, update existing list without losing user entered data
  if (targetListId) {
    const existingList = await prisma.shoppingList.findFirst({
      where: { id: targetListId, userId },
      include: { items: true }
    });

    if (!existingList) {
      throw new ShoppingListError('Target shopping list not found', 404);
    }

    const added = [];
    const updated = [];
    const retained = [];

    await prisma.$transaction(async (tx) => {
      for (const prop of proposedItems) {
        const existingItem = existingList.items.find(
          (it) => normalizeName(it.ingredientName) === normalizeName(prop.ingredientName)
        );

        if (existingItem) {
          // If already purchased, retain as is
          if (existingItem.isPurchased) {
            retained.push(existingItem);
            continue;
          }

          // Preserve user-entered prices if already set
          const finalUnitPrice = existingItem.estimatedUnitPrice ?? prop.estimatedUnitPrice;
          const finalTotalPrice = finalUnitPrice !== null
            ? Number((prop.quantity * finalUnitPrice).toFixed(2))
            : null;

          const updatedItem = await tx.shoppingListItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: prop.quantity,
              unit: prop.unit,
              estimatedUnitPrice: finalUnitPrice,
              estimatedTotalPrice: finalTotalPrice
            }
          });
          updated.push(updatedItem);
        } else {
          // Add new item
          const newItem = await tx.shoppingListItem.create({
            data: {
              shoppingListId: targetListId,
              ingredientName: prop.ingredientName,
              quantity: prop.quantity,
              unit: prop.unit,
              estimatedUnitPrice: prop.estimatedUnitPrice,
              estimatedTotalPrice: prop.estimatedTotalPrice
            }
          });
          added.push(newItem);
        }
      }
    });

    const refreshed = await getShoppingListById(userId, targetListId);
    return {
      list: refreshed,
      changeSummary: {
        addedCount: added.length,
        updatedCount: updated.length,
        retainedCount: retained.length
      },
      proposedItems
    };
  }

  // 5. Otherwise create new shopping list
  const listName = newListName && typeof newListName === 'string' && newListName.trim()
    ? newListName.trim()
    : `Meal Plan Groceries (${from || 'Upcoming'})`;

  let parsedBudget = null;
  if (budget !== undefined && budget !== null && budget !== '') {
    const numBudget = Number(budget);
    if (!isNaN(numBudget) && numBudget >= 0) {
      parsedBudget = Number(numBudget.toFixed(2));
    }
  }

  const createdList = await prisma.$transaction(async (tx) => {
    const list = await tx.shoppingList.create({
      data: {
        userId,
        name: listName,
        budget: parsedBudget,
        status: 'ACTIVE'
      }
    });

    for (const prop of proposedItems) {
      await tx.shoppingListItem.create({
        data: {
          shoppingListId: list.id,
          ingredientName: prop.ingredientName,
          quantity: prop.quantity,
          unit: prop.unit,
          estimatedUnitPrice: prop.estimatedUnitPrice,
          estimatedTotalPrice: prop.estimatedTotalPrice
        }
      });
    }

    return list;
  });

  const fullList = await getShoppingListById(userId, createdList.id);
  return {
    list: fullList,
    changeSummary: {
      addedCount: proposedItems.length,
      updatedCount: 0,
      retainedCount: 0
    },
    proposedItems
  };
};

/**
 * Generates cost optimisation insights and actionable savings for a shopping list
 */
export const getCostOptimisation = async (userId, listId) => {
  const list = await getShoppingListById(userId, listId);
  const items = list.items || [];

  // 1. Identify most expensive items
  const pricedItems = items
    .filter((it) => it.estimatedTotalPrice !== null && it.estimatedTotalPrice > 0)
    .sort((a, b) => (b.estimatedTotalPrice || 0) - (a.estimatedTotalPrice || 0));

  const mostExpensiveItems = pricedItems.slice(0, 5).map((it) => ({
    id: it.id,
    ingredientName: it.ingredientName,
    quantity: it.quantity,
    unit: it.unit,
    estimatedTotalPrice: it.estimatedTotalPrice,
    percentOfTotal: list.estimatedTotal > 0
      ? Number(((it.estimatedTotalPrice / list.estimatedTotal) * 100).toFixed(1))
      : 0
  }));

  // 2. Missing price items
  const missingPriceItems = items
    .filter((it) => it.estimatedTotalPrice === null && !it.isPurchased)
    .map((it) => ({
      id: it.id,
      ingredientName: it.ingredientName,
      quantity: it.quantity,
      unit: it.unit
    }));

  // 3. Actionable tips
  const tips = [];

  if (missingPriceItems.length > 0) {
    tips.push({
      type: 'INFO',
      title: 'Missing Price Estimates',
      description: `${missingPriceItems.length} item(s) do not have recorded price estimates yet. Enter prices to see an accurate total budget forecast.`
    });
  }

  if (list.isOverBudget) {
    const diff = Number((list.estimatedTotal - (list.budget || 0)).toFixed(2));
    tips.push({
      type: 'WARNING',
      title: 'Estimated Overrun',
      description: `Estimated cost exceeds your allocated budget by ₹${diff}. Consider prioritizing staple ingredients or adjusting meal servings.`
    });
  } else if (list.budget !== null) {
    tips.push({
      type: 'SUCCESS',
      title: 'Within Budget',
      description: `Estimated cost is currently within your list budget with ₹${list.remainingBudget} remaining buffer.`
    });
  }

  if (mostExpensiveItems.length > 0 && mostExpensiveItems[0].percentOfTotal >= 25) {
    tips.push({
      type: 'SAVING',
      title: `High Cost Driver: ${mostExpensiveItems[0].ingredientName}`,
      description: `${mostExpensiveItems[0].ingredientName} accounts for ${mostExpensiveItems[0].percentOfTotal}% of your total estimated grocery cost (₹${mostExpensiveItems[0].estimatedTotalPrice}).`
    });
  }

  return {
    listId: list.id,
    listName: list.name,
    budget: list.budget,
    estimatedTotal: list.estimatedTotal,
    actualTotal: list.actualTotal,
    hasUnknownPrices: list.hasUnknownPrices,
    isOverBudget: list.isOverBudget,
    mostExpensiveItems,
    missingPriceCount: missingPriceItems.length,
    missingPriceItems,
    tips
  };
};

/**
 * Optional Gemini AI culinary shopping recommendations
 */
export const getAiShoppingAdvice = async (userId, listId, data = {}) => {
  const { query, conversationHistory = [] } = data;
  const list = await getShoppingListById(userId, listId);
  const optimisation = await getCostOptimisation(userId, listId);

  const promptContext = {
    listName: list.name,
    budget: list.budget,
    estimatedTotal: list.estimatedTotal,
    items: list.items.map((i) => ({
      name: i.ingredientName,
      quantity: i.quantity,
      unit: i.unit,
      estimatedPrice: i.estimatedTotalPrice,
      isPurchased: i.isPurchased
    })),
    mostExpensive: optimisation.mostExpensiveItems
  };

  const systemInstruction = `You are Chef Rasoi, an expert culinary financial advisor for Smart Rasoi.
Analyze the user's shopping list and provide practical, delicious, and budget-friendly grocery optimization tips.
RULES:
1. Ground your advice strictly in the provided items and budget.
2. DO NOT fabricate verified live market prices. If an item lacks a price, acknowledge that limitation.
3. Suggest practical culinary alternatives or batching tips that preserve nutrition and flavor.
4. Keep advice concise, encouraging, and actionable. Format with bullet points.`;

  const userPrompt = `Shopping list context: ${JSON.stringify(promptContext)}
User query: ${query || 'How can I optimize this shopping list to save money while eating well?'}`;

  try {
    const reply = await generateGeminiContent({
      contents: userPrompt,
      systemInstruction
    });

    return {
      success: true,
      reply: reply || 'No response generated.',
      meta: { listId }
    };
  } catch (err) {
    if (err.statusCode) {
      throw new ShoppingListError(err.message, err.statusCode);
    }
    throw new ShoppingListError('Unable to generate AI shopping recommendations.', 502);
  }
};

/**
 * Gets or updates user budget preferences
 */
export const getBudgetSettings = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyBudget: true, weeklyBudget: true }
  });
  return user || { monthlyBudget: null, weeklyBudget: null };
};

export const updateBudgetSettings = async (userId, data = {}) => {
  const dataToUpdate = {};
  if (data.monthlyBudget !== undefined) {
    dataToUpdate.monthlyBudget = data.monthlyBudget === null || data.monthlyBudget === ''
      ? null
      : Number(Number(data.monthlyBudget).toFixed(2));
  }
  if (data.weeklyBudget !== undefined) {
    dataToUpdate.weeklyBudget = data.weeklyBudget === null || data.weeklyBudget === ''
      ? null
      : Number(Number(data.weeklyBudget).toFixed(2));
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: { monthlyBudget: true, weeklyBudget: true }
  });

  return updated;
};

/**
 * Dashboard shopping summary with real SQLite metrics
 */
export const getDashboardShoppingSummary = async (userId) => {
  const activeLists = await prisma.shoppingList.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { items: true },
    orderBy: { updatedAt: 'desc' }
  });

  const latestList = activeLists[0] || null;
  const metrics = latestList ? calculateListMetrics(latestList) : null;

  // Total pending items across all active lists
  let allPendingCount = 0;
  let totalEstimatedCost = 0;
  const pendingItems = [];

  for (const l of activeLists) {
    for (const it of l.items) {
      if (!it.isPurchased) {
        allPendingCount += 1;
        if (it.estimatedTotalPrice !== null) {
          totalEstimatedCost += it.estimatedTotalPrice;
        }
        pendingItems.push(it);
      }
    }
  }

  // Top expensive pending items
  const mostExpensivePending = pendingItems
    .filter((it) => it.estimatedTotalPrice !== null)
    .sort((a, b) => (b.estimatedTotalPrice || 0) - (a.estimatedTotalPrice || 0))
    .slice(0, 3)
    .map((it) => ({
      name: it.ingredientName,
      quantity: it.quantity,
      unit: it.unit,
      price: it.estimatedTotalPrice
    }));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyBudget: true, weeklyBudget: true }
  });

  return {
    hasActiveList: Boolean(latestList),
    activeListId: latestList?.id || null,
    activeListName: latestList?.name || null,
    activeListMetrics: metrics,
    totalPendingItems: allPendingCount,
    totalEstimatedCost: Number(totalEstimatedCost.toFixed(2)),
    mostExpensivePending,
    monthlyBudget: user?.monthlyBudget || null,
    weeklyBudget: user?.weeklyBudget || null
  };
};
