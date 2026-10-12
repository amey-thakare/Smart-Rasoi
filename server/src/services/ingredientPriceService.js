import prisma from '../config/prisma.js';
import { normalizeUnit, convertQuantity } from '../utils/unitUtils.js';

export class PriceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'PriceError';
    this.status = status;
    this.statusCode = status;
  }
}

const normalizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase();
};

/**
 * Records an ingredient price observation
 */
export const recordPrice = async (userId, data = {}) => {
  const { ingredientName, unit, price, quantity = 1, source = 'MANUAL' } = data;

  if (!ingredientName || typeof ingredientName !== 'string' || !ingredientName.trim()) {
    throw new PriceError('Ingredient name is required', 400);
  }

  if (!unit || typeof unit !== 'string' || !unit.trim()) {
    throw new PriceError('Unit of measurement is required', 400);
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    throw new PriceError('Price must be a non-negative number', 400);
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    throw new PriceError('Quantity must be greater than zero', 400);
  }

  const cleanUnit = normalizeUnit(unit);
  const cleanName = ingredientName.trim();
  const unitPrice = Number((numPrice / numQty).toFixed(2));

  const recorded = await prisma.ingredientPrice.create({
    data: {
      userId,
      ingredientName: cleanName,
      unit: cleanUnit,
      price: Number(numPrice.toFixed(2)),
      unitPrice,
      quantity: Number(numQty.toFixed(2)),
      source: typeof source === 'string' ? source.trim().slice(0, 50) : 'MANUAL'
    }
  });

  return recorded;
};

/**
 * Fetches price records for user, optionally filtered by ingredientName
 */
export const getPrices = async (userId, filters = {}) => {
  const { ingredientName, limit = 50 } = filters;

  const where = { userId };
  if (ingredientName && typeof ingredientName === 'string' && ingredientName.trim()) {
    where.ingredientName = {
      contains: ingredientName.trim()
    };
  }

  const take = Math.min(Math.max(Number(limit) || 50, 1), 200);

  const prices = await prisma.ingredientPrice.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take
  });

  return prices;
};

/**
 * Finds the latest recorded price for an ingredient and converts it to targetUnit if compatible
 */
export const getLatestPriceForIngredient = async (userId, ingredientName, targetUnit) => {
  if (!ingredientName || typeof ingredientName !== 'string') return null;

  const cleanName = ingredientName.trim();
  const normTargetUnit = normalizeUnit(targetUnit);

  // Search for the latest price entry for this ingredient
  const allPrices = await prisma.ingredientPrice.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' }
  });

  const match = allPrices.find(
    (p) => normalizeName(p.ingredientName) === normalizeName(cleanName)
  );

  if (!match) return null;

  // If no target unit requested or identical unit
  if (!normTargetUnit || match.unit === normTargetUnit) {
    return {
      price: match.price,
      unitPrice: match.unitPrice,
      unit: match.unit,
      source: match.source,
      recordedAt: match.recordedAt,
      isConverted: false
    };
  }

  // Check unit conversion compatibility: convert 1 unit of targetUnit into match.unit
  const conversion = convertQuantity(1, normTargetUnit, match.unit);
  if (conversion.compatible && conversion.convertedQuantity) {
    const convertedUnitPrice = Number((match.unitPrice * conversion.convertedQuantity).toFixed(4));
    return {
      price: convertedUnitPrice,
      unitPrice: convertedUnitPrice,
      unit: normTargetUnit,
      originalUnit: match.unit,
      originalUnitPrice: match.unitPrice,
      source: match.source,
      recordedAt: match.recordedAt,
      isConverted: true
    };
  }

  // Incompatible unit
  return null;
};

/**
 * Computes price trends across ingredients for user
 */
export const getPriceTrends = async (userId) => {
  const allPrices = await prisma.ingredientPrice.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' }
  });

  const grouped = new Map();

  for (const p of allPrices) {
    const key = normalizeName(p.ingredientName);
    if (!grouped.has(key)) {
      grouped.set(key, {
        ingredientName: p.ingredientName,
        unit: p.unit,
        records: []
      });
    }
    grouped.get(key).records.push(p);
  }

  const trends = [];

  for (const item of grouped.values()) {
    const latest = item.records[0];
    const previous = item.records[1] || null;

    let trend = 'stable';
    let percentChange = 0;

    if (previous && previous.unitPrice > 0) {
      const diff = latest.unitPrice - previous.unitPrice;
      percentChange = Number(((diff / previous.unitPrice) * 100).toFixed(1));
      if (diff > 0.05) trend = 'up';
      else if (diff < -0.05) trend = 'down';
    }

    const totalUnitPrice = item.records.reduce((acc, r) => acc + r.unitPrice, 0);
    const averageUnitPrice = Number((totalUnitPrice / item.records.length).toFixed(2));

    trends.push({
      ingredientName: item.ingredientName,
      unit: latest.unit,
      latestUnitPrice: latest.unitPrice,
      previousUnitPrice: previous ? previous.unitPrice : null,
      averageUnitPrice,
      trend,
      percentChange,
      recordedCount: item.records.length,
      lastRecordedAt: latest.recordedAt
    });
  }

  return trends;
};
