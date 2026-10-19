import prisma from '../config/prisma.js';

export class RecipeError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'RecipeError';
    this.statusCode = statusCode;
  }
}

const ALLOWED_SORT_FIELDS = ['title', 'prepTimeMinutes', 'cookTimeMinutes', 'createdAt'];
const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/**
 * Normalizes an ingredient name for comparisons
 */
export const normalizeIngredientName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase();
};

/**
 * Computes inventory matching metadata for a single recipe against a list of inventory items
 */
export const computeRecipeInventoryMatch = (recipe, inventoryItems = []) => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Filter usable inventory: positive quantity and not expired
  const usableItems = inventoryItems.filter((item) => {
    if (Number(item.quantity) <= 0) return false;
    if (item.expiryDate) {
      const exp = new Date(item.expiryDate);
      if (!isNaN(exp.getTime()) && exp < now) {
        return false; // Expired items cannot be used
      }
    }
    return true;
  });

  // Index usable inventory by normalized name
  const inventoryMap = new Map();
  for (const item of usableItems) {
    const key = normalizeIngredientName(item.name);
    if (!inventoryMap.has(key)) {
      inventoryMap.set(key, []);
    }
    inventoryMap.get(key).push(item);
  }

  const recipeIngredients = recipe.ingredients || [];
  const requiredIngredients = recipeIngredients.filter((ing) => !ing.isOptional);
  const optionalIngredients = recipeIngredients.filter((ing) => ing.isOptional);

  const availableIngredients = [];
  const missingIngredients = [];
  const optionalMissingIngredients = [];
  const expiringSoonIngredients = [];

  // Evaluate required ingredients
  for (const ing of requiredIngredients) {
    const key = normalizeIngredientName(ing.name);
    const matchingStock = inventoryMap.get(key);

    if (matchingStock && matchingStock.length > 0) {
      const totalInventoryQty = matchingStock.reduce((sum, item) => sum + Number(item.quantity), 0);
      const unitsInStock = [...new Set(matchingStock.map((item) => item.unit))];

      // Check if any matching stock item expires soon
      const hasExpiringSoon = matchingStock.some((item) => {
        if (!item.expiryDate) return false;
        const exp = new Date(item.expiryDate);
        return exp >= now && exp <= sevenDaysFromNow;
      });

      if (hasExpiringSoon) {
        expiringSoonIngredients.push(ing.name);
      }

      availableIngredients.push({
        id: ing.id,
        name: ing.name,
        recipeQuantity: ing.quantity,
        recipeUnit: ing.unit,
        inventoryQuantity: totalInventoryQty,
        inventoryUnits: unitsInStock,
        isOptional: false,
        expiringSoon: hasExpiringSoon
      });
    } else {
      missingIngredients.push({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: false
      });
    }
  }

  // Evaluate optional ingredients
  for (const ing of optionalIngredients) {
    const key = normalizeIngredientName(ing.name);
    const matchingStock = inventoryMap.get(key);

    if (matchingStock && matchingStock.length > 0) {
      const totalInventoryQty = matchingStock.reduce((sum, item) => sum + Number(item.quantity), 0);
      const unitsInStock = [...new Set(matchingStock.map((item) => item.unit))];

      availableIngredients.push({
        id: ing.id,
        name: ing.name,
        recipeQuantity: ing.quantity,
        recipeUnit: ing.unit,
        inventoryQuantity: totalInventoryQty,
        inventoryUnits: unitsInStock,
        isOptional: true
      });
    } else {
      optionalMissingIngredients.push({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: true
      });
    }
  }

  const totalRequired = requiredIngredients.length;
  const availableRequired = totalRequired - missingIngredients.length;
  const matchPercentage = totalRequired === 0
    ? 100
    : Math.round((availableRequired / totalRequired) * 100);

  // canCook is true ONLY when every required ingredient is available
  const canCook = missingIngredients.length === 0;

  return {
    availableIngredients,
    missingIngredients,
    optionalMissingIngredients,
    totalRequiredIngredients: totalRequired,
    availableRequiredIngredients: availableRequired,
    matchPercentage,
    canCook,
    expiringSoonIngredients
  };
};

