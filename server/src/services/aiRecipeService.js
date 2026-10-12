import prisma from '../config/prisma.js';
import { generateGeminiContent } from './geminiService.js';
import { normalizeIngredientName } from './recipeService.js';
import { env } from '../config/env.js';

export class AiRecipeError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AiRecipeError';
    this.statusCode = statusCode;
  }
}

/**
 * Robust JSON extractor that handles markdown fences, preamble, and postscript
 */
export const extractJsonFromText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new AiRecipeError('AI returned an empty response.', 502);
  }

  // 1. Try markdown code fence regex
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (err) {
      // Continue to next extraction strategy
    }
  }

  // 2. Find outer curly braces
  const firstOpen = rawText.indexOf('{');
  const lastClose = rawText.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose > firstOpen) {
    const candidate = rawText.substring(firstOpen, lastClose + 1).trim();
    try {
      return JSON.parse(candidate);
    } catch (err) {
      // Continue
    }
  }

  // 3. Direct JSON parse
  try {
    return JSON.parse(rawText.trim());
  } catch (err) {
    throw new AiRecipeError('Failed to parse structured recipe from AI response. Please try again.', 502);
  }
};

/**
 * Validates and normalizes structured recipe payload
 */
export const validateAndNormalizeRecipe = (data, userInventory = [], manualIngredients = []) => {
  if (!data || typeof data !== 'object') {
    throw new AiRecipeError('AI response format was invalid.', 502);
  }

  const title = (data.title || data.name || 'AI Chef Special').trim();
  const description = data.description ? String(data.description).trim() : null;

  // Instructions normalization: accept string or array of steps
  let instructions = '';
  if (Array.isArray(data.instructions)) {
    instructions = data.instructions
      .map((s) => String(s).trim())
      .filter(Boolean)
      .join('\n');
  } else if (typeof data.instructions === 'string') {
    instructions = data.instructions.trim();
  }

  if (!instructions) {
    instructions = '1. Prepare all ingredients as described.\n2. Cook following standard culinary steps.\n3. Serve warm and enjoy.';
  }

  const category = (data.category || data.mealType || 'Dinner').trim();
  const cuisine = data.cuisine ? String(data.cuisine).trim() : 'General';
  const prepTimeMinutes = Math.max(0, parseInt(data.prepTimeMinutes, 10) || 15);
  const cookTimeMinutes = Math.max(0, parseInt(data.cookTimeMinutes, 10) || 20);
  const totalTimeMinutes = data.totalTimeMinutes ? parseInt(data.totalTimeMinutes, 10) : (prepTimeMinutes + cookTimeMinutes);
  const servings = Math.max(1, parseInt(data.servings, 10) || 2);
  
  const rawDiff = String(data.difficulty || 'Easy').trim().toLowerCase();
  const difficulty = rawDiff.includes('hard') || rawDiff.includes('adv') ? 'Hard' : rawDiff.includes('med') ? 'Medium' : 'Easy';

  // Normalize ingredients
  const rawIngredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  if (rawIngredients.length === 0) {
    throw new AiRecipeError('AI response did not include any ingredients.', 502);
  }

  // Build index of user's available inventory and manual items
  const inventorySet = new Set();
  const now = new Date();
  for (const item of userInventory) {
    // Only non-expired items count as available
    if (item.expiryDate && new Date(item.expiryDate) < now) continue;
    if (Number(item.quantity) <= 0) continue;
    inventorySet.add(normalizeIngredientName(item.name));
  }
  for (const item of manualIngredients) {
    if (typeof item === 'string' && item.trim()) {
      inventorySet.add(normalizeIngredientName(item));
    }
  }

  const normalizedIngredients = [];
  const missingIngredients = [];
  const inventoryUsage = [];

  for (let i = 0; i < rawIngredients.length; i++) {
    const rawIng = rawIngredients[i];
    if (!rawIng || typeof rawIng !== 'object') continue;

    const ingName = String(rawIng.name || `Ingredient ${i + 1}`).trim();
    const ingQty = Math.max(0.1, Number(rawIng.quantity) || 1);
    const ingUnit = String(rawIng.unit || 'pcs').trim();
    const isOptional = Boolean(rawIng.isOptional || rawIng.optional);

    const normKey = normalizeIngredientName(ingName);
    
    // Check if ingredient or substring matches inventory
    let isAvailable = inventorySet.has(normKey);
    if (!isAvailable) {
      for (const invName of inventorySet) {
        if (normKey.includes(invName) || invName.includes(normKey)) {
          isAvailable = true;
          break;
        }
      }
    }

    const inventoryStatus = isAvailable ? 'available' : 'missing';

    if (isAvailable) {
      inventoryUsage.push(ingName);
    } else if (!isOptional) {
      missingIngredients.push(ingName);
    }

    normalizedIngredients.push({
      name: ingName,
      quantity: Number(ingQty.toFixed(2)),
      unit: ingUnit,
      isOptional,
      inventoryStatus
    });
  }

  // Format substitutions array
  const substitutions = Array.isArray(data.substitutions)
    ? data.substitutions.map((s) => ({
        ingredient: String(s.ingredient || s.original || '').trim(),
        substitute: String(s.substitute || s.replacement || '').trim(),
        note: String(s.note || s.reason || '').trim()
      })).filter((s) => s.ingredient && s.substitute)
    : [];

  // Format dietary tags
  const dietaryTags = Array.isArray(data.dietaryTags)
    ? data.dietaryTags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  return {
    title,
    description,
    ingredients: normalizedIngredients,
    instructions,
    instructionsList: instructions.split('\n').filter((s) => s.trim()),
    prepTimeMinutes,
    cookTimeMinutes,
    totalTimeMinutes,
    servings,
    difficulty,
    category,
    cuisine,
    dietaryTags,
    substitutions,
    missingIngredients,
    inventoryUsage,
    explanation: data.explanation ? String(data.explanation).trim() : null
  };
};

