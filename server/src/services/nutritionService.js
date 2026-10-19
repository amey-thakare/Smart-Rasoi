/**
 * Smart Rasoi - Phase 9 Nutrition & Dietary Tracking Service
 * 
 * Manages nutritional calculations, dietary profiles, consumption ledger,
 * historical snapshots, aggregated metrics, and AI nutrition assistance.
 */

import prisma from '../config/prisma.js';
import { calculateRecipeNutrition } from './nutritionCalculatorService.js';
import { generateGeminiContent } from './geminiService.js';

export class NutritionError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'NutritionError';
    this.statusCode = statusCode;
  }
}

const ALLOWED_DIETARY_PREFERENCES = [
  'NONE',
  'VEGETARIAN',
  'VEGAN',
  'EGGETARIAN',
  'NON_VEGETARIAN',
  'JAIN'
];

/**
 * Parses and validates date range boundaries (YYYY-MM-DD)
 */
function parseDateRange(fromDateStr, toDateStr) {
  let fromDate = fromDateStr ? new Date(fromDateStr) : null;
  let toDate = toDateStr ? new Date(toDateStr) : null;

  if (fromDate && isNaN(fromDate.getTime())) {
    throw new NutritionError('Invalid "from" date format. Expected YYYY-MM-DD.', 400);
  }
  if (toDate && isNaN(toDate.getTime())) {
    throw new NutritionError('Invalid "to" date format. Expected YYYY-MM-DD.', 400);
  }

  // Default to past 7 days if omitted
  if (!toDate) {
    toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
  } else {
    toDate.setHours(23, 59, 59, 999);
  }

  if (!fromDate) {
    fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - 6);
    fromDate.setHours(0, 0, 0, 0);
  } else {
    fromDate.setHours(0, 0, 0, 0);
  }

  if (fromDate > toDate) {
    throw new NutritionError('"from" date cannot be after "to" date.', 400);
  }

  return { fromDate, toDate };
}

/**
 * Formats a Date object to local YYYY-MM-DD string
 */
function toDateString(d) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// 1. RECIPE NUTRITION ESTIMATES
// ============================================================================

/**
 * Fetches or calculates nutritional estimates for a recipe
 */
export async function getRecipeNutrition(recipeId, customServings = null) {
  if (!recipeId || typeof recipeId !== 'string') {
    throw new NutritionError('Recipe ID is required', 400);
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: true,
      nutrition: true
    }
  });

  if (!recipe) {
    throw new NutritionError('Recipe not found', 404);
  }

  // Calculate live breakdown from recipe ingredients
  const calculated = calculateRecipeNutrition(recipe, customServings);

  // If nutrition record does not exist in DB yet or recipe was updated, cache it
  if (!recipe.nutrition) {
    try {
      await prisma.recipeNutrition.create({
        data: {
          recipeId: recipe.id,
          servings: recipe.servings,
          calories: calculated.perServing.calories,
          proteinGrams: calculated.perServing.proteinGrams,
          carbohydratesGrams: calculated.perServing.carbohydratesGrams,
          fatGrams: calculated.perServing.fatGrams,
          fiberGrams: calculated.perServing.fiberGrams,
          sugarGrams: calculated.perServing.sugarGrams,
          sodiumMilligrams: calculated.perServing.sodiumMilligrams,
          source: calculated.source,
          isEstimated: true,
          completenessScore: calculated.completenessScore,
          missingIngredients: calculated.missingIngredients.length > 0
            ? JSON.stringify(calculated.missingIngredients)
            : null
        }
      });
    } catch {
      // Non-fatal if concurrent write occurs
    }
  }

  return {
    recipeId: recipe.id,
    recipeTitle: recipe.title,
    ...calculated
  };
}

/**
 * Forces recalculation and updates cached RecipeNutrition
 */
