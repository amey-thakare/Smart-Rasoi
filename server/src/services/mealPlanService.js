import prisma from '../config/prisma.js';
import { normalizeIngredientName } from './recipeService.js';
import { convertQuantity, normalizeUnit } from '../utils/unitUtils.js';
import { calculateRecipeNutrition } from './nutritionCalculatorService.js';

export class MealPlanError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = 'MealPlanError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ALLOWED_MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
export const ALLOWED_STATUSES = ['PLANNED', 'COOKED', 'SKIPPED', 'CANCELLED'];

/**
 * Normalizes input date to midnight UTC Date object
 */
export const normalizeDate = (val, fieldName = 'scheduledDate') => {
  if (!val) {
    throw new MealPlanError(`${fieldName} is required`, 400);
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    throw new MealPlanError(`Invalid date format for ${fieldName}`, 400);
  }
  const isoStr = d.toISOString().split('T')[0];
  return new Date(`${isoStr}T00:00:00.000Z`);
};

/**
 * Normalizes meal type to canonical TitleCase
 */
export const normalizeMealType = (val) => {
  if (!val || typeof val !== 'string') {
    throw new MealPlanError('Meal type is required', 400);
  }
  const lower = val.trim().toLowerCase();
  const match = ALLOWED_MEAL_TYPES.find((t) => t.toLowerCase() === lower);
  if (!match) {
    throw new MealPlanError(
      `Invalid meal type: "${val}". Must be one of: ${ALLOWED_MEAL_TYPES.join(', ')}`,
      400
    );
  }
  return match;
};

/**
 * Normalizes and validates servings count
 */
export const validateServings = (val) => {
  if (val === undefined || val === null || val === '') {
    return 2;
  }
  const num = Number(val);
  if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 50) {
    throw new MealPlanError('Servings must be a positive integer between 1 and 50', 400);
  }
  return num;
};

/**
 * Retrieves meal plans for a user within an optional date range
 */
export const getMealPlans = async (userId, filters = {}) => {
  const { from, to, status, mealType } = filters;

  const where = { userId };

  if (status) {
    const s = String(status).toUpperCase();
    if (ALLOWED_STATUSES.includes(s)) {
      where.status = s;
    }
  }

  if (mealType) {
    try {
      where.mealType = normalizeMealType(mealType);
    } catch {
      // Ignore filter if invalid
    }
  }

  if (from || to) {
    where.scheduledDate = {};
    if (from) {
      const fromD = new Date(from);
      if (!isNaN(fromD.getTime())) {
        const iso = fromD.toISOString().split('T')[0];
        where.scheduledDate.gte = new Date(`${iso}T00:00:00.000Z`);
      }
    }
    if (to) {
      const toD = new Date(to);
      if (!isNaN(toD.getTime())) {
        const iso = toD.toISOString().split('T')[0];
        where.scheduledDate.lte = new Date(`${iso}T23:59:59.999Z`);
      }
    }
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where,
    include: {
      recipe: {
        include: {
          ingredients: true
        }
      },
      consumptions: {
        where: { isReversed: false }
      }
    },
    orderBy: [
      { scheduledDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  return entries.map((entry) => ({
    ...entry,
    scheduledDateStr: entry.scheduledDate.toISOString().split('T')[0],
    isCooked: entry.status === 'COOKED',
    hasDeduction: entry.consumptions?.length > 0
  }));
};

/**
 * Retrieves a single meal plan entry by ID
 */
export const getMealPlanById = async (userId, mealPlanId) => {
  if (!mealPlanId) {
    throw new MealPlanError('Meal plan ID is required', 400);
  }

  const entry = await prisma.mealPlanEntry.findFirst({
    where: { id: mealPlanId, userId },
    include: {
      recipe: {
        include: {
          ingredients: true
        }
      },
      consumptions: true
    }
  });

  if (!entry) {
    throw new MealPlanError('Meal plan entry not found', 404);
  }

  return {
    ...entry,
    scheduledDateStr: entry.scheduledDate.toISOString().split('T')[0],
    isCooked: entry.status === 'COOKED',
    hasDeduction: entry.consumptions?.some((c) => !c.isReversed)
  };
};

/**
 * Creates a new planned meal entry
 */
export const createMealPlanEntry = async (userId, data = {}) => {
  const { recipeId, scheduledDate, mealType, servings, notes } = data;

  if (!recipeId) {
    throw new MealPlanError('Recipe ID is required', 400);
  }

  // Verify recipe exists and is accessible
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      OR: [{ isPublic: true }, { userId }]
    },
    include: { ingredients: true }
  });

  if (!recipe) {
    throw new MealPlanError('Recipe not found or you do not have permission to access it', 404);
  }

  const parsedDate = normalizeDate(scheduledDate, 'scheduledDate');
  const parsedMealType = normalizeMealType(mealType);
  const parsedServings = validateServings(servings ?? recipe.servings);
  const cleanNotes = notes && typeof notes === 'string' ? notes.trim() : null;

  const entry = await prisma.mealPlanEntry.create({
    data: {
      userId,
      recipeId,
      scheduledDate: parsedDate,
      mealType: parsedMealType,
      servings: parsedServings,
      status: 'PLANNED',
      notes: cleanNotes
    },
    include: {
      recipe: {
        include: {
          ingredients: true
        }
      }
    }
  });

  return {
    ...entry,
    scheduledDateStr: entry.scheduledDate.toISOString().split('T')[0]
  };
};