/**
 * Generate a recipe using Gemini AI and user's kitchen context
 */
export const generateAiRecipe = async (userId, payload = {}) => {
  const {
    ingredientsToUse = [],
    ingredientsToAvoid = [],
    cuisine,
    mealType,
    dietaryPreference,
    maxPrepTime,
    difficulty,
    servings = 2,
    instructions: customNotes
  } = payload;

  // Validate inputs
  const numServings = Math.max(1, Math.min(20, parseInt(servings, 10) || 2));
  const numMaxPrep = maxPrepTime ? Math.max(5, Math.min(180, parseInt(maxPrepTime, 10))) : null;

  // Format manual items
  const manualItems = Array.isArray(ingredientsToUse)
    ? ingredientsToUse.map((i) => String(i).trim()).filter(Boolean)
    : typeof ingredientsToUse === 'string'
      ? ingredientsToUse.split(',').map((i) => i.trim()).filter(Boolean)
      : [];

  const avoidItems = Array.isArray(ingredientsToAvoid)
    ? ingredientsToAvoid.map((i) => String(i).trim()).filter(Boolean)
    : typeof ingredientsToAvoid === 'string'
      ? ingredientsToAvoid.split(',').map((i) => i.trim()).filter(Boolean)
      : [];

  // Load user's real inventory from SQLite
  const userInventory = await prisma.inventoryItem.findMany({
    where: { userId },
    orderBy: { expiryDate: 'asc' }
  });

  const now = new Date();
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const inventorySummaryLines = userInventory
    .filter((i) => !i.expiryDate || new Date(i.expiryDate) >= now)
    .slice(0, 30)
    .map((i) => {
      const expiringSoon = i.expiryDate && new Date(i.expiryDate) <= sevenDaysAhead ? ' [EXPIRING SOON - USE FIRST]' : '';
      return `- ${i.name} (${i.quantity} ${i.unit})${expiringSoon}`;
    });

  const inventoryPrompt = inventorySummaryLines.length > 0
    ? inventorySummaryLines.join('\n')
    : 'No ingredients currently in pantry inventory.';

  const systemInstruction = `You are the Smart Rasoi Executive Chef AI.
Generate a structured, practical, and delicious home-cooking recipe.

CRITICAL INVENTORY & ACCURACY RULES:
1. The user's real inventory is provided below. Prioritize ingredients marked [EXPIRING SOON - USE FIRST] to prevent food waste.
2. Only mark ingredients as available if they appear in their inventory OR are explicitly listed in "MANUAL INGREDIENTS TO USE".
3. Any additional ingredients required to complete the recipe must be realistic, kept to a minimum, and clearly designated.
4. Output MUST be valid, raw JSON (no conversational pleasantries, no markdown other than optional json code block).

TARGET JSON SCHEMA:
{
  "title": "Recipe Title",
  "description": "Engaging 1-2 sentence culinary summary",
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": 200,
      "unit": "g",
      "isOptional": false
    }
  ],
  "instructions": [
    "Step 1: Specific action with timing and visual cues.",
    "Step 2: ..."
  ],
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 20,
  "totalTimeMinutes": 35,
  "servings": 2,
  "difficulty": "Easy",
  "category": "Dinner",
  "cuisine": "Indian",
  "dietaryTags": ["Vegetarian"],
  "substitutions": [
    {
      "ingredient": "Heavy Cream",
      "substitute": "Plain yogurt or cashew cream",
      "note": "Reduces calories while preserving creaminess"
    }
  ],
  "explanation": "Why this recipe fits the user's ingredients and how expiring stock is utilized."
}`;

  const promptParts = [
    `USER INVENTORY:\n${inventoryPrompt}`,
    manualItems.length > 0 ? `\nMANUAL INGREDIENTS TO USE: ${manualItems.join(', ')}` : '',
    avoidItems.length > 0 ? `\nINGREDIENTS TO STRICTLY AVOID: ${avoidItems.join(', ')}` : '',
    cuisine ? `\nDESIRED CUISINE: ${cuisine}` : '',
    mealType ? `\nMEAL TYPE: ${mealType}` : '',
    dietaryPreference ? `\nDIETARY PREFERENCE: ${dietaryPreference}` : '',
    numMaxPrep ? `\nMAX PREP TIME: ${numMaxPrep} minutes` : '',
    difficulty ? `\nDIFFICULTY LEVEL: ${difficulty}` : '',
    `\nNUMBER OF SERVINGS: ${numServings}`,
    customNotes ? `\nADDITIONAL USER NOTES: ${customNotes}` : '',
    `\nPlease create the recipe now in pure JSON format.`
  ].filter(Boolean).join('\n');

  const rawAiResponse = await generateGeminiContent({
    contents: promptParts,
    systemInstruction,
    model: env.GEMINI_MODEL,
    temperature: 0.6,
    maxOutputTokens: 2000
  });

  const parsedJson = extractJsonFromText(rawAiResponse);
  const recipe = validateAndNormalizeRecipe(parsedJson, userInventory, manualItems);

  return recipe;
};

