import test, { describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';
import {
  setMockGeminiClient,
  resetMockGeminiClient,
  GeminiRateLimitError,
  GeminiTimeoutError,
  GeminiConfigError
} from '../services/geminiService.js';
import { resetAiRateLimiter } from '../middleware/aiRateLimiter.js';
import { seedSharedRecipes } from '../scripts/seedRecipes.js';

describe('Smart Rasoi Phase 6 - AI Recipe Generation, Modification & Substitution Test Suite', () => {
  const userAData = {
    name: 'Chef Maya Phase 6 A',
    email: 'maya.ai6.a@ai6.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const userBData = {
    name: 'Chef Kabir Phase 6 B',
    email: 'kabir.ai6.b@ai6.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  let cookieA = null;
  let userAId = null;
  let cookieB = null;
  let userBId = null;
  let userARecipeId = null;
  let userBPrivateRecipeId = null;
  let sharedRecipeId = null;

  before(async () => {
    // 1. Clean up test users and associated data
    await prisma.favourite.deleteMany({
      where: { user: { email: { contains: 'ai6.test' } } }
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipe: { user: { email: { contains: 'ai6.test' } } } }
    });
    await prisma.recipe.deleteMany({
      where: { user: { email: { contains: 'ai6.test' } } }
    });
    await prisma.inventoryItem.deleteMany({
      where: { user: { email: { contains: 'ai6.test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'ai6.test' } }
    });

    // Seed shared recipes
    await seedSharedRecipes();
    const shared = await prisma.recipe.findFirst({
      where: { userId: null, isPublic: true }
    });
    assert.ok(shared, 'Shared recipe should exist');
    sharedRecipeId = shared.id;

    // 2. Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send(userAData);
    assert.equal(resA.status, 201);
    cookieA = resA.headers['set-cookie'][0];
    userAId = resA.body.data.user.id;

    // 3. Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send(userBData);
    assert.equal(resB.status, 201);
    cookieB = resB.headers['set-cookie'][0];
    userBId = resB.body.data.user.id;

    // 4. Seed User A Inventory
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.inventoryItem.create({
      data: {
        name: 'Organic Spinach',
        category: 'Vegetables',
        quantity: 300,
        unit: 'g',
        minimumQuantity: 100,
        expiryDate: tomorrow, // Expiring soon
        userId: userAId
      }
    });

    await prisma.inventoryItem.create({
      data: {
        name: 'Fresh Paneer',
        category: 'Dairy',
        quantity: 250,
        unit: 'g',
        minimumQuantity: 100,
        expiryDate: nextMonth,
        userId: userAId
      }
    });

    // 5. Create a user-owned recipe for User A
    const recA = await prisma.recipe.create({
      data: {
        title: 'Maya Homemade Palak Paneer',
        instructions: '1. Blanch spinach.\n2. Saute paneer.\n3. Simmer and serve.',
        category: 'Dinner',
        cuisine: 'Indian',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 2,
        difficulty: 'Easy',
        isPublic: false,
        userId: userAId,
        ingredients: {
          create: [
            { name: 'Organic Spinach', quantity: 250, unit: 'g', isOptional: false },
            { name: 'Fresh Paneer', quantity: 200, unit: 'g', isOptional: false },
            { name: 'Garam Masala', quantity: 1, unit: 'tsp', isOptional: false },
            { name: 'Salt', quantity: 1, unit: 'tsp', isOptional: false }
          ]
        }
      }
    });
    userARecipeId = recA.id;

    // 6. Create User B Private Recipe
    const recB = await prisma.recipe.create({
      data: {
        title: 'Kabir Secret Chicken Curry',
        instructions: '1. Cook chicken with secret spices.',
        category: 'Dinner',
        cuisine: 'Indian',
        prepTimeMinutes: 20,
        cookTimeMinutes: 30,
        servings: 4,
        difficulty: 'Medium',
        isPublic: false,
        userId: userBId,
        ingredients: {
          create: [
            { name: 'Chicken Breast', quantity: 500, unit: 'g', isOptional: false }
          ]
        }
      }
    });
    userBPrivateRecipeId = recB.id;
  });

  after(async () => {
    resetMockGeminiClient();
    resetAiRateLimiter();

    await prisma.favourite.deleteMany({
      where: { user: { email: { contains: 'ai6.test' } } }
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipe: { user: { email: { contains: 'ai6.test' } } } }
    });
    await prisma.recipe.deleteMany({
      where: { user: { email: { contains: 'ai6.test' } } }
    });
    await prisma.inventoryItem.deleteMany({
      where: { user: { email: { contains: 'ai6.test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'ai6.test' } }
    });
  });

  beforeEach(() => {
    resetMockGeminiClient();
    resetAiRateLimiter();
  });

  // ==========================================
  // 1. FEATURE A: AI RECIPE GENERATION TESTS
  // ==========================================

  test('1. Valid recipe generation returns structured recipe with inventory awareness', async () => {
    const mockGeminiRecipe = {
      title: 'Creamy Spinach Paneer Delight',
      description: 'A comforting curry combining fresh paneer and organic spinach.',
      ingredients: [
        { name: 'Organic Spinach', quantity: 250, unit: 'g', isOptional: false },
        { name: 'Fresh Paneer', quantity: 200, unit: 'g', isOptional: false },
        { name: 'Cooking Cream', quantity: 50, unit: 'ml', isOptional: true }
      ],
      instructions: [
        'Blanch organic spinach for 2 minutes and puree.',
        'Pan-fry paneer cubes until golden.',
        'Simmer puree with spices and fold in paneer.'
      ],
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      totalTimeMinutes: 25,
      servings: 2,
      difficulty: 'Easy',
      category: 'Dinner',
      cuisine: 'Indian',
      dietaryTags: ['Vegetarian', 'Gluten-Free'],
      substitutions: [
        { ingredient: 'Cooking Cream', substitute: 'Greek yogurt', note: 'Provides tangy creaminess' }
      ],
      explanation: 'Utilizes your Organic Spinach that is expiring tomorrow.'
    };

    setMockGeminiClient(async () => JSON.stringify(mockGeminiRecipe));

    const res = await request(app)
      .post('/api/ai/recipes/generate')
      .set('Cookie', cookieA)
      .send({
        cuisine: 'Indian',
        mealType: 'Dinner',
        servings: 2
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.recipe);
    assert.equal(res.body.recipe.title, 'Creamy Spinach Paneer Delight');

    // Verify inventory-aware classification
    const spinach = res.body.recipe.ingredients.find((i) => i.name.toLowerCase().includes('spinach'));
    assert.ok(spinach);
    assert.equal(spinach.inventoryStatus, 'available', 'Spinach in inventory must be marked available');

    const cream = res.body.recipe.ingredients.find((i) => i.name.toLowerCase().includes('cream'));
    assert.ok(cream);
    assert.equal(cream.inventoryStatus, 'missing', 'Cream not in inventory must be marked missing');

    assert.ok(res.body.recipe.inventoryUsage.some((i) => i.toLowerCase().includes('spinach')));
  });

  test('2. Malformed Gemini output is handled safely and returns 502', async () => {
    setMockGeminiClient(async () => 'This is definitely not a JSON object at all.');

    const res = await request(app)
      .post('/api/ai/recipes/generate')
      .set('Cookie', cookieA)
      .send({ cuisine: 'Italian' });

    assert.equal(res.status, 502);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /parse structured recipe/i);
  });

  test('3. Provider timeout is handled safely without leaking credentials', async () => {
    setMockGeminiClient(async () => {
      throw new GeminiTimeoutError();
    });

    const res = await request(app)
      .post('/api/ai/recipes/generate')
      .set('Cookie', cookieA)
      .send({ cuisine: 'Italian' });

    assert.equal(res.status, 504);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /timed out/i);
  });

  test('4. Missing API key produces safe 503 error', async () => {
    setMockGeminiClient(async () => {
      throw new GeminiConfigError();
    });

    const res = await request(app)
      .post('/api/ai/recipes/generate')
      .set('Cookie', cookieA)
      .send({ cuisine: 'Indian' });

    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not configured/i);
  });

  // ==========================================
  // 2. FEATURE B: RECIPE MODIFICATION TESTS
  // ==========================================

  test('5. Successful recipe modification returns modified recipe and changes summary', async () => {
    const mockModifiedRecipe = {
      title: 'High-Protein Palak Paneer with Tofu & Chickpeas',
      description: 'A protein-boosted variation of your homemade palak paneer.',
      changesSummary: 'Added boiled chickpeas and roasted tofu alongside paneer to increase protein content by 18g per serving.',
      ingredients: [
        { name: 'Organic Spinach', quantity: 250, unit: 'g', isOptional: false },
        { name: 'Fresh Paneer', quantity: 150, unit: 'g', isOptional: false },
        { name: 'Firm Tofu', quantity: 150, unit: 'g', isOptional: false },
        { name: 'Boiled Chickpeas', quantity: 100, unit: 'g', isOptional: true }
      ],
      instructions: [
        'Blanch and puree spinach.',
        'Saute paneer and firm tofu cubes until crisp.',
        'Combine in spiced spinach gravy with chickpeas.'
      ],
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      servings: 2,
      difficulty: 'Easy',
      category: 'Dinner',
      cuisine: 'Indian',
      dietaryTags: ['Vegetarian', 'High-Protein']
    };

    setMockGeminiClient(async () => JSON.stringify(mockModifiedRecipe));

    const res = await request(app)
      .post(`/api/ai/recipes/${userARecipeId}/modify`)
      .set('Cookie', cookieA)
      .send({
        modificationType: 'high-protein',
        customRequest: 'Add extra plant protein sources'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.modifiedRecipe);
    assert.match(res.body.changesSummary, /chickpeas|protein/i);
    assert.equal(res.body.originalRecipe.id, userARecipeId);
    assert.equal(res.body.originalRecipe.canUpdateOriginal, true, 'User owns recipe, so canUpdateOriginal is true');

    // Verify modification was NOT automatically persisted in the database!
    const dbRecipe = await prisma.recipe.findUnique({
      where: { id: userARecipeId }
    });
    assert.equal(dbRecipe.title, 'Maya Homemade Palak Paneer', 'Original recipe must NOT be modified in DB without explicit user save');
  });

  test('6. User cannot modify another user\'s private recipe (returns 404)', async () => {
    const res = await request(app)
      .post(`/api/ai/recipes/${userBPrivateRecipeId}/modify`)
      .set('Cookie', cookieA)
      .send({ modificationType: 'vegetarian' });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not found/i);
  });

  test('7. Shared seed recipes can be modified, but canUpdateOriginal is false', async () => {
    const mockModifiedShared = {
      title: 'Vegetarian Masala Khichdi (Mild Kids Version)',
      description: 'A gentler version of classical khichdi for children.',
      changesSummary: 'Omitted green chilies and reduced black pepper for mild palate.',
      ingredients: [
        { name: 'Moong Dal', quantity: 0.5, unit: 'cup', isOptional: false },
        { name: 'Basmati Rice', quantity: 0.5, unit: 'cup', isOptional: false }
      ],
      instructions: ['Cook together with mild turmeric and ghee.'],
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      servings: 2,
      difficulty: 'Easy'
    };

    setMockGeminiClient(async () => JSON.stringify(mockModifiedShared));

    const res = await request(app)
      .post(`/api/ai/recipes/${sharedRecipeId}/modify`)
      .set('Cookie', cookieA)
      .send({ modificationType: 'less-spicy' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.originalRecipe.isPublic, true);
    assert.equal(res.body.originalRecipe.canUpdateOriginal, false, 'Shared recipes must never be updated in place');
  });

  test('8. Non-existent recipe ID returns 404', async () => {
    const res = await request(app)
      .post('/api/ai/recipes/non-existent-id/modify')
      .set('Cookie', cookieA)
      .send({ modificationType: 'vegetarian' });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  // ==========================================
  // 3. FEATURE C: INGREDIENT SUBSTITUTION TESTS
  // ==========================================

  test('9. Valid substitution suggestions returned with trade-offs and ratios', async () => {
    const mockSubstitutions = {
      ingredient: 'Buttermilk',
      culinaryRole: 'Adds acidity for leavening and tenderizing protein',
      substitutions: [
        {
          substitute: 'Milk and Lemon Juice',
          ratio: '1 cup milk + 1 tbsp lemon juice = 1 cup buttermilk',
          quantity: '1 cup',
          tasteAndTextureImpact: 'Near-identical acidity and moisture',
          cookingAdjustments: 'Let rest 5 mins to curdle before mixing',
          dietarySuitability: 'Vegetarian, Gluten-Free',
          allergyWarnings: 'Contains Dairy'
        },
        {
          substitute: 'Plain Yogurt and Water',
          ratio: '3/4 cup plain yogurt + 1/4 cup water = 1 cup buttermilk',
          quantity: '1 cup',
          tasteAndTextureImpact: 'Slightly thicker body with rich tang',
          cookingAdjustments: 'Whisk well until smooth',
          dietarySuitability: 'Vegetarian, Gluten-Free',
          allergyWarnings: 'Contains Dairy'
        }
      ]
    };

    setMockGeminiClient(async () => JSON.stringify(mockSubstitutions));

    const res = await request(app)
      .post('/api/ai/substitutions')
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Buttermilk',
        reason: 'Out of stock'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.ingredient, 'Buttermilk');
    assert.ok(Array.isArray(res.body.substitutions));
    assert.ok(res.body.substitutions.length >= 2);
    assert.equal(res.body.substitutions[0].substitute, 'Milk and Lemon Juice');
    assert.ok(res.body.substitutions[0].ratio);
  });

  test('10. Missing ingredient name in substitution request is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/ai/substitutions')
      .set('Cookie', cookieA)
      .send({ reason: 'Allergy' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /ingredient name is required/i);
  });

  // ==========================================
  // 4. FEATURE D: SERVING ADJUSTER TESTS
  // ==========================================

  test('11. Recipe scaling computes proportional quantities and non-linear guidance', async () => {
    const res = await request(app)
      .post(`/api/ai/recipes/${userARecipeId}/scale`)
      .set('Cookie', cookieA)
      .send({ targetServings: 4 }); // 2 -> 4 (scale factor 2)

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const scaled = res.body.scaledRecipe;
    assert.equal(scaled.originalServings, 2);
    assert.equal(scaled.targetServings, 4);
    assert.equal(scaled.scaleFactor, 2);

    // Spinach: original 250g -> 500g
    const spinach = scaled.scaledIngredients.find((i) => i.name === 'Organic Spinach');
    assert.ok(spinach);
    assert.equal(spinach.scaledQuantity, 500);
    assert.equal(spinach.isNonLinear, false);

    // Paneer: original 200g -> 400g
    const paneer = scaled.scaledIngredients.find((i) => i.name === 'Fresh Paneer');
    assert.ok(paneer);
    assert.equal(paneer.scaledQuantity, 400);

    // Salt: flagged as non-linear with conservative advice
    const salt = scaled.scaledIngredients.find((i) => i.name === 'Salt');
    assert.ok(salt);
    assert.equal(salt.isNonLinear, true);
    assert.ok(salt.scalingNote);

    // Database check: original recipe remains untouched in SQLite!
    const dbRecipe = await prisma.recipe.findUnique({
      where: { id: userARecipeId }
    });
    assert.equal(dbRecipe.servings, 2);
  });

  test('12. Invalid target servings (< 1 or non-numeric) is rejected with 400', async () => {
    const res1 = await request(app)
      .post(`/api/ai/recipes/${userARecipeId}/scale`)
      .set('Cookie', cookieA)
      .send({ targetServings: 0 });
    assert.equal(res1.status, 400);

    const res2 = await request(app)
      .post(`/api/ai/recipes/${userARecipeId}/scale`)
      .set('Cookie', cookieA)
      .send({ targetServings: -2 });
    assert.equal(res2.status, 400);

    const res3 = await request(app)
      .post(`/api/ai/recipes/${userARecipeId}/scale`)
      .set('Cookie', cookieA)
      .send({ targetServings: 'invalid' });
    assert.equal(res3.status, 400);
  });

  // ==========================================
  // 5. SAVING GENERATED RECIPES & INTEGRITY
  // ==========================================

  test('13. User can save a generated recipe via existing POST /api/recipes without inventory deduction', async () => {
    // Record initial inventory quantities
    const initialSpinach = await prisma.inventoryItem.findFirst({
      where: { userId: userAId, name: 'Organic Spinach' }
    });
    const initialQty = initialSpinach.quantity;

    const recipeToSave = {
      title: 'AI Savory Spinach & Paneer Skillet',
      description: 'Quick skillet meal crafted by AI.',
      instructions: '1. Saute spinach with spices.\n2. Add paneer cubes.\n3. Serve hot.',
      category: 'Dinner',
      cuisine: 'Indian',
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      servings: 2,
      difficulty: 'Easy',
      ingredients: [
        { name: 'Organic Spinach', quantity: 200, unit: 'g', isOptional: false },
        { name: 'Fresh Paneer', quantity: 150, unit: 'g', isOptional: false }
      ]
    };

    const res = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send(recipeToSave);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.recipe.title, 'AI Savory Spinach & Paneer Skillet');
    assert.equal(res.body.data.recipe.userId, userAId);
    assert.equal(res.body.data.recipe.isOwner, true);

    // Verify inventory quantities remained UNCHANGED (no automatic deduction in Phase 6)
    const afterSpinach = await prisma.inventoryItem.findFirst({
      where: { userId: userAId, name: 'Organic Spinach' }
    });
    assert.equal(afterSpinach.quantity, initialQty, 'Inventory quantity must not be deducted when saving recipes in Phase 6');
  });
});