/**
 * Updates an existing planned meal entry
 */
export const updateMealPlanEntry = async (userId, mealPlanId, updateData = {}) => {
  const entry = await prisma.mealPlanEntry.findFirst({
    where: { id: mealPlanId, userId },
    include: {
      consumptions: { where: { isReversed: false } }
    }
  });

  if (!entry) {
    throw new MealPlanError('Meal plan entry not found', 404);
  }

  const isCooked = entry.status === 'COOKED';
  const hasActiveConsumption = entry.consumptions?.length > 0;

  // Protect cooked meals from conflicting mutations
  if (isCooked && hasActiveConsumption) {
    if (updateData.recipeId && updateData.recipeId !== entry.recipeId) {
      throw new MealPlanError(
        'Cannot change recipe for an already cooked meal. Please reverse consumption first.',
        400
      );
    }
    if (updateData.servings && Number(updateData.servings) !== entry.servings) {
      throw new MealPlanError(
        'Cannot change servings for an already cooked meal. Please reverse consumption first.',
        400
      );
    }
  }

  const dataToUpdate = {};

  if (updateData.scheduledDate !== undefined) {
    dataToUpdate.scheduledDate = normalizeDate(updateData.scheduledDate, 'scheduledDate');
  }

  if (updateData.mealType !== undefined) {
    dataToUpdate.mealType = normalizeMealType(updateData.mealType);
  }

  if (updateData.servings !== undefined && !isCooked) {
    dataToUpdate.servings = validateServings(updateData.servings);
  }

  if (updateData.notes !== undefined) {
    dataToUpdate.notes = typeof updateData.notes === 'string' ? updateData.notes.trim() : null;
  }

  if (updateData.recipeId !== undefined && !isCooked) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: updateData.recipeId,
        OR: [{ isPublic: true }, { userId }]
      }
    });
    if (!recipe) {
      throw new MealPlanError('Recipe not found or you do not have permission to access it', 404);
    }
    dataToUpdate.recipeId = updateData.recipeId;
  }

  const updated = await prisma.mealPlanEntry.update({
    where: { id: mealPlanId },
    data: dataToUpdate,
    include: {
      recipe: {
        include: {
          ingredients: true
        }
      },
      consumptions: {
        where: { isReversed: false }
      }
    }
  });

  return {
    ...updated,
    scheduledDateStr: updated.scheduledDate.toISOString().split('T')[0]
  };
};

/**
 * Deletes a meal plan entry
 */
export const deleteMealPlanEntry = async (userId, mealPlanId) => {
  const entry = await prisma.mealPlanEntry.findFirst({
    where: { id: mealPlanId, userId },
    include: {
      consumptions: { where: { isReversed: false } }
    }
  });

  if (!entry) {
    throw new MealPlanError('Meal plan entry not found', 404);
  }

  if (entry.status === 'COOKED' && entry.consumptions?.length > 0) {
    throw new MealPlanError(
      'Cannot delete a cooked meal with active inventory deductions. Please reverse consumption first.',
      400
    );
  }

  await prisma.mealPlanEntry.delete({
    where: { id: mealPlanId }
  });

  return { success: true, deletedId: mealPlanId };
};