/**
 * Modify an existing recipe using AI
 */
export const modifyAiRecipe = async (userId, recipeId, payload = {}) => {
  if (!recipeId) {
    throw new AiRecipeError('Recipe ID is required.', 400);
  }

  const {
    modificationType,
    customRequest,
    targetServings
  } = payload;

  if (!modificationType && !customRequest && !targetServings) {
    throw new AiRecipeError('Please specify how you would like to modify the recipe.', 400);
  }

  // 1. Fetch original recipe with ingredients
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!recipe) {
    throw new AiRecipeError('Recipe not found.', 404);
  }

  // Security & Accessibility check: can access public recipes or owned recipes
  const isAccessible = recipe.isPublic || recipe.userId === userId;
  if (!isAccessible) {
    throw new AiRecipeError('Recipe not found.', 404);
  }

  const isOwner = recipe.userId === userId;
  // Shared seed recipes cannot be overwritten in place
  const canUpdateOriginal = isOwner && !recipe.isPublic;

  // 2. Load user inventory for contextual adaptation
  const userInventory = await prisma.inventoryItem.findMany({
    where: { userId }
  });

  const now = new Date();
  const availableInventoryNames = userInventory
    .filter((i) => !i.expiryDate || new Date(i.expiryDate) >= now)
    .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
    .slice(0, 25);

  const originalRecipeSummary = {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    cuisine: recipe.cuisine,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      isOptional: i.isOptional
    })),
    instructions: recipe.instructions
  };

  const systemInstruction = `You are an expert culinary editor and recipe modifier for Smart Rasoi.
Modify the provided original recipe strictly according to the user's modification request.

RULES:
1. Retain the essence and deliciousness of the dish while applying the requested transformation.
2. If modifying dietary style (e.g. Vegetarian, vegan, gluten-free), replace all conflicting ingredients with suitable, flavorful alternatives.
3. If adapting to current inventory, favor available ingredients where sensible.
4. Output must be raw valid JSON matching the schema below. Include a clear 'changesSummary' detailing each modification made.

TARGET JSON SCHEMA:
{
  "title": "Modified Recipe Title",
  "description": "Updated description",
  "changesSummary": "Specific summary of modifications made to ingredients, instructions, and cooking techniques.",
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": 200,
      "unit": "g",
      "isOptional": false
    }
  ],
  "instructions": [
    "Updated Step 1...",
    "Updated Step 2..."
  ],
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 20,
  "totalTimeMinutes": 35,
  "servings": 4,
  "difficulty": "Easy",
  "category": "Dinner",
  "cuisine": "Indian",
  "dietaryTags": ["Vegetarian"],
  "substitutions": []
}`;

  const modificationPrompt = [
    `ORIGINAL RECIPE:\n${JSON.stringify(originalRecipeSummary, null, 2)}`,
    `\nMODIFICATION TYPE: ${modificationType || 'custom'}`,
    customRequest ? `\nSPECIFIC USER REQUEST: ${customRequest}` : '',
    targetServings ? `\nTARGET SERVINGS: ${targetServings}` : '',
    `\nUSER PANTRY STOCK:\n${availableInventoryNames.join(', ') || 'No inventory listed'}`,
    `\nModify this recipe now and output pure JSON.`
  ].filter(Boolean).join('\n');

  const rawAiResponse = await generateGeminiContent({
    contents: modificationPrompt,
    systemInstruction,
    model: env.GEMINI_MODEL,
    temperature: 0.6,
    maxOutputTokens: 2000
  });

  const parsedJson = extractJsonFromText(rawAiResponse);
  const normalizedModified = validateAndNormalizeRecipe(parsedJson, userInventory);

  return {
    originalRecipe: {
      id: recipe.id,
      title: recipe.title,
      servings: recipe.servings,
      isOwner,
      isPublic: recipe.isPublic,
      canUpdateOriginal
    },
    changesSummary: parsedJson.changesSummary || 'Modified recipe based on your culinary preferences.',
    modifiedRecipe: normalizedModified
  };
};