/**
 * Validates ingredient array payloads
 */
const validateIngredientsPayload = (ingredients) => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new RecipeError('Recipe must contain at least one ingredient', 400);
  }

  return ingredients.map((ing, idx) => {
    if (!ing.name || typeof ing.name !== 'string' || !ing.name.trim()) {
      throw new RecipeError(`Ingredient at index ${idx} requires a valid name`, 400);
    }
    if (ing.quantity === undefined || ing.quantity === null || isNaN(Number(ing.quantity))) {
      throw new RecipeError(`Ingredient "${ing.name}" requires a numeric quantity`, 400);
    }
    const numQty = Number(ing.quantity);
    if (numQty <= 0) {
      throw new RecipeError(`Ingredient "${ing.name}" quantity must be greater than zero`, 400);
    }
    if (!ing.unit || typeof ing.unit !== 'string' || !ing.unit.trim()) {
      throw new RecipeError(`Ingredient "${ing.name}" requires a unit of measurement`, 400);
    }

    return {
      name: ing.name.trim(),
      quantity: numQty,
      unit: ing.unit.trim(),
      isOptional: Boolean(ing.isOptional)
    };
  });
};

/**
 * List accessible recipes for authenticated user with search, filters, and optional inventory matching
 */
export const listRecipes = async (userId, query = {}) => {
  const {
    search,
    category,
    cuisine,
    difficulty,
    maxPrepTime,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    favouritesOnly,
    availableOnly
  } = query;

  // Authorization: user can access shared recipes (isPublic: true) OR their own recipes
  const accessibilityCondition = {
    OR: [
      { isPublic: true },
      { userId }
    ]
  };

  const andFilters = [accessibilityCondition];

  // 1. Search filter: title, description, or ingredient names
  if (search && search.trim()) {
    const q = search.trim();
    andFilters.push({
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        {
          ingredients: {
            some: {
              name: { contains: q }
            }
          }
        }
      ]
    });
  }

  // 2. Category filter
  if (category && category.trim() && category.trim().toLowerCase() !== 'all') {
    andFilters.push({
      category: { equals: category.trim() }
    });
  }

  // 3. Cuisine filter
  if (cuisine && cuisine.trim() && cuisine.trim().toLowerCase() !== 'all') {
    andFilters.push({
      cuisine: { equals: cuisine.trim() }
    });
  }

  // 4. Difficulty filter
  if (difficulty && difficulty.trim() && difficulty.trim().toLowerCase() !== 'all') {
    andFilters.push({
      difficulty: { equals: difficulty.trim() }
    });
  }

  // 5. Max preparation time filter
  if (maxPrepTime !== undefined && maxPrepTime !== '' && !isNaN(Number(maxPrepTime))) {
    andFilters.push({
      prepTimeMinutes: { lte: Number(maxPrepTime) }
    });
  }

  // 6. Favourites only filter
  if (favouritesOnly === 'true' || favouritesOnly === true) {
    andFilters.push({
      favourites: {
        some: { userId }
      }
    });
  }

  const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  // Fetch recipes with relations
  const recipes = await prisma.recipe.findMany({
    where: {
      AND: andFilters
    },
    include: {
      ingredients: {
        orderBy: { name: 'asc' }
      },
      favourites: {
        where: { userId }
      }
    },
    orderBy: {
      [sortField]: orderDirection
    }
  });

  // Fetch user's inventory to compute matching data
  const userInventory = await prisma.inventoryItem.findMany({
    where: { userId }
  });

  // Attach isFavourite, isOwner, and match summary
  let result = recipes.map((rec) => {
    const isFavourite = rec.favourites.length > 0;
    const isOwner = rec.userId === userId;
    const match = computeRecipeInventoryMatch(rec, userInventory);

    // Omit raw favourites relation array from final payload for clean API response
    const { favourites, ...recipeData } = rec;

    return {
      ...recipeData,
      isFavourite,
      isOwner,
      match: {
        matchPercentage: match.matchPercentage,
        canCook: match.canCook,
        availableCount: match.availableRequiredIngredients,
        requiredCount: match.totalRequiredIngredients,
        missingIngredients: match.missingIngredients.map((m) => m.name),
        expiringSoonIngredients: match.expiringSoonIngredients
      }
    };
  });

  // If availableOnly filter is active, retain only recipes the user can cook
  if (availableOnly === 'true' || availableOnly === true) {
    result = result.filter((r) => r.match.canCook);
  }

  return result;
};

