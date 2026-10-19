/**
 * Smart Rasoi - Phase 9 Nutrition Calculation Engine
 * 
 * Deterministic nutrition calculation for recipes based on ingredient composition,
 * standard weight conversions, and transparent completeness/uncertainty metrics.
 * 
 * Important Rules:
 * - Missing ingredient data is NEVER interpreted as zero.
 * - Missing or incompatible units are recorded explicitly in missingIngredients.
 * - All results are clearly flagged as estimates with a completeness score.
 */

import {
  INGREDIENT_NUTRITION_PER_100G,
  INGREDIENT_ALIASES,
  GENERIC_UNIT_TO_GRAMS
} from '../data/nutritionReference.js';

/**
 * Normalizes and cleanses an ingredient name to identify its reference key
 */
export function resolveCanonicalIngredientKey(rawName) {
  if (!rawName || typeof rawName !== 'string') return null;

  let cleaned = rawName
    .toLowerCase()
    .trim()
    // Remove descriptive culinary modifiers that don't change base item composition
    .replace(/\b(fresh|raw|organic|diced|chopped|sliced|minced|grated|peeled|boneless|skinless|warm|cold|crumbled|to taste)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Direct match in reference database
  if (INGREDIENT_NUTRITION_PER_100G[cleaned]) {
    return cleaned;
  }

  // 2. Direct match in alias dictionary
  if (INGREDIENT_ALIASES[cleaned]) {
    return INGREDIENT_ALIASES[cleaned];
  }

  // 3. Remove plural 's' or 'es'
  const singular = cleaned.replace(/es$/, '').replace(/s$/, '');
  if (INGREDIENT_NUTRITION_PER_100G[singular]) {
    return singular;
  }
  if (INGREDIENT_ALIASES[singular]) {
    return INGREDIENT_ALIASES[singular];
  }

  // 4. Substring / partial keyword matching
  const keys = Object.keys(INGREDIENT_NUTRITION_PER_100G);
  for (const key of keys) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return key;
    }
  }

  // 5. Alias substring matching
  const aliasKeys = Object.keys(INGREDIENT_ALIASES);
  for (const alias of aliasKeys) {
    if (cleaned.includes(alias)) {
      return INGREDIENT_ALIASES[alias];
    }
  }

  return null;
}

/**
 * Converts a quantity and unit of an ingredient into grams
 */
export function convertQuantityToGrams(ingredientKey, quantity, rawUnit) {
  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    return null;
  }

  const unit = (rawUnit || 'g').toLowerCase().trim();
  const ref = ingredientKey ? INGREDIENT_NUTRITION_PER_100G[ingredientKey] : null;

  // 1. Piece / piece-count units
  if (['piece', 'pieces', 'pcs', 'pc'].includes(unit)) {
    if (ref && ref.defaultPieceWeightGrams) {
      return numQty * ref.defaultPieceWeightGrams;
    }
    // General fallback for uncalibrated items: 100g per piece
    return numQty * 100;
  }

  // 2. Clove units (Garlic)
  if (['clove', 'cloves'].includes(unit)) {
    return numQty * 3;
  }

  // 3. Leaf units (Basil / Mint)
  if (['leaf', 'leaves'].includes(unit)) {
    return numQty * 0.5;
  }

  // 4. Cup units (Use ingredient-specific cup weight if available)
  if (['cup', 'cups'].includes(unit)) {
    if (ref && ref.cupWeightGrams) {
      return numQty * ref.cupWeightGrams;
    }
    return numQty * 200; // Standard culinary cup default
  }

  // 5. Generic mass or volume units
  if (GENERIC_UNIT_TO_GRAMS[unit] !== undefined) {
    return numQty * GENERIC_UNIT_TO_GRAMS[unit];
  }

  return null;
}

/**
 * Calculates nutritional breakdown for a recipe
 * 
 * @param {Object} recipe - Recipe object with ingredients array and servings
 * @param {number|null} customServings - Optional custom serving size to scale estimates
 * @returns {Object} Structured nutrition analysis with uncertainty metrics
 */