/**
 * Suggest ingredient substitutions
 */
export const suggestIngredientSubstitutions = async (userId, payload = {}) => {
  const {
    ingredientName,
    recipeId,
    reason,
    dietaryRestrictions
  } = payload;

  if (!ingredientName || typeof ingredientName !== 'string' || !ingredientName.trim()) {
    throw new AiRecipeError('Ingredient name is required.', 400);
  }

  const cleanIngName = ingredientName.trim();

  // 1. Fetch recipe context if recipeId provided
  let recipeContextText = 'General culinary context';
  if (recipeId) {
    const rec = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { ingredients: true }
    });
    if (rec && (rec.isPublic || rec.userId === userId)) {
      recipeContextText = `Recipe "${rec.title}" (${rec.category}, ${rec.cuisine || 'General'}). Ingredients: ${rec.ingredients.map((i) => i.name).join(', ')}`;
    }
  }

  // 2. Fetch user inventory
  const userInventory = await prisma.inventoryItem.findMany({
    where: { userId }
  });

  const now = new Date();
  const availableInventoryMap = new Map();
  for (const item of userInventory) {
    if (item.expiryDate && new Date(item.expiryDate) < now) continue;
    availableInventoryMap.set(normalizeIngredientName(item.name), item);
  }

  const inventorySummary = [...availableInventoryMap.values()]
    .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
    .slice(0, 30)
    .join(', ');

  const systemInstruction = `You are an expert food scientist and culinary advisor for Smart Rasoi.
Provide practical, well-tested ingredient substitution alternatives for home cooking.

RULES:
1. Explain the primary culinary role of the ingredient in this cooking context.
2. Provide 2 to 4 reliable alternatives with exact substitution ratios or conversion guidance.
3. For each substitute, describe the impact on flavor, texture, and cooking time.
4. Highlight any adjustments required in the cooking method.
5. Provide dietary suitability tags (e.g. Vegan, Gluten-Free, Nut-Free).
6. Food Safety & Allergies: Flag any common allergen risks transparently without unsupported medical certainty.
7. Return raw JSON matching the schema below.

TARGET JSON SCHEMA:
{
  "ingredient": "Ingredient to replace",
  "culinaryRole": "Binds ingredients and adds moisture",
  "substitutions": [
    {
      "substitute": "Name of replacement",
      "ratio": "1 egg = 1/4 cup unsweetened applesauce",
      "quantity": "1/4 cup",
      "unit": "cup",
      "tasteAndTextureImpact": "Slight natural sweetness, soft and moist texture",
      "cookingAdjustments": "May require 2-3 extra minutes of baking time",
      "dietarySuitability": "Vegan, Gluten-Free, Dairy-Free",
      "allergyWarnings": "Generally allergen-safe. Verify store-bought applesauce contains no added preservatives."
    }
  ]
}`;

  const prompt = [
    `INGREDIENT TO REPLACE: ${cleanIngName}`,
    `RECIPE CONTEXT: ${recipeContextText}`,
    reason ? `REASON FOR SUBSTITUTION: ${reason}` : '',
    dietaryRestrictions ? `DIETARY RESTRICTIONS: ${dietaryRestrictions}` : '',
    inventorySummary ? `USER PANTRY STOCK:\n${inventorySummary}` : '',
    `\nProvide structured substitution suggestions in pure JSON.`
  ].filter(Boolean).join('\n');

  const rawAiResponse = await generateGeminiContent({
    contents: prompt,
    systemInstruction,
    model: env.GEMINI_MODEL,
    temperature: 0.5,
    maxOutputTokens: 1500
  });

  const parsedJson = extractJsonFromText(rawAiResponse);

  const rawSubs = Array.isArray(parsedJson.substitutions) ? parsedJson.substitutions : [];
  const normalizedSubs = rawSubs.map((s) => {
    const subName = String(s.substitute || '').trim();
    const normSub = normalizeIngredientName(subName);

    // Check if substitute is in inventory
    let inInventory = availableInventoryMap.has(normSub);
    if (!inInventory) {
      for (const [key] of availableInventoryMap) {
        if (normSub.includes(key) || key.includes(normSub)) {
          inInventory = true;
          break;
        }
      }
    }

    return {
      substitute: subName,
      ratio: String(s.ratio || '1:1 ratio').trim(),
      quantity: String(s.quantity || '').trim(),
      unit: String(s.unit || '').trim(),
      inInventory,
      tasteAndTextureImpact: String(s.tasteAndTextureImpact || s.impact || 'Comparable flavor and consistency').trim(),
      cookingAdjustments: String(s.cookingAdjustments || s.instructions || 'Incorporate at the same step as original').trim(),
      dietarySuitability: String(s.dietarySuitability || 'General').trim(),
      allergyWarnings: String(s.allergyWarnings || 'Check labels for potential allergens').trim()
    };
  });

  return {
    ingredient: cleanIngName,
    culinaryRole: parsedJson.culinaryRole || 'Adds flavor and structure to the dish',
    substitutions: normalizedSubs
  };
};