/**
 * Transitions meal status to SKIPPED or CANCELLED (does NOT deduct inventory)
 */
export const transitionMealStatus = async (userId, mealPlanId, targetStatus) => {
  const s = String(targetStatus).toUpperCase();
  if (!['SKIPPED', 'CANCELLED'].includes(s)) {
    throw new MealPlanError(`Invalid transition status: ${targetStatus}`, 400);
  }

  const entry = await prisma.mealPlanEntry.findFirst({
    where: { id: mealPlanId, userId },
    include: {
      consumptions: { where: { isReversed: false } }
    }
  });

  if (!entry) {
    throw new MealPlanError('Meal plan entry not found', 404);
  }

  if (entry.status === 'COOKED') {
    throw new MealPlanError(
      `Cannot mark an already cooked meal as ${s}. Please reverse consumption first if needed.`,
      400
    );
  }

  const updated = await prisma.mealPlanEntry.update({
    where: { id: mealPlanId },
    data: { status: s },
    include: {
      recipe: true
    }
  });

  return {
    ...updated,
    scheduledDateStr: updated.scheduledDate.toISOString().split('T')[0]
  };
};

/**
 * Calculates aggregated ingredient requirements across planned meals in a period
 */
export const calculateRequirements = async (userId, filters = {}) => {
  const { from, to, mealPlanIds } = filters;

  const where = {
    userId,
    status: 'PLANNED'
  };

  if (mealPlanIds && Array.isArray(mealPlanIds) && mealPlanIds.length > 0) {
    where.id = { in: mealPlanIds };
  } else if (from || to) {
    where.scheduledDate = {};
    if (from) {
      const fromD = new Date(from);
      if (!isNaN(fromD.getTime())) {
        const iso = fromD.toISOString().split('T')[0];
        where.scheduledDate.gte = new Date(`${iso}T00:00:00.000Z`);
      }
    }
    if (to) {
      const toD = new Date(to);
      if (!isNaN(toD.getTime())) {
        const iso = toD.toISOString().split('T')[0];
        where.scheduledDate.lte = new Date(`${iso}T23:59:59.999Z`);
      }
    }
  }

  const plannedMeals = await prisma.mealPlanEntry.findMany({
    where,
    include: {
      recipe: {
        include: {
          ingredients: true
        }
      }
    },
    orderBy: { scheduledDate: 'asc' }
  });

  // Pull all active user inventory items
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { userId }
  });

  // Aggregate requirements by normalized ingredient name
  const requirementsMap = new Map();

  for (const meal of plannedMeals) {
    const scaleRatio = meal.servings / (meal.recipe.servings || 1);

    for (const ing of meal.recipe.ingredients) {
      const key = normalizeIngredientName(ing.name);
      if (!key) continue;

      const scaledQty = Number((ing.quantity * scaleRatio).toFixed(3));

      if (!requirementsMap.has(key)) {
        requirementsMap.set(key, {
          ingredientKey: key,
          name: ing.name,
          unit: ing.unit,
          totalRequired: 0,
          isOptional: true, // will turn false if ANY recipe requires it
          meals: [],
          earliestScheduledDate: meal.scheduledDate
        });
      }

      const req = requirementsMap.get(key);
      req.totalRequired += scaledQty;
      if (!ing.isOptional) {
        req.isOptional = false;
      }
      if (meal.scheduledDate < req.earliestScheduledDate) {
        req.earliestScheduledDate = meal.scheduledDate;
      }

      req.meals.push({
        mealPlanId: meal.id,
        recipeId: meal.recipe.id,
        recipeTitle: meal.recipe.title,
        scheduledDate: meal.scheduledDate.toISOString().split('T')[0],
        mealType: meal.mealType,
        servings: meal.servings,
        quantity: scaledQty,
        unit: ing.unit
      });
    }
  }

  // Match against inventory items and compute shortfalls
  const results = [];

  for (const req of requirementsMap.values()) {
    req.totalRequired = Number(req.totalRequired.toFixed(2));

    // Find all inventory items matching this ingredient
    const matchingInventory = inventoryItems.filter(
      (item) => normalizeIngredientName(item.name) === req.ingredientKey
    );

    let totalAvailableInStock = 0;
    let unitMismatch = false;
    let mayExpireBeforeMeal = false;
    const inventoryStockUnits = [];

    for (const item of matchingInventory) {
      inventoryStockUnits.push(item.unit);

      // Check expiry against earliest scheduled date
      if (item.expiryDate) {
        const exp = new Date(item.expiryDate);
        if (exp < req.earliestScheduledDate) {
          mayExpireBeforeMeal = true;
        }
      }

      // Check unit compatibility
      const conversion = convertQuantity(item.quantity, item.unit, req.unit);
      if (conversion.compatible) {
        totalAvailableInStock += conversion.convertedQuantity;
      } else {
        unitMismatch = true;
      }
    }

    totalAvailableInStock = Number(totalAvailableInStock.toFixed(2));

    let status = 'sufficient';
    let shortfall = 0;
    let requiresManualReview = false;

    if (unitMismatch && matchingInventory.length > 0) {
      requiresManualReview = true;
      status = 'review_needed';
      shortfall = req.totalRequired; // Cannot assume compatibility
    } else if (matchingInventory.length === 0) {
      status = 'missing';
      shortfall = req.totalRequired;
    } else if (totalAvailableInStock < req.totalRequired) {
      status = 'shortfall';
      shortfall = Number((req.totalRequired - totalAvailableInStock).toFixed(2));
    }

    results.push({
      name: req.name,
      ingredientKey: req.ingredientKey,
      totalRequired: req.totalRequired,
      unit: req.unit,
      availableQuantity: totalAvailableInStock,
      shortfall,
      status, // 'sufficient' | 'shortfall' | 'missing' | 'review_needed'
      isOptional: req.isOptional,
      requiresManualReview,
      mayExpireBeforeMeal,
      inStockUnits: [...new Set(inventoryStockUnits)],
      meals: req.meals
    });
  }

  // Summary counts
  const totalItemsNeeded = results.length;
  const sufficientItemsCount = results.filter((r) => r.status === 'sufficient').length;
  const shortfallItemsCount = results.filter((r) => r.status === 'shortfall' || r.status === 'missing').length;
  const reviewNeededCount = results.filter((r) => r.status === 'review_needed').length;
  const expiringSoonCount = results.filter((r) => r.mayExpireBeforeMeal).length;

  return {
    requirements: results,
    summary: {
      plannedMealsCount: plannedMeals.length,
      totalItemsNeeded,
      sufficientItemsCount,
      shortfallItemsCount,
      reviewNeededCount,
      expiringSoonCount
    }
  };
};