/**
 * Retrieve recipe details by ID with complete inventory matching analysis
 */
export const getRecipeById = async (userId, recipeId) => {
  if (!recipeId) {
    throw new RecipeError('Recipe ID is required', 400);
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        orderBy: { name: 'asc' }
      },
      favourites: {
        where: { userId }
      }
    }
  });

  // Return 404 for nonexistent or private recipes belonging to other users
  if (!recipe) {
    throw new RecipeError('Recipe not found', 404);
  }

  const isAccessible = recipe.isPublic || recipe.userId === userId;
  if (!isAccessible) {
    throw new RecipeError('Recipe not found', 404);
  }

  const userInventory = await prisma.inventoryItem.findMany({
    where: { userId }
  });

  const isFavourite = recipe.favourites.length > 0;
  const isOwner = recipe.userId === userId;
  const matchDetails = computeRecipeInventoryMatch(recipe, userInventory);

  const { favourites, ...recipeData } = recipe;

  return {
    ...recipeData,
    isFavourite,
    isOwner,
    matchDetails
  };
};

/**
 * Create a new user recipe
 */
export const createRecipe = async (userId, data) => {
  const {
    title,
    description,
    instructions,
    category,
    cuisine,
    prepTimeMinutes,
    cookTimeMinutes,
    servings,
    difficulty,
    imageUrl,
    ingredients
  } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new RecipeError('Recipe title is required', 400);
  }
  if (!instructions || typeof instructions !== 'string' || !instructions.trim()) {
    throw new RecipeError('Recipe instructions are required', 400);
  }
  if (!category || typeof category !== 'string' || !category.trim()) {
    throw new RecipeError('Recipe category is required', 400);
  }

  const numPrep = prepTimeMinutes !== undefined ? Number(prepTimeMinutes) : 0;
  if (isNaN(numPrep) || numPrep < 0) {
    throw new RecipeError('Preparation time cannot be negative', 400);
  }

  const numCook = cookTimeMinutes !== undefined ? Number(cookTimeMinutes) : 0;
  if (isNaN(numCook) || numCook < 0) {
    throw new RecipeError('Cooking time cannot be negative', 400);
  }

  const numServings = servings !== undefined ? Number(servings) : 2;
  if (isNaN(numServings) || numServings <= 0) {
    throw new RecipeError('Servings must be a positive number', 400);
  }

  const diff = difficulty && ALLOWED_DIFFICULTIES.includes(difficulty) ? difficulty : 'Easy';
  const validatedIngredients = validateIngredientsPayload(ingredients);

  // Create recipe and ingredients inside single transaction
  const createdRecipe = await prisma.$transaction(async (tx) => {
    const newRecipe = await tx.recipe.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        instructions: instructions.trim(),
        category: category.trim(),
        cuisine: cuisine ? cuisine.trim() : null,
        prepTimeMinutes: numPrep,
        cookTimeMinutes: numCook,
        servings: numServings,
        difficulty: diff,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        isPublic: false, // User created recipes are private by default; clients cannot force isPublic
        userId
      }
    });

    await tx.recipeIngredient.createMany({
      data: validatedIngredients.map((ing) => ({
        recipeId: newRecipe.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: ing.isOptional
      }))
    });

    return tx.recipe.findUnique({
      where: { id: newRecipe.id },
      include: {
        ingredients: {
          orderBy: { name: 'asc' }
        }
      }
    });
  });

  return {
    ...createdRecipe,
    isFavourite: false,
    isOwner: true
  };
};

/**
 * Update an existing user-owned recipe
 */