/**
 * Adjust recipe serving size with mathematical precision and culinary non-linear guidance
 */
export const scaleRecipeServings = async (userId, recipeId, payload = {}) => {
  if (!recipeId) {
    throw new AiRecipeError('Recipe ID is required.', 400);
  }

  const { targetServings } = payload;
  if (targetServings === undefined || targetServings === null || isNaN(Number(targetServings))) {
    throw new AiRecipeError('Target servings must be a valid number.', 400);
  }

  const numTargetServings = Number(targetServings);
  if (numTargetServings <= 0 || numTargetServings > 50) {
    throw new AiRecipeError('Target servings must be between 1 and 50.', 400);
  }

  // 1. Fetch recipe with ingredients
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!recipe) {
    throw new AiRecipeError('Recipe not found.', 404);
  }

  const isAccessible = recipe.isPublic || recipe.userId === userId;
  if (!isAccessible) {
    throw new AiRecipeError('Recipe not found.', 404);
  }

  const originalServings = recipe.servings || 2;
  const scaleFactor = numTargetServings / originalServings;

  // List of keywords that typically do not scale linearly (seasonings, salt, hot spices, leavening)
  const nonLinearKeywords = [
    'salt', 'black pepper', 'chili powder', 'cayenne', 'clove', 'cinnamon',
    'nutmeg', 'cardamom', 'baking powder', 'baking soda', 'yeast', 'hot sauce'
  ];

  const scaledIngredients = recipe.ingredients.map((ing) => {
    const norm = normalizeIngredientName(ing.name);
    const isNonLinear = nonLinearKeywords.some((kw) => norm.includes(kw));

    let scaledQty;
    let scalingNote = null;

    if (isNonLinear) {
      if (scaleFactor > 1) {
        // Conservative scale for spices and salt (e.g. sqrt-based dampening or 1.5x)
        const conservativeFactor = 1 + (scaleFactor - 1) * 0.7;
        scaledQty = Number((ing.quantity * conservativeFactor).toFixed(2));
        scalingNote = `Adjust to taste. For ${numTargetServings} servings, start with ${scaledQty} ${ing.unit} rather than linear doubling.`;
      } else {
        scaledQty = Number((ing.quantity * scaleFactor).toFixed(2));
        scalingNote = 'Season lightly and adjust to taste.';
      }
    } else {
      scaledQty = Number((ing.quantity * scaleFactor).toFixed(2));
    }

    return {
      id: ing.id,
      name: ing.name,
      originalQuantity: ing.quantity,
      scaledQuantity: scaledQty,
      unit: ing.unit,
      isOptional: ing.isOptional,
      isNonLinear,
      scalingNote
    };
  });

  // Calculate estimated cook time adjustment
  let cookingTimeAdvisory = 'Standard cooking time applies.';
  let estimatedCookTime = recipe.cookTimeMinutes;
  if (scaleFactor >= 2) {
    estimatedCookTime = Math.round(recipe.cookTimeMinutes * 1.2);
    cookingTimeAdvisory = `Larger batch: liquid reduction and heat penetration may take approximately 20% longer (~${estimatedCookTime} mins).`;
  } else if (scaleFactor <= 0.5) {
    estimatedCookTime = Math.max(5, Math.round(recipe.cookTimeMinutes * 0.85));
    cookingTimeAdvisory = `Smaller batch: liquids evaporate faster. Monitor heat closely (~${estimatedCookTime} mins).`;
  }

  return {
    recipeId: recipe.id,
    title: recipe.title,
    originalServings,
    targetServings: numTargetServings,
    scaleFactor: Number(scaleFactor.toFixed(2)),
    prepTimeMinutes: recipe.prepTimeMinutes,
    originalCookTimeMinutes: recipe.cookTimeMinutes,
    estimatedCookTimeMinutes: estimatedCookTime,
    cookingTimeAdvisory,
    scaledIngredients,
    instructions: recipe.instructions
  };
};