/**
 * Previews inventory deductions before cooking a planned meal
 * Does NOT modify database state.
 */
export const getCookPreview = async (userId, mealPlanId) => {
  const meal = await prisma.mealPlanEntry.findFirst({
    where: { id: mealPlanId, userId },
    include: {
      recipe: {
        include: {
          ingredients: true
        }
      },
      consumptions: {
        where: { isReversed: false }
      }
    }
  });

  if (!meal) {
    throw new MealPlanError('Meal plan entry not found', 404);
  }

  if (meal.status === 'COOKED') {
    throw new MealPlanError('This meal has already been marked as COOKED.', 400);
  }

  const scaleRatio = meal.servings / (meal.recipe.servings || 1);

  // Fetch current user inventory
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { userId }
  });

  const previewIngredients = [];
  let hasAnyShortfall = false;
  let hasAnyUnitMismatch = false;

  for (const ing of meal.recipe.ingredients) {
    const scaledQty = Number((ing.quantity * scaleRatio).toFixed(2));
    const key = normalizeIngredientName(ing.name);

    // Find best inventory match with positive quantity
    const matchingItems = inventoryItems.filter(
      (item) => normalizeIngredientName(item.name) === key && Number(item.quantity) > 0
    );

    let matchedItem = null;
    let convertedAvailable = 0;
    let compatible = false;
    let requiresReview = false;

    if (matchingItems.length > 0) {
      // Find matching item with compatible unit
      for (const item of matchingItems) {
        const conv = convertQuantity(item.quantity, item.unit, ing.unit);
        if (conv.compatible) {
          matchedItem = item;
          convertedAvailable = conv.convertedQuantity;
          compatible = true;
          break;
        }
      }

      // If no compatible unit found, take first match and flag for review
      if (!matchedItem) {
        matchedItem = matchingItems[0];
        compatible = false;
        requiresReview = true;
        hasAnyUnitMismatch = true;
      }
    }

    const available = compatible ? convertedAvailable : 0;
    const shortfall = Math.max(0, Number((scaledQty - available).toFixed(2)));
    const willDeduct = compatible ? Math.min(scaledQty, available) : 0;
    const isSufficient = compatible && available >= scaledQty;

    if (!isSufficient && !ing.isOptional) {
      hasAnyShortfall = true;
    }

    previewIngredients.push({
      ingredientId: ing.id,
      name: ing.name,
      requiredQuantity: scaledQty,
      unit: ing.unit,
      isOptional: ing.isOptional,
      inventoryItemId: matchedItem?.id || null,
      inventoryItemName: matchedItem?.name || null,
      inventoryQuantity: matchedItem ? matchedItem.quantity : 0,
      inventoryUnit: matchedItem?.unit || null,
      availableConverted: available,
      willDeduct,
      shortfall,
      isSufficient,
      requiresReview
    });
  }

  return {
    mealPlanId: meal.id,
    recipeTitle: meal.recipe.title,
    scheduledDate: meal.scheduledDate.toISOString().split('T')[0],
    mealType: meal.mealType,
    servings: meal.servings,
    ingredients: previewIngredients,
    canCookCompletely: !hasAnyShortfall && !hasAnyUnitMismatch,
    hasShortfall: hasAnyShortfall,
    hasUnitMismatch: hasAnyUnitMismatch
  };
};