export async function recalculateRecipeNutrition(recipeId) {
  if (!recipeId) throw new NutritionError('Recipe ID is required', 400);

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: true }
  });

  if (!recipe) throw new NutritionError('Recipe not found', 404);

  const calculated = calculateRecipeNutrition(recipe);

  const updatedNutrition = await prisma.recipeNutrition.upsert({
    where: { recipeId: recipe.id },
    create: {
      recipeId: recipe.id,
      servings: recipe.servings,
      calories: calculated.perServing.calories,
      proteinGrams: calculated.perServing.proteinGrams,
      carbohydratesGrams: calculated.perServing.carbohydratesGrams,
      fatGrams: calculated.perServing.fatGrams,
      fiberGrams: calculated.perServing.fiberGrams,
      sugarGrams: calculated.perServing.sugarGrams,
      sodiumMilligrams: calculated.perServing.sodiumMilligrams,
      source: calculated.source,
      isEstimated: true,
      completenessScore: calculated.completenessScore,
      missingIngredients: calculated.missingIngredients.length > 0
        ? JSON.stringify(calculated.missingIngredients)
        : null
    },
    update: {
      servings: recipe.servings,
      calories: calculated.perServing.calories,
      proteinGrams: calculated.perServing.proteinGrams,
      carbohydratesGrams: calculated.perServing.carbohydratesGrams,
      fatGrams: calculated.perServing.fatGrams,
      fiberGrams: calculated.perServing.fiberGrams,
      sugarGrams: calculated.perServing.sugarGrams,
      sodiumMilligrams: calculated.perServing.sodiumMilligrams,
      source: calculated.source,
      isEstimated: true,
      completenessScore: calculated.completenessScore,
      missingIngredients: calculated.missingIngredients.length > 0
        ? JSON.stringify(calculated.missingIngredients)
        : null
    }
  });

  return {
    ...calculated,
    savedRecord: updatedNutrition
  };
}

// ============================================================================
// 2. DIETARY PROFILE & TARGET GOALS
// ============================================================================

/**
 * Retrieves dietary profile for the authenticated user (creates defaults if missing)
 */