export function calculateRecipeNutrition(recipe, customServings = null) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const baseServings = Math.max(1, Number(recipe.servings) || 1);
  const activeServings = customServings ? Math.max(1, Number(customServings)) : baseServings;

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSugar = 0;
  let totalSodium = 0;

  const knownIngredients = [];
  const missingIngredients = [];

  for (const item of ingredients) {
    const rawName = item.name || '';
    const key = resolveCanonicalIngredientKey(rawName);

    if (!key) {
      missingIngredients.push({
        name: rawName,
        reason: 'Nutritional profile not available in reference database'
      });
      continue;
    }

    const ref = INGREDIENT_NUTRITION_PER_100G[key];
    const grams = convertQuantityToGrams(key, item.quantity, item.unit);

    if (grams === null) {
      missingIngredients.push({
        name: rawName,
        unit: item.unit,
        quantity: item.quantity,
        reason: `Unit "${item.unit}" could not be converted reliably to standard grams`
      });
      continue;
    }

    const ratio = grams / 100;
    const itemCal = ref.calories * ratio;
    const itemProt = ref.proteinGrams * ratio;
    const itemCarbs = ref.carbohydratesGrams * ratio;
    const itemFat = ref.fatGrams * ratio;
    const itemFiber = ref.fiberGrams * ratio;
    const itemSugar = (ref.sugarGrams || 0) * ratio;
    const itemSodium = (ref.sodiumMilligrams || 0) * ratio;

    totalCalories += itemCal;
    totalProtein += itemProt;
    totalCarbs += itemCarbs;
    totalFat += itemFat;
    totalFiber += itemFiber;
    totalSugar += itemSugar;
    totalSodium += itemSodium;

    knownIngredients.push({
      name: rawName,
      canonicalKey: key,
      grams: Number(grams.toFixed(1)),
      calories: Number(itemCal.toFixed(1)),
      proteinGrams: Number(itemProt.toFixed(1)),
      carbohydratesGrams: Number(itemCarbs.toFixed(1)),
      fatGrams: Number(itemFat.toFixed(1))
    });
  }

  const totalIngredientsCount = ingredients.length;
  const knownCount = knownIngredients.length;
  const completenessScore = totalIngredientsCount > 0
    ? Math.round((knownCount / totalIngredientsCount) * 100)
    : 0;

  let source = 'CALCULATED';
  if (completenessScore === 0) {
    source = 'UNAVAILABLE';
  } else if (completenessScore < 100) {
    source = 'INCOMPLETE';
  }

  // Per serving values (based on recipe base servings)
  const perServing = {
    calories: Number((totalCalories / baseServings).toFixed(1)),
    proteinGrams: Number((totalProtein / baseServings).toFixed(1)),
    carbohydratesGrams: Number((totalCarbs / baseServings).toFixed(1)),
    fatGrams: Number((totalFat / baseServings).toFixed(1)),
    fiberGrams: Number((totalFiber / baseServings).toFixed(1)),
    sugarGrams: Number((totalSugar / baseServings).toFixed(1)),
    sodiumMilligrams: Number((totalSodium / baseServings).toFixed(1))
  };

  // Total recipe values
  const totalRecipe = {
    calories: Number(totalCalories.toFixed(1)),
    proteinGrams: Number(totalProtein.toFixed(1)),
    carbohydratesGrams: Number(totalCarbs.toFixed(1)),
    fatGrams: Number(totalFat.toFixed(1)),
    fiberGrams: Number(totalFiber.toFixed(1)),
    sugarGrams: Number(totalSugar.toFixed(1)),
    sodiumMilligrams: Number(totalSodium.toFixed(1))
  };

  // Custom servings scale
  const customEstimate = {
    servings: activeServings,
    calories: Number((perServing.calories * activeServings).toFixed(1)),
    proteinGrams: Number((perServing.proteinGrams * activeServings).toFixed(1)),
    carbohydratesGrams: Number((perServing.carbohydratesGrams * activeServings).toFixed(1)),
    fatGrams: Number((perServing.fatGrams * activeServings).toFixed(1)),
    fiberGrams: Number((perServing.fiberGrams * activeServings).toFixed(1)),
    sugarGrams: Number((perServing.sugarGrams * activeServings).toFixed(1)),
    sodiumMilligrams: Number((perServing.sodiumMilligrams * activeServings).toFixed(1))
  };

  return {
    servings: baseServings,
    perServing,
    totalRecipe,
    customServings: activeServings,
    customEstimate,
    source,
    isEstimated: true,
    completenessScore,
    missingIngredients,
    knownIngredients,
    totalIngredientsCount,
    disclaimer: 'Nutritional estimates are computed from ingredient composition for dietary awareness and are not guaranteed laboratory values or medical advice.'
  };
}