/**
 * Marks a planned meal as COOKED and atomically deducts inventory
 * Guaranteed atomic execution in Prisma transaction with idempotency checks.
 */
export const cookMealPlan = async (userId, mealPlanId, options = {}) => {
  const { allowPartial = false, customDeductions = null } = options;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch meal inside transaction
    const meal = await tx.mealPlanEntry.findFirst({
      where: { id: mealPlanId, userId },
      include: {
        recipe: {
          include: {
            ingredients: true
          }
        },
        consumptions: {
          where: { isReversed: false }
        }
      }
    });

    if (!meal) {
      throw new MealPlanError('Meal plan entry not found', 404);
    }

    // 2. Strict idempotency checks
    if (meal.status === 'COOKED') {
      throw new MealPlanError('This meal has already been marked as COOKED.', 409);
    }

    if (meal.consumptions && meal.consumptions.length > 0) {
      throw new MealPlanError(
        'Inventory deductions have already been applied to this meal.',
        409
      );
    }

    const scaleRatio = meal.servings / (meal.recipe.servings || 1);

    // 3. Fetch current inventory inside transaction
    const inventoryItems = await tx.inventoryItem.findMany({
      where: { userId }
    });

    const deductionsToApply = [];
    const shortfalls = [];

    for (const ing of meal.recipe.ingredients) {
      const scaledQty = Number((ing.quantity * scaleRatio).toFixed(2));
      const key = normalizeIngredientName(ing.name);

      // Check if custom deduction override was provided
      const customOverride = customDeductions?.find(
        (cd) => normalizeIngredientName(cd.ingredientName) === key
      );

      const matchingItems = inventoryItems.filter(
        (item) => normalizeIngredientName(item.name) === key && Number(item.quantity) > 0
      );

      let targetItem = null;
      let quantityToDeductInItemUnit = 0;

      if (customOverride && customOverride.deductQuantity !== undefined) {
        // User explicitly specified deduction quantity
        targetItem = inventoryItems.find((i) => i.id === customOverride.inventoryItemId) || matchingItems[0];
        if (targetItem) {
          quantityToDeductInItemUnit = Math.min(
            Number(targetItem.quantity),
            Math.max(0, Number(customOverride.deductQuantity))
          );
        }
      } else if (matchingItems.length > 0) {
        // Automatically match with compatible unit
        for (const item of matchingItems) {
          const conv = convertQuantity(scaledQty, ing.unit, item.unit);
          if (conv.compatible) {
            targetItem = item;
            quantityToDeductInItemUnit = conv.convertedQuantity;
            break;
          }
        }
      }

      if (!targetItem) {
        if (!ing.isOptional) {
          shortfalls.push({
            name: ing.name,
            requiredQuantity: scaledQty,
            unit: ing.unit,
            availableQuantity: 0,
            reason: 'Item not in pantry or zero stock'
          });
        }
        continue;
      }

      // Check stock sufficiency
      const currentStock = Number(targetItem.quantity);
      if (currentStock < quantityToDeductInItemUnit) {
        if (!allowPartial && !ing.isOptional) {
          shortfalls.push({
            name: ing.name,
            requiredQuantity: quantityToDeductInItemUnit,
            unit: targetItem.unit,
            availableQuantity: currentStock,
            reason: 'Insufficient quantity in pantry'
          });
        } else {
          // Partial deduction: consume whatever is available
          quantityToDeductInItemUnit = currentStock;
        }
      }

      if (quantityToDeductInItemUnit > 0) {
        deductionsToApply.push({
          inventoryItem: targetItem,
          deductAmount: quantityToDeductInItemUnit,
          ingredientName: ing.name,
          unit: targetItem.unit
        });
      }
    }

    // Abort if strict stock check failed
    if (shortfalls.length > 0 && !allowPartial) {
      throw new MealPlanError(
        `Insufficient inventory to cook "${meal.recipe.title}". Confirm with partial fulfillment or update stock.`,
        400,
        { shortfalls }
      );
    }

    // 4. Apply deductions atomically and write consumption ledger
    const recordedConsumptions = [];

    for (const d of deductionsToApply) {
      const updatedItem = await tx.inventoryItem.update({
        where: { id: d.inventoryItem.id },
        data: {
          quantity: {
            decrement: d.deductAmount
          }
        }
      });

      // Extra safety check against negative values
      if (updatedItem.quantity < 0) {
        throw new MealPlanError(
          `Inventory deduction would result in negative stock for ${d.inventoryItem.name}.`,
          400
        );
      }

      const consumption = await tx.mealPlanConsumption.create({
        data: {
          mealPlanId: meal.id,
          inventoryItemId: d.inventoryItem.id,
          ingredientName: d.ingredientName,
          quantityDeducted: d.deductAmount,
          unit: d.unit,
          deductedAt: new Date()
        }
      });

      recordedConsumptions.push(consumption);
    }

    // 5. Update meal plan entry status
    const updatedMeal = await tx.mealPlanEntry.update({
      where: { id: mealPlanId },
      data: {
        status: 'COOKED',
        cookedAt: new Date()
      },
      include: {
        recipe: true,
        consumptions: true
      }
    });

    // 6. Record meal consumption history snapshot for Phase 9 nutrition tracking
    try {
      const fullRecipe = await tx.recipe.findUnique({
        where: { id: meal.recipeId },
        include: { ingredients: true }
      });
      const nut = fullRecipe ? calculateRecipeNutrition(fullRecipe, meal.servings) : null;

      await tx.mealConsumptionHistory.create({
        data: {
          userId,
          mealPlanId: meal.id,
          recipeId: meal.recipeId,
          recipeTitle: meal.recipe?.title || 'Cooked Meal',
          consumedDate: meal.scheduledDate || new Date(),
          mealType: meal.mealType,
          servingsConsumed: meal.servings,
          calories: nut?.customEstimate?.calories ?? null,
          proteinGrams: nut?.customEstimate?.proteinGrams ?? null,
          carbohydratesGrams: nut?.customEstimate?.carbohydratesGrams ?? null,
          fatGrams: nut?.customEstimate?.fatGrams ?? null,
          fiberGrams: nut?.customEstimate?.fiberGrams ?? null,
          sugarGrams: nut?.customEstimate?.sugarGrams ?? null,
          sodiumMilligrams: nut?.customEstimate?.sodiumMilligrams ?? null,
          source: 'COOKED_MEAL',
          isEstimated: true,
          completenessScore: nut?.completenessScore ?? 100
        }
      });
    } catch (e) {
      // Non-fatal if table not yet migrated or test isolation
    }

    return {
      success: true,
      mealPlan: {
        ...updatedMeal,
        scheduledDateStr: updatedMeal.scheduledDate.toISOString().split('T')[0]
      },
      deductionsApplied: recordedConsumptions.length,
      deductions: recordedConsumptions
    };
  });
};