export async function getDietaryProfile(userId) {
  let profile = await prisma.dietaryProfile.findUnique({
    where: { userId }
  });

  if (!profile) {
    profile = await prisma.dietaryProfile.create({
      data: {
        userId,
        dietaryPreference: 'NONE'
      }
    });
  }

  // Parse JSON or comma-delimited strings for allergies and disliked items
  let allergiesList = [];
  let dislikedList = [];

  if (profile.allergies) {
    try {
      allergiesList = JSON.parse(profile.allergies);
    } catch {
      allergiesList = profile.allergies.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  if (profile.dislikedIngredients) {
    try {
      dislikedList = JSON.parse(profile.dislikedIngredients);
    } catch {
      dislikedList = profile.dislikedIngredients.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  return {
    ...profile,
    allergies: allergiesList,
    dislikedIngredients: dislikedList,
    allergiesList,
    dislikedList
  };
}

/**
 * Updates user dietary profile & nutritional targets
 */
export async function updateDietaryProfile(userId, data = {}) {
  const updatePayload = {};

  if (data.dietaryPreference !== undefined) {
    const pref = String(data.dietaryPreference).toUpperCase().trim();
    if (pref && !ALLOWED_DIETARY_PREFERENCES.includes(pref)) {
      throw new NutritionError(
        `Invalid dietary preference. Allowed values: ${ALLOWED_DIETARY_PREFERENCES.join(', ')}`,
        400
      );
    }
    updatePayload.dietaryPreference = pref || 'NONE';
  }

  const numericTargets = [
    'dailyCalorieTarget',
    'proteinTarget',
    'carbohydrateTarget',
    'fatTarget',
    'fiberTarget',
    'sodiumTarget'
  ];

  for (const field of numericTargets) {
    if (data[field] !== undefined) {
      if (data[field] === null || data[field] === '') {
        updatePayload[field] = null;
      } else {
        const val = Number(data[field]);
        if (isNaN(val) || val <= 0) {
          throw new NutritionError(`${field} must be a positive number if provided`, 400);
        }
        updatePayload[field] = Math.round(val * 10) / 10;
      }
    }
  }

  if (data.allergies !== undefined) {
    if (Array.isArray(data.allergies)) {
      updatePayload.allergies = JSON.stringify(data.allergies.map(s => String(s).trim()).filter(Boolean));
    } else if (typeof data.allergies === 'string') {
      const items = data.allergies.split(',').map(s => s.trim()).filter(Boolean);
      updatePayload.allergies = JSON.stringify(items);
    } else {
      updatePayload.allergies = null;
    }
  }

  if (data.dislikedIngredients !== undefined) {
    if (Array.isArray(data.dislikedIngredients)) {
      updatePayload.dislikedIngredients = JSON.stringify(data.dislikedIngredients.map(s => String(s).trim()).filter(Boolean));
    } else if (typeof data.dislikedIngredients === 'string') {
      const items = data.dislikedIngredients.split(',').map(s => s.trim()).filter(Boolean);
      updatePayload.dislikedIngredients = JSON.stringify(items);
    } else {
      updatePayload.dislikedIngredients = null;
    }
  }

  const updated = await prisma.dietaryProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...updatePayload
    },
    update: updatePayload
  });

  return getDietaryProfile(userId);
}

// ============================================================================
// 3. MEAL CONSUMPTION LEDGER & HISTORY
// ============================================================================

/**
 * Records a consumed meal into MealConsumptionHistory with snapshot nutrition values
 */
export async function logMealConsumption(userId, data) {
  if (!data.recipeTitle && !data.recipeId) {
    throw new NutritionError('Recipe title or recipe ID is required to log a meal', 400);
  }

  const servingsConsumed = Math.max(0.1, Number(data.servingsConsumed) || 1);
  if (servingsConsumed > 50) {
    throw new NutritionError('Servings consumed cannot exceed 50', 400);
  }

  const mealType = data.mealType && ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(data.mealType)
    ? data.mealType
    : 'Lunch';

  let consumedDate = new Date();
  if (data.consumedDate) {
    const parsed = new Date(data.consumedDate);
    if (isNaN(parsed.getTime())) {
      throw new NutritionError('Invalid consumedDate format. Expected YYYY-MM-DD or ISO timestamp.', 400);
    }
    consumedDate = parsed;
  }

  let title = data.recipeTitle;
  let calories = null;
  let proteinGrams = null;
  let carbohydratesGrams = null;
  let fatGrams = null;
  let fiberGrams = null;
  let sugarGrams = null;
  let sodiumMilligrams = null;
  let completenessScore = 100;
  let isEstimated = true;

  // If tied to an existing recipe, compute live snapshot
  if (data.recipeId) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: data.recipeId },
      include: { ingredients: true }
    });

    if (recipe) {
      title = recipe.title;
      const nut = calculateRecipeNutrition(recipe, servingsConsumed);
      calories = nut.customEstimate.calories;
      proteinGrams = nut.customEstimate.proteinGrams;
      carbohydratesGrams = nut.customEstimate.carbohydratesGrams;
      fatGrams = nut.customEstimate.fatGrams;
      fiberGrams = nut.customEstimate.fiberGrams;
      sugarGrams = nut.customEstimate.sugarGrams;
      sodiumMilligrams = nut.customEstimate.sodiumMilligrams;
      completenessScore = nut.completenessScore;
      isEstimated = true;
    }
  }

  // If manual numeric overrides were passed (e.g. quick add)
  if (data.calories !== undefined && !isNaN(Number(data.calories))) {
    calories = Math.max(0, Number(data.calories));
  }
  if (data.proteinGrams !== undefined && !isNaN(Number(data.proteinGrams))) {
    proteinGrams = Math.max(0, Number(data.proteinGrams));
  }
  if (data.carbohydratesGrams !== undefined && !isNaN(Number(data.carbohydratesGrams))) {
    carbohydratesGrams = Math.max(0, Number(data.carbohydratesGrams));
  }
  if (data.fatGrams !== undefined && !isNaN(Number(data.fatGrams))) {
    fatGrams = Math.max(0, Number(data.fatGrams));
  }
  if (data.fiberGrams !== undefined && !isNaN(Number(data.fiberGrams))) {
    fiberGrams = Math.max(0, Number(data.fiberGrams));
  }

  const record = await prisma.mealConsumptionHistory.create({
    data: {
      userId,
      mealPlanId: data.mealPlanId || null,
      recipeId: data.recipeId || null,
      recipeTitle: title || 'Custom Meal',
      consumedDate,
      mealType,
      servingsConsumed,
      calories,
      proteinGrams,
      carbohydratesGrams,
      fatGrams,
      fiberGrams,
      sugarGrams,
      sodiumMilligrams,
      source: data.source || (data.mealPlanId ? 'COOKED_MEAL' : 'MANUAL_LOG'),
      isEstimated,
      completenessScore,
      notes: data.notes ? String(data.notes).trim() : null
    }
  });

  return record;
}

/**
 * Updates a logged meal consumption record
 */
