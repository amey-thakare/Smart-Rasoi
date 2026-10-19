/**
 * Smart Rasoi - Phase 9 Nutrition Analysis, Dietary Tracking & Meal History Test Suite
 */

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';
import { setMockGeminiClient, resetMockGeminiClient } from '../services/geminiService.js';
import { calculateRecipeNutrition } from '../services/nutritionCalculatorService.js';

describe('Smart Rasoi Phase 9 - Nutrition Analysis, Dietary Tracking & Meal History', () => {
  let userACookies;
  let userAId;
  let userBCookies;
  let userBId;
  let sharedRecipeId;
  let userARecipeId;

  const userA = {
    name: 'Ananya Sharma',
    email: `ananya.nutrition.${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const userB = {
    name: 'Kabir Verma',
    email: `kabir.nutrition.${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  before(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send(userA);
    assert.equal(resA.status, 201);
    userACookies = resA.headers['set-cookie'];
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send(userB);
    assert.equal(resB.status, 201);
    userBCookies = resB.headers['set-cookie'];
    userBId = resB.body.data.user.id;

    // Create a private recipe for User A with standard ingredients
    const recipeRes = await request(app)
      .post('/api/recipes')
      .set('Cookie', userACookies)
      .send({
        title: 'Nutritious Moong Dal Khichdi',
        category: 'Lunch',
        cuisine: 'Indian',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 2,
        difficulty: 'Easy',
        instructions: 'Cook rice and dal with turmeric and cumin seeds.',
        ingredients: [
          { name: 'Basmati Rice', quantity: 100, unit: 'g', isOptional: false },
          { name: 'Moong Dal', quantity: 100, unit: 'g', isOptional: false },
          { name: 'Ghee', quantity: 15, unit: 'g', isOptional: false },
          { name: 'Turmeric Powder', quantity: 5, unit: 'g', isOptional: false },
          { name: 'Cumin Seeds', quantity: 5, unit: 'g', isOptional: false }
        ]
      });

    assert.equal(recipeRes.status, 201);
    userARecipeId = recipeRes.body.data.recipe.id;

    // Fetch any shared seed recipe for public tests
    const seedRecipe = await prisma.recipe.findFirst({
      where: { isPublic: true },
      include: { ingredients: true }
    });
    if (seedRecipe) {
      sharedRecipeId = seedRecipe.id;
    }
  });

  after(() => {
    resetMockGeminiClient();
  });

  // --------------------------------------------------------------------------
  // 1. DETERMINISTIC NUTRITION CALCULATOR UNIT TESTS
  // --------------------------------------------------------------------------
  test('1. Deterministic nutrition calculation accurately computes macros and per-serving values', () => {
    const mockRecipe = {
      title: 'High Protein Paneer Bowl',
      servings: 2,
      ingredients: [
        { name: 'Paneer', quantity: 200, unit: 'g' }, // 200g Paneer: ~530 kcal, ~36.6g prot
        { name: 'Basmati Rice', quantity: 100, unit: 'g' }, // 100g Rice: ~365 kcal, ~7.1g prot
        { name: 'Tomatoes', quantity: 1, unit: 'pcs' } // 1 piece (~90g): ~16 kcal
      ]
    };

    const res = calculateRecipeNutrition(mockRecipe);

    assert.equal(res.servings, 2);
    assert.equal(res.completenessScore, 100);
    assert.equal(res.source, 'CALCULATED');
    assert.equal(res.missingIngredients.length, 0);

    // Total calories should be approximately 530 + 365 + 16 = ~911 kcal
    assert.ok(res.totalRecipe.calories > 850 && res.totalRecipe.calories < 980);
    // Per serving calories = total / 2 = ~450 kcal
    assert.ok(res.perServing.calories > 420 && res.perServing.calories < 490);
    // Protein should be around (36.6 + 7.1 + 0.8) / 2 = ~22g per serving
    assert.ok(res.perServing.proteinGrams > 18 && res.perServing.proteinGrams < 26);

    // Custom serving scale test: 4 servings should double the total
    const customRes = calculateRecipeNutrition(mockRecipe, 4);
    assert.equal(customRes.customServings, 4);
    assert.equal(customRes.customEstimate.calories, Number((res.perServing.calories * 4).toFixed(1)));
  });

  test('2. Missing ingredients or inconvertible units are honestly reported as incomplete', () => {
    const incompleteRecipe = {
      title: 'Exotic Herbal Infusion',
      servings: 1,
      ingredients: [
        { name: 'Basmati Rice', quantity: 50, unit: 'g' }, // Known
        { name: 'Extraterrestrial Glow Moss', quantity: 20, unit: 'g' }, // Unknown
        { name: 'Onions', quantity: 2, unit: 'baskets' } // Inconvertible unit
      ]
    };

    const res = calculateRecipeNutrition(incompleteRecipe);

    assert.ok(res.completenessScore < 100);
    assert.equal(res.source, 'INCOMPLETE');
    assert.equal(res.missingIngredients.length, 2);
    // The known ingredient must still contribute without claiming 100% lab accuracy
    assert.ok(res.perServing.calories > 0);
  });

  // --------------------------------------------------------------------------
  // 2. RECIPE NUTRITION API ENDPOINTS
  // --------------------------------------------------------------------------
  test('3. GET /api/nutrition/recipes/:id calculates and caches nutritional estimates', async () => {
    const res = await request(app)
      .get(`/api/nutrition/recipes/${userARecipeId}`)
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.recipeId, userARecipeId);
    assert.ok(res.body.data.perServing.calories > 0);
    assert.ok(res.body.data.perServing.proteinGrams > 0);
    assert.equal(res.body.data.isEstimated, true);
    assert.ok(res.body.data.disclaimer.includes('Nutritional estimates'));

    // Test custom servings parameter
    const resCustom = await request(app)
      .get(`/api/nutrition/recipes/${userARecipeId}?servings=4`)
      .set('Cookie', userACookies);

    assert.equal(resCustom.status, 200);
    assert.equal(resCustom.body.data.customServings, 4);
    assert.equal(
      resCustom.body.data.customEstimate.calories,
      Number((res.body.data.perServing.calories * 4).toFixed(1))
    );
  });

  test('4. POST /api/nutrition/recipes/:id/calculate forces recalculation and updates cache', async () => {
    const res = await request(app)
      .post(`/api/nutrition/recipes/${userARecipeId}/calculate`)
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.savedRecord);
    assert.equal(res.body.data.savedRecord.recipeId, userARecipeId);
  });

  // --------------------------------------------------------------------------
  // 3. DIETARY PROFILE & TARGET GOALS
  // --------------------------------------------------------------------------
  test('5. GET /api/nutrition/profile returns user profile with default empty settings', async () => {
    const res = await request(app)
      .get('/api/nutrition/profile')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.userId, userAId);
    assert.equal(res.body.data.dietaryPreference, 'NONE');
    assert.equal(res.body.data.dailyCalorieTarget, null);
  });

  test('6. PATCH /api/nutrition/profile validates and updates targets and preferences', async () => {
    // Valid update
    const res = await request(app)
      .patch('/api/nutrition/profile')
      .set('Cookie', userACookies)
      .send({
        dietaryPreference: 'VEGETARIAN',
        dailyCalorieTarget: 2100,
        proteinTarget: 75,
        carbohydrateTarget: 250,
        fatTarget: 60,
        fiberTarget: 30,
        allergies: ['Peanuts', 'Shellfish'],
        dislikedIngredients: ['Bitter Gourd']
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.dietaryPreference, 'VEGETARIAN');
    assert.equal(res.body.data.dailyCalorieTarget, 2100);
    assert.equal(res.body.data.proteinTarget, 75);
    assert.deepEqual(res.body.data.allergiesList, ['Peanuts', 'Shellfish']);

    // Negative target rejection
    const invalidRes = await request(app)
      .patch('/api/nutrition/profile')
      .set('Cookie', userACookies)
      .send({
        dailyCalorieTarget: -500
      });

    assert.equal(invalidRes.status, 400);

    // Invalid dietary preference rejection
    const invalidPref = await request(app)
      .patch('/api/nutrition/profile')
      .set('Cookie', userACookies)
      .send({
        dietaryPreference: 'CARNIVORE_SUPER_DIET'
      });

    assert.equal(invalidPref.status, 400);
  });

  // --------------------------------------------------------------------------
  // 4. MEAL CONSUMPTION LEDGER & LIFECYCLE
  // --------------------------------------------------------------------------
  test('7. POST /api/nutrition/consumption logs a consumed meal and preserves nutritional snapshot', async () => {
    const logRes = await request(app)
      .post('/api/nutrition/consumption')
      .set('Cookie', userACookies)
      .send({
        recipeId: userARecipeId,
        mealType: 'Lunch',
        servingsConsumed: 1.5,
        notes: 'Delicious post-workout lunch'
      });

    assert.equal(logRes.status, 201);
    assert.equal(logRes.body.success, true);
    const meal = logRes.body.data;
    assert.equal(meal.recipeTitle, 'Nutritious Moong Dal Khichdi');
    assert.equal(meal.servingsConsumed, 1.5);
    assert.ok(meal.calories > 0);
    assert.ok(meal.proteinGrams > 0);
    assert.equal(meal.isReversed, false);

    // User B cannot access User A's logged meal (IDOR protection)
    const updateB = await request(app)
      .patch(`/api/nutrition/consumption/${meal.id}`)
      .set('Cookie', userBCookies)
      .send({ servingsConsumed: 2 });
    assert.equal(updateB.status, 404);

    // User A updates servings consumed -> scaled proportionally
    const updateA = await request(app)
      .patch(`/api/nutrition/consumption/${meal.id}`)
      .set('Cookie', userACookies)
      .send({ servingsConsumed: 3.0 });
    assert.equal(updateA.status, 200);
    assert.equal(updateA.body.data.servingsConsumed, 3.0);
    assert.ok(updateA.body.data.calories > meal.calories);
  });

  test('8. Cooking a planned meal automatically records consumption; reversing cooking marks it reversed', async () => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Create a planned meal for User A
    const planRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', userACookies)
      .send({
        recipeId: userARecipeId,
        scheduledDate: today,
        mealType: 'Dinner',
        servings: 2
      });

    assert.equal(planRes.status, 201);
    const mealPlanId = (planRes.body.mealPlan || planRes.body.data?.mealPlan)?.id;

    // 2. Planned meals must NOT count as consumed
    const dailyBefore = await request(app)
      .get(`/api/nutrition/daily?date=${today}`)
      .set('Cookie', userACookies);
    const plannedInConsumption = (dailyBefore.body.data.meals || []).some(
      (m) => m.mealPlanId === mealPlanId
    );
    assert.equal(plannedInConsumption, false);

    // 3. Mark meal as COOKED (with allowPartial: true to bypass stock deduction in test)
    const cookRes = await request(app)
      .post(`/api/meal-plans/${mealPlanId}/cook`)
      .set('Cookie', userACookies)
      .send({ allowPartial: true });

    assert.equal(cookRes.status, 200);

    // 4. Cooked meal must now appear in consumption history
    const dailyAfterCook = await request(app)
      .get(`/api/nutrition/daily?date=${today}`)
      .set('Cookie', userACookies);
    const cookedInConsumption = (dailyAfterCook.body.data.meals || []).find(
      (m) => m.mealPlanId === mealPlanId
    );
    assert.ok(cookedInConsumption);
    assert.equal(cookedInConsumption.source, 'COOKED_MEAL');
    assert.equal(cookedInConsumption.servingsConsumed, 2);

    // 5. Reverse consumption on the meal plan -> consumption record must be reversed
    const reverseRes = await request(app)
      .post(`/api/meal-plans/${mealPlanId}/reverse-consumption`)
      .set('Cookie', userACookies);
    assert.equal(reverseRes.status, 200);

    const dailyAfterReverse = await request(app)
      .get(`/api/nutrition/daily?date=${today}`)
      .set('Cookie', userACookies);
    const reversedInConsumption = (dailyAfterReverse.body.data.meals || []).some(
      (m) => m.mealPlanId === mealPlanId
    );
    assert.equal(reversedInConsumption, false);
  });

  // --------------------------------------------------------------------------
  // 5. DAILY AND WEEKLY AGGREGATIONS
  // --------------------------------------------------------------------------
  test('9. GET /api/nutrition/daily calculates totals and compares against configured targets', async () => {
    const today = new Date().toISOString().split('T')[0];

    const res = await request(app)
      .get(`/api/nutrition/daily?date=${today}`)
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.date, today);
    assert.ok(typeof res.body.data.totals.calories === 'number');
    assert.ok(typeof res.body.data.totals.proteinGrams === 'number');
    assert.ok(res.body.data.targetsComparison.calories);
    assert.equal(res.body.data.targetsComparison.calories.target, 2100);
  });

  test('10. GET /api/nutrition/weekly averages only across days with recorded consumption', async () => {
    const res = await request(app)
      .get('/api/nutrition/weekly')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.days.length, 7);
    assert.ok(res.body.data.activeDaysCount >= 1);
    assert.ok(res.body.data.averages.calories >= 0);
  });

  test('11. GET /api/nutrition/history returns paginated meal history with search', async () => {
    const res = await request(app)
      .get('/api/nutrition/history?limit=10')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.items));
    assert.ok(res.body.data.pagination);

    // Search filter test
    const searchRes = await request(app)
      .get('/api/nutrition/history?search=Khichdi')
      .set('Cookie', userACookies);
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.body.data.items.length >= 1);
  });

  // --------------------------------------------------------------------------
  // 6. DASHBOARD INTEGRATION & AI ASSISTANT
  // --------------------------------------------------------------------------
  test('12. GET /api/nutrition/dashboard-summary returns live daily metrics for the dashboard', async () => {
    const res = await request(app)
      .get('/api/nutrition/dashboard-summary')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.date);
    assert.ok(typeof res.body.data.caloriesToday === 'number');
    assert.ok(typeof res.body.data.proteinToday === 'number');
    assert.equal(res.body.data.calorieTarget, 2100);
  });

  test('13. POST /api/nutrition/assistant calls Gemini with authentic context or uses fallback', async () => {
    // Set a mock Gemini client
    setMockGeminiClient(async ({ contents, systemInstruction }) => {
      assert.ok(systemInstruction.includes('AI Nutritionist'));
      assert.ok(contents.includes('protein'));
      return 'Based on your recorded intake of 75g protein today, you have successfully met your daily target of 75g!';
    });

    const res = await request(app)
      .post('/api/nutrition/assistant')
      .set('Cookie', userACookies)
      .send({ query: 'Summarise my protein intake today.' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.answer.includes('75g protein'));

    // Test fallback when Gemini throws
    setMockGeminiClient(async () => {
      throw new Error('API Rate limit simulated');
    });

    const fallbackRes = await request(app)
      .post('/api/nutrition/assistant')
      .set('Cookie', userACookies)
      .send({ query: 'How many calories did I eat today?' });

    assert.equal(fallbackRes.status, 200);
    assert.equal(fallbackRes.body.data.isFallback, true);
    assert.ok(fallbackRes.body.data.answer.includes('Nutrition Summary'));
  });

  // --------------------------------------------------------------------------
  // 7. AUTHENTICATION & IDOR GUARDS
  // --------------------------------------------------------------------------
  test('14. Unauthenticated requests are rejected across all nutrition endpoints', async () => {
    const endpoints = [
      { method: 'get', path: '/api/nutrition/profile' },
      { method: 'patch', path: '/api/nutrition/profile' },
      { method: 'get', path: `/api/nutrition/recipes/${userARecipeId}` },
      { method: 'get', path: '/api/nutrition/daily' },
      { method: 'get', path: '/api/nutrition/weekly' },
      { method: 'get', path: '/api/nutrition/history' },
      { method: 'post', path: '/api/nutrition/consumption' },
      { method: 'post', path: '/api/nutrition/assistant' }
    ];

    for (const ep of endpoints) {
      const res = await request(app)[ep.method](ep.path);
      assert.equal(res.status, 401, `Expected 401 for ${ep.method.toUpperCase()} ${ep.path}`);
    }
  });
});