/**
 * Reverses recorded inventory deductions for a cooked meal
 * Restores only what was actually deducted; handles deleted items gracefully.
 */
export const reverseConsumption = async (userId, mealPlanId) => {
  return await prisma.$transaction(async (tx) => {
    const meal = await tx.mealPlanEntry.findFirst({
      where: { id: mealPlanId, userId },
      include: {
        consumptions: {
          where: { isReversed: false }
        }
      }
    });

    if (!meal) {
      throw new MealPlanError('Meal plan entry not found', 404);
    }

    if (meal.status !== 'COOKED' && (!meal.consumptions || meal.consumptions.length === 0)) {
      throw new MealPlanError(
        'Meal is not marked as COOKED and has no active inventory deductions to reverse.',
        400
      );
    }

    const activeConsumptions = meal.consumptions || [];
    const restoredSummary = [];

    for (const consumption of activeConsumptions) {
      let wasRestored = false;

      if (consumption.inventoryItemId) {
        const itemExists = await tx.inventoryItem.findUnique({
          where: { id: consumption.inventoryItemId }
        });

        if (itemExists) {
          await tx.inventoryItem.update({
            where: { id: consumption.inventoryItemId },
            data: {
              quantity: {
                increment: consumption.quantityDeducted
              }
            }
          });
          wasRestored = true;
        }
      }

      await tx.mealPlanConsumption.update({
        where: { id: consumption.id },
        data: {
          isReversed: true,
          reversedAt: new Date()
        }
      });

      restoredSummary.push({
        ingredientName: consumption.ingredientName,
        restoredQuantity: wasRestored ? consumption.quantityDeducted : 0,
        unit: consumption.unit,
        inventoryItemRestored: wasRestored,
        note: wasRestored
          ? 'Restored to pantry'
          : 'Pantry item was previously removed; consumption marked reversed.'
      });
    }

    const updatedMeal = await tx.mealPlanEntry.update({
      where: { id: mealPlanId },
      data: {
        status: 'PLANNED',
        cookedAt: null
      },
      include: {
        recipe: true,
        consumptions: true
      }
    });

    // Mark corresponding meal consumption history records as reversed
    try {
      await tx.mealConsumptionHistory.updateMany({
        where: { mealPlanId, isReversed: false },
        data: {
          isReversed: true,
          reversedAt: new Date()
        }
      });
    } catch (e) {
      // Non-fatal
    }

    return {
      success: true,
      mealPlan: {
        ...updatedMeal,
        scheduledDateStr: updatedMeal.scheduledDate.toISOString().split('T')[0]
      },
      restoredSummary
    };
  });
};