export async function updateMealConsumption(userId, id, data) {
  const existing = await prisma.mealConsumptionHistory.findUnique({
    where: { id }
  });

  if (!existing || existing.userId !== userId) {
    throw new NutritionError('Meal consumption record not found', 404);
  }

  const updatePayload = {};

  if (data.mealType && ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(data.mealType)) {
    updatePayload.mealType = data.mealType;
  }

  if (data.consumedDate) {
    const parsed = new Date(data.consumedDate);
    if (isNaN(parsed.getTime())) {
      throw new NutritionError('Invalid consumedDate format', 400);
    }
    updatePayload.consumedDate = parsed;
  }

  if (data.notes !== undefined) {
    updatePayload.notes = data.notes ? String(data.notes).trim() : null;
  }

  if (data.servingsConsumed !== undefined) {
    const newServings = Math.max(0.1, Number(data.servingsConsumed));
    if (newServings > 50) {
      throw new NutritionError('Servings consumed cannot exceed 50', 400);
    }
    const ratio = newServings / existing.servingsConsumed;
    updatePayload.servingsConsumed = newServings;

    // Rescale nutrients proportionally if present
    if (existing.calories !== null) updatePayload.calories = Number((existing.calories * ratio).toFixed(1));
    if (existing.proteinGrams !== null) updatePayload.proteinGrams = Number((existing.proteinGrams * ratio).toFixed(1));
    if (existing.carbohydratesGrams !== null) updatePayload.carbohydratesGrams = Number((existing.carbohydratesGrams * ratio).toFixed(1));
    if (existing.fatGrams !== null) updatePayload.fatGrams = Number((existing.fatGrams * ratio).toFixed(1));
    if (existing.fiberGrams !== null) updatePayload.fiberGrams = Number((existing.fiberGrams * ratio).toFixed(1));
    if (existing.sugarGrams !== null) updatePayload.sugarGrams = Number(((existing.sugarGrams || 0) * ratio).toFixed(1));
    if (existing.sodiumMilligrams !== null) updatePayload.sodiumMilligrams = Number(((existing.sodiumMilligrams || 0) * ratio).toFixed(1));
  }

  const updated = await prisma.mealConsumptionHistory.update({
    where: { id },
    data: updatePayload
  });

  return updated;
}

/**
 * Deletes or marks reversed a meal consumption record
 */
export async function deleteMealConsumption(userId, id) {
  const existing = await prisma.mealConsumptionHistory.findUnique({
    where: { id }
  });

  if (!existing || existing.userId !== userId) {
    throw new NutritionError('Meal consumption record not found', 404);
  }

  await prisma.mealConsumptionHistory.delete({
    where: { id }
  });

  return { success: true, message: 'Meal consumption record deleted successfully' };
}

// ============================================================================
// 4. DAILY & WEEKLY NUTRITION AGGREGATION
// ============================================================================

/**
 * Calculates daily nutrition breakdown for a specific date
 */
