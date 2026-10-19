import prisma from '../config/prisma.js';
import { getLatestPriceForIngredient } from './ingredientPriceService.js';
import { normalizeIngredientName } from './recipeService.js';
import { normalizeUnit, convertQuantity } from '../utils/unitUtils.js';
import { generateGeminiContent } from './geminiService.js';

export class WasteError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'WasteError';
    this.statusCode = statusCode;
  }
}

export const VALID_WASTE_REASONS = [
  'EXPIRED',
  'SPOILED',
  'EXCESS_PREPARED',
  'OVER_PURCHASED',
  'COOKING_MISTAKE',
  'OTHER'
];

/**
 * Normalizes input date to Date object or throws error
 */
const parseValidDate = (val, fieldName) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    throw new WasteError(`Invalid date format for ${fieldName}`, 400);
  }
  return d;
};

// ============================================================================
// 1. EXPIRY CATEGORISATION & TRACKING
// ============================================================================

/**
 * Categorises all inventory items for a user into structured expiry buckets
 */
export async function getExpiryCategorisation(userId, options = {}) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const soonDays = Number(options.soonThreshold) || 3;
  const weekDays = Number(options.weekThreshold) || 7;

  const threeDaysAhead = new Date(startOfToday.getTime() + soonDays * 24 * 60 * 60 * 1000 + 86399999);
  const sevenDaysAhead = new Date(startOfToday.getTime() + weekDays * 24 * 60 * 60 * 1000 + 86399999);

  const items = await prisma.inventoryItem.findMany({
    where: { userId },
    orderBy: [
      { expiryDate: 'asc' },
      { name: 'asc' }
    ]
  });

  const categorised = {
    EXPIRED: [],
    EXPIRING_TODAY: [],
    EXPIRING_IN_3_DAYS: [],
    EXPIRING_IN_7_DAYS: [],
    LONGER_SHELF_LIFE: [],
    NO_EXPIRY_DATE: []
  };

  const processedItems = items.map((item) => {
    let status;
    let daysRemaining = null;
    let statusLabel = '';
    let urgencyScore = 6;

    if (!item.expiryDate) {
      status = 'NO_EXPIRY_DATE';
      statusLabel = 'No Expiry Set';
      urgencyScore = 5;
    } else {
      const exp = new Date(item.expiryDate);
      const diffTime = exp.getTime() - endOfToday.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (exp < startOfToday) {
        status = 'EXPIRED';
        statusLabel = `Expired (${Math.abs(daysRemaining)}d ago)`;
        urgencyScore = 1;
      } else if (exp >= startOfToday && exp <= endOfToday) {
        status = 'EXPIRING_TODAY';
        statusLabel = 'Expires Today';
        daysRemaining = 0;
        urgencyScore = 2;
      } else if (exp > endOfToday && exp <= threeDaysAhead) {
        status = 'EXPIRING_IN_3_DAYS';
        statusLabel = `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
        urgencyScore = 3;
      } else if (exp > threeDaysAhead && exp <= sevenDaysAhead) {
        status = 'EXPIRING_IN_7_DAYS';
        statusLabel = `Expires in ${daysRemaining} days`;
        urgencyScore = 4;
      } else {
        status = 'LONGER_SHELF_LIFE';
        statusLabel = `Safe (${daysRemaining} days remaining)`;
        urgencyScore = 6;
      }
    }

    const enhanced = {
      ...item,
      status,
      daysRemaining,
      statusLabel,
      urgencyScore
    };

    categorised[status].push(enhanced);
    return enhanced;
  });

  // Sort all items by urgency (expired first, then today, 3 days, 7 days, no expiry, safe)
  processedItems.sort((a, b) => a.urgencyScore - b.urgencyScore || (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));

  return {
    summary: {
      totalItems: items.length,
      expiredCount: categorised.EXPIRED.length,
      expiringTodayCount: categorised.EXPIRING_TODAY.length,
      expiringIn3DaysCount: categorised.EXPIRING_IN_3_DAYS.length,
      expiringIn7DaysCount: categorised.EXPIRING_IN_7_DAYS.length,
      longerShelfLifeCount: categorised.LONGER_SHELF_LIFE.length,
      noExpiryDateCount: categorised.NO_EXPIRY_DATE.length,
      urgentActionCount: categorised.EXPIRED.length + categorised.EXPIRING_TODAY.length + categorised.EXPIRING_IN_3_DAYS.length
    },
    categorised,
    items: processedItems
  };
}

// ============================================================================
// 2. FOOD-WASTE RECORDING (ATOMIC WITH INVENTORY DEDUCTION)
// ============================================================================

/**
 * Records food waste. If linked to an inventory item, atomically deducts stock.
 */
export async function recordFoodWaste(userId, data) {
  const {
    inventoryItemId,
    ingredientName,
    quantityWasted,
    unit,
    reason,
    estimatedUnitCost,
    estimatedTotalCost,
    wastedAt,
    notes,
    idempotencyKey
  } = data;

  if (quantityWasted === undefined || quantityWasted === null || isNaN(Number(quantityWasted))) {
    throw new WasteError('Quantity wasted is required and must be a number', 400);
  }

  const numQty = Number(quantityWasted);
  if (numQty <= 0) {
    throw new WasteError('Quantity wasted must be greater than zero', 400);
  }

  if (!reason || typeof reason !== 'string' || !VALID_WASTE_REASONS.includes(reason.trim().toUpperCase())) {
    throw new WasteError(
      `Invalid reason: "${reason}". Allowed values: ${VALID_WASTE_REASONS.join(', ')}`,
      400
    );
  }
  const cleanReason = reason.trim().toUpperCase();

  const parsedWastedAt = wastedAt ? parseValidDate(wastedAt, 'wastedAt') : new Date();

  // Deduplication guard: if an identical record was created within 5 seconds, return it
  const recentDuplicate = await prisma.foodWasteRecord.findFirst({
    where: {
      userId,
      inventoryItemId: inventoryItemId || null,
      quantityWasted: numQty,
      reason: cleanReason,
      createdAt: {
        gte: new Date(Date.now() - 5000)
      }
    }
  });

  if (recentDuplicate) {
    return recentDuplicate;
  }

  // Case A: Linked to an inventory item
  if (inventoryItemId) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId }
    });

    if (!item || item.userId !== userId) {
      throw new WasteError('Inventory item not found', 404);
    }

    if (numQty > item.quantity) {
      throw new WasteError(
        `Cannot discard ${numQty} ${unit || item.unit}. Currently available stock is only ${item.quantity} ${item.unit}`,
        400
      );
    }

    // Determine estimated unit cost & total cost
    let finalUnitCost = estimatedUnitCost !== undefined && estimatedUnitCost !== null && !isNaN(Number(estimatedUnitCost))
      ? Number(Number(estimatedUnitCost).toFixed(2))
      : null;

    if (finalUnitCost === null) {
      // Look up recorded price database for user
      const priceRecord = await getLatestPriceForIngredient(userId, item.name, item.unit);
      if (priceRecord && priceRecord.unitPrice) {
        finalUnitCost = Number(priceRecord.unitPrice.toFixed(2));
      }
    }

    let finalTotalCost = estimatedTotalCost !== undefined && estimatedTotalCost !== null && !isNaN(Number(estimatedTotalCost))
      ? Number(Number(estimatedTotalCost).toFixed(2))
      : null;

    if (finalTotalCost === null && finalUnitCost !== null) {
      finalTotalCost = Number((numQty * finalUnitCost).toFixed(2));
    }

    const cleanUnit = unit ? normalizeUnit(unit) : item.unit;
    const finalIngredientName = ingredientName && ingredientName.trim() ? ingredientName.trim() : item.name;

    // Atomic execution with Prisma transaction
    const [wasteRecord, updatedInventory] = await prisma.$transaction([
      prisma.foodWasteRecord.create({
        data: {
          userId,
          inventoryItemId: item.id,
          ingredientName: finalIngredientName,
          quantityWasted: numQty,
          unit: cleanUnit,
          reason: cleanReason,
          estimatedUnitCost: finalUnitCost,
          estimatedTotalCost: finalTotalCost,
          wastedAt: parsedWastedAt,
          notes: notes ? String(notes).trim() : null
        }
      }),
      prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: Math.max(0, Number((item.quantity - numQty).toFixed(3)))
        }
      })
    ]);

    return {
      ...wasteRecord,
      remainingStock: updatedInventory.quantity
    };
  }

  // Case B: Standalone waste entry (not linked to an active inventory item)
  if (!ingredientName || typeof ingredientName !== 'string' || !ingredientName.trim()) {
    throw new WasteError('Ingredient name is required for standalone waste records', 400);
  }

  if (!unit || typeof unit !== 'string' || !unit.trim()) {
    throw new WasteError('Unit of measurement is required', 400);
  }

  const cleanUnit = normalizeUnit(unit);
  const cleanName = ingredientName.trim();

  let finalUnitCost = estimatedUnitCost !== undefined && estimatedUnitCost !== null && !isNaN(Number(estimatedUnitCost))
    ? Number(Number(estimatedUnitCost).toFixed(2))
    : null;

  if (finalUnitCost === null) {
    const priceRecord = await getLatestPriceForIngredient(userId, cleanName, cleanUnit);
    if (priceRecord && priceRecord.unitPrice) {
      finalUnitCost = Number(priceRecord.unitPrice.toFixed(2));
    }
  }

  let finalTotalCost = estimatedTotalCost !== undefined && estimatedTotalCost !== null && !isNaN(Number(estimatedTotalCost))
    ? Number(Number(estimatedTotalCost).toFixed(2))
    : null;

  if (finalTotalCost === null && finalUnitCost !== null) {
    finalTotalCost = Number((numQty * finalUnitCost).toFixed(2));
  }

  const standaloneRecord = await prisma.foodWasteRecord.create({
    data: {
      userId,
      inventoryItemId: null,
      ingredientName: cleanName,
      quantityWasted: numQty,
      unit: cleanUnit,
      reason: cleanReason,
      estimatedUnitCost: finalUnitCost,
      estimatedTotalCost: finalTotalCost,
      wastedAt: parsedWastedAt,
      notes: notes ? String(notes).trim() : null
    }
  });

  return standaloneRecord;
}

// ============================================================================
// 3. WASTE RECORD CORRECTION & REVERSAL
// ============================================================================

/**
 * Reverses a food waste record with optional explicit stock restoration
 */
export async function reverseFoodWaste(userId, recordId, options = {}) {
  const { confirm, restoreToInventory = false, reversalReason } = options;

  if (!confirm) {
    throw new WasteError('Explicit confirmation is required to reverse a food waste record', 400);
  }

  const record = await prisma.foodWasteRecord.findUnique({
    where: { id: recordId }
  });

  if (!record || record.userId !== userId) {
    throw new WasteError('Food waste record not found', 404);
  }

  if (record.isReversed) {
    throw new WasteError('This food waste record has already been reversed', 400);
  }

  let itemStillExists = false;
  if (restoreToInventory && record.inventoryItemId) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: record.inventoryItemId }
    });
    if (item && item.userId === userId) {
      itemStillExists = true;
    }
  }

  // Run reversal in transaction
  const operations = [
    prisma.foodWasteRecord.update({
      where: { id: recordId },
      data: {
        isReversed: true,
        reversedAt: new Date(),
        reversalReason: reversalReason ? String(reversalReason).trim() : 'User correction',
        restoredToInventory: itemStillExists
      }
    })
  ];

  if (itemStillExists) {
    operations.push(
      prisma.inventoryItem.update({
        where: { id: record.inventoryItemId },
        data: {
          quantity: {
            increment: record.quantityWasted
          }
        }
      })
    );
  }

  const [updatedRecord] = await prisma.$transaction(operations);
  return {
    ...updatedRecord,
    inventoryRestored: itemStillExists
  };
}

// ============================================================================
// 4. HISTORICAL WASTE RECORDS QUERY
// ============================================================================

/**
 * Fetches food waste records with filtering and pagination
 */
export async function getFoodWasteRecords(userId, filters = {}) {
  const {
    from,
    to,
    reason,
    ingredientName,
    includeReversed = 'true',
    page = 1,
    limit = 50
  } = filters;

  const where = { userId };

  if (from || to) {
    where.wastedAt = {};
    if (from) where.wastedAt.gte = parseValidDate(from, 'from');
    if (to) {
      const parsedTo = parseValidDate(to, 'to');
      parsedTo.setHours(23, 59, 59, 999);
      where.wastedAt.lte = parsedTo;
    }
  }

  if (reason && reason !== 'ALL' && VALID_WASTE_REASONS.includes(reason.trim().toUpperCase())) {
    where.reason = reason.trim().toUpperCase();
  }

  if (ingredientName && typeof ingredientName === 'string' && ingredientName.trim()) {
    where.ingredientName = {
      contains: ingredientName.trim()
    };
  }

  if (includeReversed === 'false') {
    where.isReversed = false;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
  const skip = (pageNum - 1) * pageSize;

  const [totalCount, records] = await Promise.all([
    prisma.foodWasteRecord.count({ where }),
    prisma.foodWasteRecord.findMany({
      where,
      orderBy: { wastedAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            category: true,
            quantity: true,
            unit: true
          }
        }
      }
    })
  ]);

  return {
    records,
    pagination: {
      total: totalCount,
      page: pageNum,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    }
  };
}

// ============================================================================
// 5. WASTE ANALYTICS & TRENDS
// ============================================================================

/**
 * Computes deep waste analytics over specified time periods
 */
export async function getFoodWasteAnalytics(userId, filters = {}) {
  const { period = '30d', startDate, endDate } = filters;

  const now = new Date();
  let fromDate = null;
  let toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === '7d') {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30d') {
    fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (period === 'custom' && startDate) {
    fromDate = parseValidDate(startDate, 'startDate');
    if (endDate) {
      toDate = parseValidDate(endDate, 'endDate');
      toDate.setHours(23, 59, 59, 999);
    }
  }

  const where = {
    userId,
    isReversed: false // strictly discount reversed records from metrics
  };

  if (fromDate) {
    where.wastedAt = {
      gte: fromDate,
      lte: toDate
    };
  }

  const records = await prisma.foodWasteRecord.findMany({
    where,
    orderBy: { wastedAt: 'asc' }
  });

  let totalCost = 0;
  let costPricedRecordsCount = 0;
  const reasonBreakdown = {};
  const ingredientBreakdown = {};
  const unitBreakdown = {};
  const dailyTrend = {};

  VALID_WASTE_REASONS.forEach((r) => {
    reasonBreakdown[r] = { reason: r, count: 0, estimatedCost: 0, itemsCount: 0 };
  });

  for (const r of records) {
    // Total cost accumulation
    if (r.estimatedTotalCost !== null && !isNaN(r.estimatedTotalCost)) {
      totalCost += r.estimatedTotalCost;
      costPricedRecordsCount += 1;
    }

    // Breakdown by Reason
    if (reasonBreakdown[r.reason]) {
      reasonBreakdown[r.reason].count += 1;
      if (r.estimatedTotalCost) {
        reasonBreakdown[r.reason].estimatedCost += r.estimatedTotalCost;
      }
    }

    // Breakdown by Ingredient
    const ingKey = r.ingredientName.toLowerCase().trim();
    if (!ingredientBreakdown[ingKey]) {
      ingredientBreakdown[ingKey] = {
        name: r.ingredientName,
        count: 0,
        estimatedCost: 0,
        quantitiesByUnit: {}
      };
    }
    ingredientBreakdown[ingKey].count += 1;
    if (r.estimatedTotalCost) {
      ingredientBreakdown[ingKey].estimatedCost += r.estimatedTotalCost;
    }
    const normU = normalizeUnit(r.unit);
    ingredientBreakdown[ingKey].quantitiesByUnit[normU] =
      (ingredientBreakdown[ingKey].quantitiesByUnit[normU] || 0) + r.quantityWasted;

    // Safe Unit Aggregation (never combines kg with ml)
    unitBreakdown[normU] = (unitBreakdown[normU] || 0) + r.quantityWasted;

    // Daily Trend
    const dayKey = r.wastedAt.toISOString().split('T')[0];
    if (!dailyTrend[dayKey]) {
      dailyTrend[dayKey] = { date: dayKey, count: 0, estimatedCost: 0 };
    }
    dailyTrend[dayKey].count += 1;
    if (r.estimatedTotalCost) {
      dailyTrend[dayKey].estimatedCost += r.estimatedTotalCost;
    }
  }

  // Format reason list with percentages
  const reasonsList = Object.values(reasonBreakdown)
    .filter((b) => b.count > 0)
    .map((b) => ({
      ...b,
      estimatedCost: Number(b.estimatedCost.toFixed(2)),
      percentageOfCost: totalCost > 0 ? Number(((b.estimatedCost / totalCost) * 100).toFixed(1)) : 0,
      percentageOfCount: records.length > 0 ? Number(((b.count / records.length) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.estimatedCost - a.estimatedCost || b.count - a.count);

  // Format top wasted ingredients
  const topIngredients = Object.values(ingredientBreakdown)
    .map((ing) => ({
      ...ing,
      estimatedCost: Number(ing.estimatedCost.toFixed(2))
    }))
    .sort((a, b) => b.count - a.count || b.estimatedCost - a.estimatedCost)
    .slice(0, 10);

  // Format trend array
  const trendArray = Object.values(dailyTrend).map((d) => ({
    ...d,
    estimatedCost: Number(d.estimatedCost.toFixed(2))
  }));

  return {
    period,
    recordsCount: records.length,
    totalEstimatedCost: Number(totalCost.toFixed(2)),
    hasPriceEstimates: costPricedRecordsCount > 0,
    pricedRecordsCount: costPricedRecordsCount,
    reasonsBreakdown: reasonsList,
    topIngredients,
    quantitiesByUnit: unitBreakdown,
    dailyTrend: trendArray
  };
}

// ============================================================================
// 6. AT-RISK INVENTORY DETECTION (CROSS-REFERENCED WITH MEAL PLANS)
// ============================================================================

/**
 * Identifies pantry items at immediate risk of waste by cross-referencing
 * expiry windows with upcoming scheduled meal plans.
 */
export async function getAtRiskInventory(userId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const sevenDaysAhead = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 + 86399999);

  // 1. Get user items expiring within 7 days and NOT yet expired
  const candidateItems = await prisma.inventoryItem.findMany({
    where: {
      userId,
      quantity: { gt: 0 },
      expiryDate: {
        gte: startOfToday,
        lte: sevenDaysAhead
      }
    },
    orderBy: { expiryDate: 'asc' }
  });

  // 2. Fetch upcoming PLANNED meal plans in the next 7 days
  const upcomingMeals = await prisma.mealPlanEntry.findMany({
    where: {
      userId,
      status: 'PLANNED',
      scheduledDate: {
        gte: startOfToday,
        lte: sevenDaysAhead
      }
    },
    include: {
      recipe: {
        include: {
          ingredients: true
        }
      }
    }
  });

  // Compile map of ingredients used in upcoming meals
  const plannedIngredientsMap = new Map();
  for (const meal of upcomingMeals) {
    if (meal.recipe?.ingredients) {
      for (const ing of meal.recipe.ingredients) {
        const norm = normalizeIngredientName(ing.name);
        if (!plannedIngredientsMap.has(norm)) {
          plannedIngredientsMap.set(norm, []);
        }
        plannedIngredientsMap.get(norm).push({
          mealPlanId: meal.id,
          recipeTitle: meal.recipe.title,
          scheduledDate: meal.scheduledDate,
          mealType: meal.mealType
        });
      }
    }
  }

  const atRiskItems = [];

  for (const item of candidateItems) {
    const norm = normalizeIngredientName(item.name);
    const plannedUsages = plannedIngredientsMap.get(norm) || [];
    const isCovered = plannedUsages.length > 0;

    const diffDays = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let riskLevel = 'LOW';
    let riskReason = '';

    if (diffDays <= 1) {
      riskLevel = isCovered ? 'HIGH' : 'CRITICAL';
      riskReason = isCovered
        ? `Expires within 24-48 hours. Included in "${plannedUsages[0].recipeTitle}". Ensure it is prepared promptly.`
        : 'Expires today or tomorrow with NO upcoming meal plan scheduled to consume it.';
    } else if (diffDays <= 3) {
      riskLevel = isCovered ? 'MEDIUM' : 'HIGH';
      riskReason = isCovered
        ? `Expires in ${diffDays} days. Covered by upcoming meal "${plannedUsages[0].recipeTitle}".`
        : `Expires in ${diffDays} days and is NOT scheduled in any upcoming meal plan.`;
    } else {
      riskLevel = isCovered ? 'LOW' : 'MEDIUM';
      riskReason = isCovered
        ? `Expires in ${diffDays} days. Covered by meal plan.`
        : `Expires in ${diffDays} days with no planned recipe.`;
    }

    atRiskItems.push({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate,
      daysRemaining: diffDays,
      riskLevel,
      riskReason,
      isCoveredByMealPlan: isCovered,
      plannedUsages
    });
  }

  // Sort CRITICAL first, then HIGH, then MEDIUM, then LOW
  const scoreMap = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
  atRiskItems.sort((a, b) => scoreMap[a.riskLevel] - scoreMap[b.riskLevel] || a.daysRemaining - b.daysRemaining);

  return {
    atRiskCount: atRiskItems.length,
    criticalCount: atRiskItems.filter((i) => i.riskLevel === 'CRITICAL').length,
    highRiskCount: atRiskItems.filter((i) => i.riskLevel === 'HIGH').length,
    uncoveredCount: atRiskItems.filter((i) => !i.isCoveredByMealPlan).length,
    items: atRiskItems
  };
}

// ============================================================================
// 7. EXPIRY-AWARE RECIPE SUGGESTIONS
// ============================================================================

/**
 * Suggests recipes specifically designed to rescue near-expiry ingredients
 */
export async function getExpiryRecipeSuggestions(userId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const sevenDaysAhead = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 + 86399999);

  // Eligible near-expiry items: in stock, not expired, expiring <= 7 days
  const nearExpiryItems = await prisma.inventoryItem.findMany({
    where: {
      userId,
      quantity: { gt: 0 },
      expiryDate: {
        gte: startOfToday,
        lte: sevenDaysAhead
      }
    }
  });

  if (nearExpiryItems.length === 0) {
    return {
      nearExpiryIngredientsCount: 0,
      suggestions: []
    };
  }

  // User's entire unexpired inventory for ingredient matching
  const allInventory = await prisma.inventoryItem.findMany({
    where: {
      userId,
      quantity: { gt: 0 },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: startOfToday } }
      ]
    }
  });

  const allInventoryMap = new Map();
  allInventory.forEach((i) => {
    allInventoryMap.set(normalizeIngredientName(i.name), i);
  });

  const nearExpiryMap = new Map();
  nearExpiryItems.forEach((i) => {
    nearExpiryMap.set(normalizeIngredientName(i.name), i);
  });

  // Recipes (user-created or public)
  const recipes = await prisma.recipe.findMany({
    where: {
      OR: [
        { userId },
        { isPublic: true }
      ]
    },
    include: {
      ingredients: true,
      nutrition: true
    }
  });

  const suggestions = [];

  for (const recipe of recipes) {
    const requiredIngredients = recipe.ingredients.filter((i) => !i.isOptional);
    const nearExpiryUsed = [];
    const otherAvailable = [];
    const missing = [];

    for (const req of requiredIngredients) {
      const norm = normalizeIngredientName(req.name);
      if (nearExpiryMap.has(norm)) {
        nearExpiryUsed.push(req.name);
      } else if (allInventoryMap.has(norm)) {
        otherAvailable.push(req.name);
      } else {
        missing.push(req.name);
      }
    }

    // Only suggest if at least one near-expiry ingredient is utilized
    if (nearExpiryUsed.length > 0) {
      const totalReq = requiredIngredients.length;
      const matchedCount = nearExpiryUsed.length + otherAvailable.length;
      const matchPercentage = totalReq > 0 ? Math.round((matchedCount / totalReq) * 100) : 100;
      const canCook = missing.length === 0;

      suggestions.push({
        id: recipe.id,
        title: recipe.title,
        category: recipe.category,
        servings: recipe.servings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        difficulty: recipe.difficulty,
        nearExpiryUsed,
        nearExpiryCount: nearExpiryUsed.length,
        otherAvailable,
        missing,
        matchPercentage,
        canCook
      });
    }
  }

  // Sort by highest near-expiry ingredients rescued, then by match percentage
  suggestions.sort((a, b) => b.nearExpiryCount - a.nearExpiryCount || b.matchPercentage - a.matchPercentage);

  return {
    nearExpiryIngredientsCount: nearExpiryItems.length,
    nearExpiryIngredients: nearExpiryItems.map((i) => i.name),
    suggestions: suggestions.slice(0, 15)
  };
}

// ============================================================================
// 8. DASHBOARD WASTE SUMMARY
// ============================================================================

/**
 * Returns top-level waste and expiry summary numbers for the main dashboard
 */
export async function getDashboardWasteSummary(userId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const threeDaysAhead = new Date(startOfToday.getTime() + 3 * 24 * 60 * 60 * 1000 + 86399999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const [expiredCount, expiringSoonCount, monthlyWasteRecords, atRiskData] = await Promise.all([
    prisma.inventoryItem.count({
      where: {
        userId,
        quantity: { gt: 0 },
        expiryDate: { lt: startOfToday }
      }
    }),
    prisma.inventoryItem.count({
      where: {
        userId,
        quantity: { gt: 0 },
        expiryDate: {
          gte: startOfToday,
          lte: threeDaysAhead
        }
      }
    }),
    prisma.foodWasteRecord.findMany({
      where: {
        userId,
        isReversed: false,
        wastedAt: { gte: startOfMonth }
      },
      select: { estimatedTotalCost: true }
    }),
    getAtRiskInventory(userId)
  ]);

  const monthlyCost = monthlyWasteRecords.reduce((acc, r) => acc + (r.estimatedTotalCost || 0), 0);

  return {
    expiredCount,
    expiringSoonCount,
    atRiskWithoutMealPlanCount: atRiskData.uncoveredCount,
    monthlyWasteCost: Number(monthlyCost.toFixed(2)),
    monthlyWasteIncidents: monthlyWasteRecords.length,
    criticalCount: atRiskData.criticalCount
  };
}

// ============================================================================
// 9. AI WASTE REDUCTION ASSISTANT (GEMINI + OFFLINE FALLBACK)
// ============================================================================

/**
 * Provides grounded, safety-compliant food waste mitigation recommendations
 */
export async function getAiWasteAdvice(userId, userPrompt) {
  if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
    throw new WasteError('Prompt is required for waste reduction advisor', 400);
  }

  const [atRiskData, expiryCategorisation, wasteAnalytics, recipes] = await Promise.all([
    getAtRiskInventory(userId),
    getExpiryCategorisation(userId),
    getFoodWasteAnalytics(userId, { period: '30d' }),
    prisma.recipe.findMany({
      where: {
        OR: [{ userId }, { isPublic: true }]
      },
      select: { title: true, category: true },
      take: 8
    })
  ]);

  const atRiskNames = atRiskData.items.map((i) => `${i.name} (${i.quantity} ${i.unit}, expires in ${i.daysRemaining}d, ${i.riskLevel} risk)`);
  const topWastedNames = wasteAnalytics.topIngredients.slice(0, 5).map((i) => `${i.name} (${i.count} times)`);
  const recipeTitles = recipes.map((r) => r.title);

  const systemInstruction = `You are the Smart Rasoi AI Waste Reduction Advisor, the Culinary & Kitchen Waste Optimisation Expert for Smart Rasoi.
You provide practical, culturally authentic Indian and global kitchen strategies to prevent food waste.

CRITICAL FOOD SAFETY RULES:
1. NEVER recommend eating expired, moldy, sour, or visibly spoiled food as safe.
2. Clearly explain that cooking or reheating does NOT destroy heat-stable bacterial toxins in spoiled food.
3. Distinguish between 'Best Before' (quality indicator) and 'Use By / Expiry' (strict safety cutoff).
4. Do not invent fake financial savings or make up items not in the user's pantry.

User Kitchen Context:
- Near-expiry / At-risk stock: ${atRiskNames.length > 0 ? atRiskNames.join(', ') : 'None currently'}
- Expired items needing disposal/review: ${expiryCategorisation.summary.expiredCount} items
- Top historically wasted ingredients: ${topWastedNames.length > 0 ? topWastedNames.join(', ') : 'None recorded'}
- Available recipes in kitchen: ${recipeTitles.join(', ')}

Provide actionable advice in response to the user's query with concise bullet points and practical culinary hacks (e.g., freezing herbs in oil, making stocks/chutneys, dehydrating, batch-cooking).`;

  try {
    const aiResponse = await generateGeminiContent({
      prompt: userPrompt,
      systemInstruction
    });

    return {
      advice: aiResponse,
      source: 'AI Assistant',
      atRiskCount: atRiskData.atRiskCount,
      quickTips: [
        'Store coriander stems in cold water or wrap in paper towels to extend shelf life by 5 days',
        'Freeze surplus tomatoes or puree them into quick gravy bases',
        'Turn overripe bananas into whole-wheat sheera or banana pancakes',
        'Stir-fry leftover cooked rice into lemon rice or vegetable fried rice within 24 hours'
      ]
    };
  } catch (err) {
    console.warn('Gemini waste advice fallback triggered:', err.message);

    // Contextual deterministic fallback
    let fallbackText = 'Here are core kitchen strategies based on your current pantry:\n';
    if (atRiskData.items.length > 0) {
      const topAtRisk = atRiskData.items[0];
      fallbackText += `\n* Priority Action: You have ${topAtRisk.name} (${topAtRisk.quantity} ${topAtRisk.unit}) expiring soon. Consider incorporating it into today's or tomorrow's menu.`;
    }
    fallbackText += `\n* Batch Preparation: Cook extra vegetables into mixed sabzi or dal tadka bases and refrigerate in airtight glass containers.`;
    fallbackText += `\n* Storage Check: Ensure greens are moisture-free before refrigeration, and keep root vegetables like potatoes and onions stored separately in cool, dry spaces.`;
    fallbackText += `\n* Portion Control: Cook measured quantities to prevent prepared food leftovers from being discarded.`;

    return {
      advice: fallbackText,
      source: 'Smart Rasoi Safety Engine (Rule-based Fallback)',
      atRiskCount: atRiskData.atRiskCount,
      quickTips: [
        'Always check temperature: Keep refrigerator at 4°C or below',
        'First In, First Out (FIFO): Place newly bought groceries behind older ones',
        'Label homemade leftovers with preparation dates'
      ]
    };
  }
}