/**
 * Returns summary statistics for the user dashboard
 */
export const getDashboardSummary = async (userId) => {
  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const todayStart = new Date(`${todayIso}T00:00:00.000Z`);
  const todayEnd = new Date(`${todayIso}T23:59:59.999Z`);

  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Today's planned meals
  const todayMeals = await prisma.mealPlanEntry.findMany({
    where: {
      userId,
      scheduledDate: { gte: todayStart, lte: todayEnd }
    },
    include: {
      recipe: {
        select: { id: true, title: true, imageUrl: true, prepTimeMinutes: true, cookTimeMinutes: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Next upcoming meal
  const nextMeal = await prisma.mealPlanEntry.findFirst({
    where: {
      userId,
      scheduledDate: { gte: todayStart },
      status: 'PLANNED'
    },
    include: {
      recipe: {
        select: { id: true, title: true, imageUrl: true, prepTimeMinutes: true, cookTimeMinutes: true }
      }
    },
    orderBy: [
      { scheduledDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  // Week count
  const weekCount = await prisma.mealPlanEntry.count({
    where: {
      userId,
      scheduledDate: { gte: todayStart, lte: weekEnd }
    }
  });

  return {
    todayMeals: todayMeals.map((m) => ({
      ...m,
      scheduledDateStr: m.scheduledDate.toISOString().split('T')[0]
    })),
    nextUpcomingMeal: nextMeal
      ? {
          ...nextMeal,
          scheduledDateStr: nextMeal.scheduledDate.toISOString().split('T')[0]
        }
      : null,
    weekPlannedCount: weekCount
  };
};