export const updateRecipe = async (userId, recipeId, data) => {
  if (!recipeId) {
    throw new RecipeError('Recipe ID is required', 400);
  }

  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId }
  });

  if (!existing) {
    throw new RecipeError('Recipe not found', 404);
  }

  // Seed recipes (userId === null) are strictly read-only
  if (existing.userId === null) {
    throw new RecipeError('Shared seed recipes are read-only and cannot be modified', 403);
  }

  // Cross-user IDOR protection
  if (existing.userId !== userId) {
    throw new RecipeError('Recipe not found', 404);
  }

  const updateFields = {};

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim()) {
      throw new RecipeError('Recipe title cannot be empty', 400);
    }
    updateFields.title = data.title.trim();
  }

  if (data.description !== undefined) {
    updateFields.description = data.description ? data.description.trim() : null;
  }

  if (data.instructions !== undefined) {
    if (typeof data.instructions !== 'string' || !data.instructions.trim()) {
      throw new RecipeError('Recipe instructions cannot be empty', 400);
    }
    updateFields.instructions = data.instructions.trim();
  }

  if (data.category !== undefined) {
    if (typeof data.category !== 'string' || !data.category.trim()) {
      throw new RecipeError('Recipe category cannot be empty', 400);
    }
    updateFields.category = data.category.trim();
  }

  if (data.cuisine !== undefined) {
    updateFields.cuisine = data.cuisine ? data.cuisine.trim() : null;
  }

  if (data.prepTimeMinutes !== undefined) {
    const numPrep = Number(data.prepTimeMinutes);
    if (isNaN(numPrep) || numPrep < 0) {
      throw new RecipeError('Preparation time cannot be negative', 400);
    }
    updateFields.prepTimeMinutes = numPrep;
  }

  if (data.cookTimeMinutes !== undefined) {
    const numCook = Number(data.cookTimeMinutes);
    if (isNaN(numCook) || numCook < 0) {
      throw new RecipeError('Cooking time cannot be negative', 400);
    }
    updateFields.cookTimeMinutes = numCook;
  }

  if (data.servings !== undefined) {
    const numServings = Number(data.servings);
    if (isNaN(numServings) || numServings <= 0) {
      throw new RecipeError('Servings must be a positive number', 400);
    }
    updateFields.servings = numServings;
  }

  if (data.difficulty !== undefined) {
    if (!ALLOWED_DIFFICULTIES.includes(data.difficulty)) {
      throw new RecipeError('Difficulty must be Easy, Medium, or Hard', 400);
    }
    updateFields.difficulty = data.difficulty;
  }

  if (data.imageUrl !== undefined) {
    updateFields.imageUrl = data.imageUrl ? data.imageUrl.trim() : null;
  }

  let validatedIngredients = null;
  if (data.ingredients !== undefined) {
    validatedIngredients = validateIngredientsPayload(data.ingredients);
  }

  // Update in a transaction if ingredients are being modified
  const updatedRecipe = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateFields).length > 0) {
      await tx.recipe.update({
        where: { id: recipeId },
        data: updateFields
      });
    }

    if (validatedIngredients) {
      await tx.recipeIngredient.deleteMany({
        where: { recipeId }
      });

      await tx.recipeIngredient.createMany({
        data: validatedIngredients.map((ing) => ({
          recipeId,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isOptional: ing.isOptional
        }))
      });

      // Invalidate cached nutrition on ingredient modification so future requests recalculate fresh
      try {
        await tx.recipeNutrition.deleteMany({
          where: { recipeId }
        });
      } catch {
        // Non-fatal
      }
    }

    return tx.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          orderBy: { name: 'asc' }
        },
        favourites: {
          where: { userId }
        }
      }
    });
  });

  const isFavourite = updatedRecipe.favourites.length > 0;
  const { favourites, ...recipeData } = updatedRecipe;

  return {
    ...recipeData,
    isFavourite,
    isOwner: true
  };
};

/**
 * Delete a user-owned recipe
 */