export async function getDailyNutrition(userId, targetDateStr = null) {
  let targetDate = new Date();
  if (targetDateStr) {
    const parsed = new Date(targetDateStr);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [meals, profile] = await Promise.all([
    prisma.mealConsumptionHistory.findMany({
      where: {
        userId,
        isReversed: false,
        consumedDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { consumedDate: 'asc' }
    }),
    getDietaryProfile(userId)
  ]);

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSugar = 0;
  let totalSodium = 0;
  let hasIncompleteData = false;

  const mealTypeBreakdown = {
    Breakfast: { meals: [], calories: 0, proteinGrams: 0 },
    Lunch: { meals: [], calories: 0, proteinGrams: 0 },
    Dinner: { meals: [], calories: 0, proteinGrams: 0 },
    Snacks: { meals: [], calories: 0, proteinGrams: 0 }
  };

  for (const meal of meals) {
    const cal = meal.calories || 0;
    const prot = meal.proteinGrams || 0;
    const carbs = meal.carbohydratesGrams || 0;
    const fat = meal.fatGrams || 0;
    const fib = meal.fiberGrams || 0;
    const sug = meal.sugarGrams || 0;
    const sod = meal.sodiumMilligrams || 0;

    totalCalories += cal;
    totalProtein += prot;
    totalCarbs += carbs;
    totalFat += fat;
    totalFiber += fib;
    totalSugar += sug;
    totalSodium += sod;

    if (meal.completenessScore !== null && meal.completenessScore < 100) {
      hasIncompleteData = true;
    }

    const type = mealTypeBreakdown[meal.mealType] ? meal.mealType : 'Lunch';
    mealTypeBreakdown[type].meals.push(meal);
    mealTypeBreakdown[type].calories += cal;
    mealTypeBreakdown[type].proteinGrams += prot;
  }

  // Round summary totals
  const totals = {
    calories: Math.round(totalCalories),
    proteinGrams: Number(totalProtein.toFixed(1)),
    carbohydratesGrams: Number(totalCarbs.toFixed(1)),
    fatGrams: Number(totalFat.toFixed(1)),
    fiberGrams: Number(totalFiber.toFixed(1)),
    sugarGrams: Number(totalSugar.toFixed(1)),
    sodiumMilligrams: Math.round(totalSodium)
  };

  // Compare with user profile targets (if configured)
  const targetsComparison = {
    calories: profile.dailyCalorieTarget ? {
      target: profile.dailyCalorieTarget,
      consumed: totals.calories,
      remaining: Math.max(0, profile.dailyCalorieTarget - totals.calories),
      percentage: Math.min(200, Math.round((totals.calories / profile.dailyCalorieTarget) * 100))
    } : null,
    protein: profile.proteinTarget ? {
      target: profile.proteinTarget,
      consumed: totals.proteinGrams,
      remaining: Math.max(0, Number((profile.proteinTarget - totals.proteinGrams).toFixed(1))),
      percentage: Math.min(200, Math.round((totals.proteinGrams / profile.proteinTarget) * 100))
    } : null,
    carbohydrates: profile.carbohydrateTarget ? {
      target: profile.carbohydrateTarget,
      consumed: totals.carbohydratesGrams,
      remaining: Math.max(0, Number((profile.carbohydrateTarget - totals.carbohydratesGrams).toFixed(1))),
      percentage: Math.min(200, Math.round((totals.carbohydratesGrams / profile.carbohydrateTarget) * 100))
    } : null,
    fat: profile.fatTarget ? {
      target: profile.fatTarget,
      consumed: totals.fatGrams,
      remaining: Math.max(0, Number((profile.fatTarget - totals.fatGrams).toFixed(1))),
      percentage: Math.min(200, Math.round((totals.fatGrams / profile.fatTarget) * 100))
    } : null,
    fiber: profile.fiberTarget ? {
      target: profile.fiberTarget,
      consumed: totals.fiberGrams,
      remaining: Math.max(0, Number((profile.fiberTarget - totals.fiberGrams).toFixed(1))),
      percentage: Math.min(200, Math.round((totals.fiberGrams / profile.fiberTarget) * 100))
    } : null
  };

  return {
    date: toDateString(targetDate),
    mealsCount: meals.length,
    meals,
    totals,
    targetsComparison,
    hasIncompleteData,
    mealTypeBreakdown,
    profile
  };
}

/**
 * Calculates weekly nutrition breakdown (7-day window)
 */
export async function getWeeklyNutrition(userId, fromDateStr = null, toDateStr = null) {
  const { fromDate, toDate } = parseDateRange(fromDateStr, toDateStr);

  const [meals, profile] = await Promise.all([
    prisma.mealConsumptionHistory.findMany({
      where: {
        userId,
        isReversed: false,
        consumedDate: {
          gte: fromDate,
          lte: toDate
        }
      },
      orderBy: { consumedDate: 'asc' }
    }),
    getDietaryProfile(userId)
  ]);

  // Construct day-by-day map
  const dailyMap = {};
  const current = new Date(fromDate);

  while (current <= toDate) {
    const key = toDateString(current);
    dailyMap[key] = {
      date: key,
      dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: 0,
      proteinGrams: 0,
      carbohydratesGrams: 0,
      fatGrams: 0,
      fiberGrams: 0,
      mealsCount: 0,
      meals: []
    };
    current.setDate(current.getDate() + 1);
  }

  // Populate days with recorded meals
  for (const meal of meals) {
    const key = toDateString(meal.consumedDate);
    if (dailyMap[key]) {
      dailyMap[key].calories += meal.calories || 0;
      dailyMap[key].proteinGrams += meal.proteinGrams || 0;
      dailyMap[key].carbohydratesGrams += meal.carbohydratesGrams || 0;
      dailyMap[key].fatGrams += meal.fatGrams || 0;
      dailyMap[key].fiberGrams += meal.fiberGrams || 0;
      dailyMap[key].mealsCount += 1;
      dailyMap[key].meals.push(meal);
    }
  }

  const days = Object.values(dailyMap).map((d) => ({
    ...d,
    calories: Math.round(d.calories),
    proteinGrams: Number(d.proteinGrams.toFixed(1)),
    carbohydratesGrams: Number(d.carbohydratesGrams.toFixed(1)),
    fatGrams: Number(d.fatGrams.toFixed(1)),
    fiberGrams: Number(d.fiberGrams.toFixed(1))
  }));

  // Important: Average ONLY across days with recorded meals
  const daysWithRecords = days.filter((d) => d.mealsCount > 0);
  const activeDaysCount = daysWithRecords.length;

  const totalWeeklyCalories = daysWithRecords.reduce((sum, d) => sum + d.calories, 0);
  const totalWeeklyProtein = daysWithRecords.reduce((sum, d) => sum + d.proteinGrams, 0);
  const totalWeeklyCarbs = daysWithRecords.reduce((sum, d) => sum + d.carbohydratesGrams, 0);
  const totalWeeklyFat = daysWithRecords.reduce((sum, d) => sum + d.fatGrams, 0);
  const totalWeeklyFiber = daysWithRecords.reduce((sum, d) => sum + d.fiberGrams, 0);

  const averages = activeDaysCount > 0 ? {
    calories: Math.round(totalWeeklyCalories / activeDaysCount),
    proteinGrams: Number((totalWeeklyProtein / activeDaysCount).toFixed(1)),
    carbohydratesGrams: Number((totalWeeklyCarbs / activeDaysCount).toFixed(1)),
    fatGrams: Number((totalWeeklyFat / activeDaysCount).toFixed(1)),
    fiberGrams: Number((totalWeeklyFiber / activeDaysCount).toFixed(1)),
    activeDaysCount,
    totalTrackedDays: days.length
  } : {
    calories: 0,
    proteinGrams: 0,
    carbohydratesGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
    activeDaysCount: 0,
    totalTrackedDays: days.length
  };

  return {
    fromDate: toDateString(fromDate),
    toDate: toDateString(toDate),
    days,
    activeDaysCount,
    totalDays: days.length,
    averages,
    profile
  };
}

// ============================================================================
// 5. MEAL CONSUMPTION HISTORY QUERY
// ============================================================================

/**
 * Retrieves paginated meal consumption history with filters
 */
export async function getMealHistory(userId, options = {}) {
  const { fromDate, toDate, mealType, search, page = 1, limit = 20 } = options;

  const where = {
    userId,
    isReversed: false
  };

  if (fromDate || toDate) {
    const range = parseDateRange(fromDate, toDate);
    where.consumedDate = {
      gte: range.fromDate,
      lte: range.toDate
    };
  }

  if (mealType && ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(mealType)) {
    where.mealType = mealType;
  }

  if (search && typeof search === 'string' && search.trim()) {
    where.recipeTitle = {
      contains: search.trim()
    };
  }

  const numLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const numPage = Math.max(1, Number(page) || 1);
  const skip = (numPage - 1) * numLimit;

  const [totalCount, items] = await Promise.all([
    prisma.mealConsumptionHistory.count({ where }),
    prisma.mealConsumptionHistory.findMany({
      where,
      orderBy: { consumedDate: 'desc' },
      skip,
      take: numLimit,
      include: {
        recipe: {
          select: { id: true, title: true, imageUrl: true, category: true, cuisine: true }
        }
      }
    })
  ]);

  return {
    items,
    pagination: {
      total: totalCount,
      page: numPage,
      limit: numLimit,
      totalPages: Math.ceil(totalCount / numLimit)
    }
  };
}

// ============================================================================
// 6. DASHBOARD INTEGRATION METRICS
// ============================================================================

/**
 * Retrieves concise live nutrition summary for the main Dashboard
 */
export async function getDashboardNutritionSummary(userId) {
  const daily = await getDailyNutrition(userId);

  return {
    date: daily.date,
    mealsLoggedToday: daily.mealsCount,
    caloriesToday: daily.totals.calories,
    proteinToday: daily.totals.proteinGrams,
    calorieTarget: daily.profile.dailyCalorieTarget || null,
    proteinTarget: daily.profile.proteinTarget || null,
    calorieProgressPercent: daily.targetsComparison.calories?.percentage || null,
    proteinProgressPercent: daily.targetsComparison.protein?.percentage || null,
    hasIncompleteData: daily.hasIncompleteData,
    dietaryPreference: daily.profile.dietaryPreference || 'NONE'
  };
}

// ============================================================================
// 7. AI NUTRITION ASSISTANT
// ============================================================================

/**
 * Provides AI-assisted nutritional explanation grounded in authentic user data
 */
export async function getNutritionAssistantAdvice(userId, userQuery) {
  if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
    throw new NutritionError('Question or prompt is required for the AI Nutrition Assistant', 400);
  }

  const [daily, weekly, savedRecipes] = await Promise.all([
    getDailyNutrition(userId),
    getWeeklyNutrition(userId),
    prisma.recipe.findMany({
      where: {
        OR: [
          { userId },
          { isPublic: true }
        ]
      },
      include: {
        nutrition: true
      },
      take: 10
    })
  ]);

  const recipeListSummary = savedRecipes.map((r) => ({
    title: r.title,
    category: r.category,
    servings: r.servings,
    caloriesPerServing: r.nutrition?.calories || 'Estimated ~350-400 kcal',
    proteinPerServing: r.nutrition ? `${r.nutrition.proteinGrams}g` : 'Unknown'
  }));

  const contextData = {
    todayTotals: daily.totals,
    todayMealsCount: daily.mealsCount,
    todayMeals: daily.meals.map(m => ({ title: m.recipeTitle, type: m.mealType, servings: m.servingsConsumed, calories: m.calories, protein: m.proteinGrams })),
    targets: {
      calorieTarget: daily.profile.dailyCalorieTarget,
      proteinTarget: daily.profile.proteinTarget,
      dietaryPreference: daily.profile.dietaryPreference,
      allergies: daily.profile.allergiesList
    },
    weeklyAverage: weekly.averages,
    trackedDaysThisWeek: weekly.activeDaysCount,
    recipesSample: recipeListSummary
  };

  const systemInstruction = `You are the Smart Rasoi AI Nutritionist, an empathetic and evidence-based culinary nutrition assistant inside Smart Rasoi.
You provide educational dietary insights, macro balances, and recipe ideas.

CRITICAL BEHAVIORAL RULES:
1. Ground all numbers strictly in the user's authentic context data provided below. Do NOT fabricate calories or macros.
2. State clearly that all values are estimates for guidance only and do not substitute for professional medical or clinical advice.
3. If the user's intake or recipes lack complete nutritional information, honestly acknowledge the data gaps.
4. Respect the user's dietary preferences (e.g. Vegetarian, Vegan) and allergies conservatively.
5. Format responses using clean markdown headings, bullet points, and bold text for readability.

USER AUTHENTIC NUTRITION CONTEXT:
${JSON.stringify(contextData, null, 2)}`;

  try {
    const aiResponse = await generateGeminiContent({
      contents: userQuery.trim(),
      systemInstruction,
      temperature: 0.6,
      maxOutputTokens: 1000
    });

    return {
      query: userQuery,
      answer: aiResponse,
      contextSnapshot: {
        todayCalories: daily.totals.calories,
        todayProtein: daily.totals.proteinGrams,
        dietaryPreference: daily.profile.dietaryPreference
      }
    };
  } catch (err) {
    // Graceful rule-based offline fallback if Gemini API is unreachable or rate limited
    const fallbackAnswer = `### Nutrition Summary
- **Today's Intake**: You have logged **${daily.mealsCount} meals** totaling approximately **${daily.totals.calories} kcal** and **${daily.totals.proteinGrams}g of protein**.
- **Active Dietary Goal**: ${daily.profile.dailyCalorieTarget ? `Daily target is ${daily.profile.dailyCalorieTarget} kcal (${daily.targetsComparison.calories?.remaining || 0} kcal remaining).` : 'No calorie target configured.'}
- **Dietary Preference**: ${daily.profile.dietaryPreference || 'None specified'}.

*(Note: Live AI conversational reasoning is currently running in offline fallback mode. All your recorded database metrics above are exact).*`;

    return {
      query: userQuery,
      answer: fallbackAnswer,
      isFallback: true
    };
  }
}
