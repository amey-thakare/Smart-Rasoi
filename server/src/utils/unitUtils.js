/**
 * Smart Rasoi - Unit Utilities & Conversion Engine
 *
 * Provides safe normalization and conversion between compatible culinary units.
 * Incompatible unit combinations (e.g., volume/mass mismatch like 'cups' vs 'g')
 * are explicitly flagged as requiring manual review rather than making unsafe assumptions.
 */

export const normalizeUnit = (unit) => {
  if (!unit || typeof unit !== 'string') return '';
  const u = unit.trim().toLowerCase();
  if (u === 'gram' || u === 'grams' || u === 'gm' || u === 'g.') return 'g';
  if (u === 'kilogram' || u === 'kilograms' || u === 'kg.' || u === 'kgs') return 'kg';
  if (u === 'milliliter' || u === 'milliliters' || u === 'millilitre' || u === 'millilitres' || u === 'ml.') return 'ml';
  if (u === 'liter' || u === 'liters' || u === 'litre' || u === 'litres' || u === 'l.' || u === 'lts') return 'l';
  if (u === 'tablespoon' || u === 'tablespoons' || u === 'tbsp.' || u === 'tbs') return 'tbsp';
  if (u === 'teaspoon' || u === 'teaspoons' || u === 'tsp.') return 'tsp';
  if (u === 'cup' || u === 'cups.') return 'cups';
  if (u === 'piece' || u === 'pieces' || u === 'pc' || u === 'pcs.' || u === 'units' || u === 'unit') return 'pcs';
  if (u === 'pinch' || u === 'pinches') return 'pinch';
  return u;
};

/**
 * Checks if two units are compatible and converts targetQuantity to inventoryUnit if possible.
 * Returns { compatible: boolean, convertedQuantity: number|null, factor: number|null, requiresReview: boolean }
 */
export const convertQuantity = (amount, fromUnitRaw, toUnitRaw) => {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    return { compatible: false, convertedQuantity: 0, factor: 0, requiresReview: true };
  }

  const fromUnit = normalizeUnit(fromUnitRaw);
  const toUnit = normalizeUnit(toUnitRaw);

  // Exact unit match
  if (fromUnit === toUnit) {
    return {
      compatible: true,
      convertedQuantity: Number(numAmount.toFixed(3)),
      factor: 1,
      requiresReview: false
    };
  }

  // Mass conversion (g <-> kg)
  if (fromUnit === 'g' && toUnit === 'kg') {
    return {
      compatible: true,
      convertedQuantity: Number((numAmount / 1000).toFixed(4)),
      factor: 0.001,
      requiresReview: false
    };
  }
  if (fromUnit === 'kg' && toUnit === 'g') {
    return {
      compatible: true,
      convertedQuantity: Number((numAmount * 1000).toFixed(2)),
      factor: 1000,
      requiresReview: false
    };
  }

  // Volume conversion (ml <-> l)
  if (fromUnit === 'ml' && toUnit === 'l') {
    return {
      compatible: true,
      convertedQuantity: Number((numAmount / 1000).toFixed(4)),
      factor: 0.001,
      requiresReview: false
    };
  }
  if (fromUnit === 'l' && toUnit === 'ml') {
    return {
      compatible: true,
      convertedQuantity: Number((numAmount * 1000).toFixed(2)),
      factor: 1000,
      requiresReview: false
    };
  }

  // Small volume conversions (tsp <-> tbsp)
  if (fromUnit === 'tsp' && toUnit === 'tbsp') {
    return {
      compatible: true,
      convertedQuantity: Number((numAmount / 3).toFixed(3)),
      factor: 1 / 3,
      requiresReview: false
    };
  }
  if (fromUnit === 'tbsp' && toUnit === 'tsp') {
    return {
      compatible: true,
      convertedQuantity: Number((numAmount * 3).toFixed(2)),
      factor: 3,
      requiresReview: false
    };
  }

  // Cross-category or ambiguous conversions (e.g. cups vs g, pcs vs kg)
  // Strictly flag as requiring manual review instead of guessing density
  return {
    compatible: false,
    convertedQuantity: null,
    factor: null,
    requiresReview: true
  };
};