export const deleteRecipe = async (userId, recipeId) => {
  if (!recipeId) {
    throw new RecipeError('Recipe ID is required', 400);
  }

  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId }
  });

  if (!existing) {
    throw new RecipeError('Recipe not found', 404);
  }

  if (existing.userId === null) {
    throw new RecipeError('Shared seed recipes cannot be deleted', 403);
  }

  if (existing.userId !== userId) {
    throw new RecipeError('Recipe not found', 404);
  }

  await prisma.recipe.delete({
    where: { id: recipeId }
  });

  return { id: recipeId };
};

/**
 * Add a recipe to user's favourites (idempotent / prevents duplicates)
 */
export const addFavourite = async (userId, recipeId) => {
  if (!recipeId) {
    throw new RecipeError('Recipe ID is required', 400);
  }

  // Verify recipe exists and is accessible to this user
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId }
  });

  if (!recipe) {
    throw new RecipeError('Recipe not found', 404);
  }

  const isAccessible = recipe.isPublic || recipe.userId === userId;
  if (!isAccessible) {
    throw new RecipeError('Recipe not found', 404);
  }

  // Upsert to ensure idempotency
  await prisma.favourite.upsert({
    where: {
      userId_recipeId: {
        userId,
        recipeId
      }
    },
    update: {},
    create: {
      userId,
      recipeId
    }
  });

  return { recipeId, isFavourite: true };
};

/**
 * Remove a recipe from user's favourites (idempotent)
 */
export const removeFavourite = async (userId, recipeId) => {
  if (!recipeId) {
    throw new RecipeError('Recipe ID is required', 400);
  }

  try {
    await prisma.favourite.delete({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });
  } catch (err) {
    // If favourite didn't exist, ignore error for idempotency
    if (err.code !== 'P2025') {
      throw err;
    }
  }

  return { recipeId, isFavourite: false };
};

/**
 * List all favourite recipes for authenticated user
 */
export const listFavourites = async (userId) => {
  const favourites = await prisma.favourite.findMany({
    where: { userId },
    include: {
      recipe: {
        include: {
          ingredients: {
            orderBy: { name: 'asc' }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const userInventory = await prisma.inventoryItem.findMany({
    where: { userId }
  });

  return favourites.map((fav) => {
    const rec = fav.recipe;
    const match = computeRecipeInventoryMatch(rec, userInventory);
    return {
      ...rec,
      isFavourite: true,
      isOwner: rec.userId === userId,
      match: {
        matchPercentage: match.matchPercentage,
        canCook: match.canCook,
        availableCount: match.availableRequiredIngredients,
        requiredCount: match.totalRequiredIngredients,
        missingIngredients: match.missingIngredients.map((m) => m.name),
        expiringSoonIngredients: match.expiringSoonIngredients
      }
    };
  });
};

/**
 * Get recipe inventory matches across all accessible recipes
 */
export const getRecipeMatches = async (userId) => {
  const recipes = await prisma.recipe.findMany({
    where: {
      OR: [
        { isPublic: true },
        { userId }
      ]
    },
    include: {
      ingredients: {
        orderBy: { name: 'asc' }
      },
      favourites: {
        where: { userId }
      }
    }
  });

  const userInventory = await prisma.inventoryItem.findMany({
    where: { userId }
  });

  const matched = recipes.map((rec) => {
    const isFavourite = rec.favourites.length > 0;
    const isOwner = rec.userId === userId;
    const match = computeRecipeInventoryMatch(rec, userInventory);

    const { favourites, ...recipeData } = rec;

    return {
      ...recipeData,
      isFavourite,
      isOwner,
      availableIngredients: match.availableIngredients,
      missingIngredients: match.missingIngredients,
      optionalMissingIngredients: match.optionalMissingIngredients,
      totalRequiredIngredients: match.totalRequiredIngredients,
      availableRequiredIngredients: match.availableRequiredIngredients,
      matchPercentage: match.matchPercentage,
      canCook: match.canCook,
      expiringSoonIngredients: match.expiringSoonIngredients
    };
  });

  // Sort by matchPercentage desc, then canCook desc, then title asc
  matched.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    if (a.canCook !== b.canCook) {
      return a.canCook ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });

  return matched;
};
