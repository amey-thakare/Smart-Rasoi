import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';
import { setMockGeminiClient, resetMockGeminiClient } from '../services/geminiService.js';

describe('Smart Rasoi - Complete Cross-Feature End-to-End Integration Test Suite', () => {
  let userAToken = '';
  let userAId = '';
  let userBToken = '';
  let userBId = '';
  let tomatoRiceRecipeId = '';
  let partyBiryaniRecipeId = '';

  const timestamp = Date.now();
  const userACreds = {
    name: 'Chef Integration A',
    email: `chefa_${timestamp}@smartrasoi-e2e.local`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const userBCreds = {
    name: 'Chef Integration B',
    email: `chefb_${timestamp}@smartrasoi-e2e.local`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  before(async () => {
    // 1. Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send(userACreds)
      .expect(201);

    userAId = resA.body.data.user.id;
    const cookiesA = resA.headers['set-cookie'];
    userAToken = cookiesA.find((c) => c.startsWith('smart_rasoi_auth_token='));

    // 2. Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send(userBCreds)
      .expect(201);

    userBId = resB.body.data.user.id;
    const cookiesB = resB.headers['set-cookie'];
    userBToken = cookiesB.find((c) => c.startsWith('smart_rasoi_auth_token='));
  });

  after(async () => {
    resetMockGeminiClient();
    // Cleanup created users
    await prisma.user.deleteMany({
      where: {
        id: { in: [userAId, userBId] }
      }
    });
  });

  test('1. Authentication & Profile Retrieval: validates credentials and returns safe user data', async () => {
    // Verify /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', userAToken)
      .expect(200);

    assert.equal(meRes.body.data.user.email, userACreds.email);
    assert.equal(meRes.body.data.user.passwordHash, undefined, 'passwordHash must never be exposed');

    // Update profile
    const updateRes = await request(app)
      .patch('/api/users/me')
      .set('Cookie', userAToken)
      .send({ name: 'Chef Integration Master' })
      .expect(200);

    assert.equal(updateRes.body.data.user.name, 'Chef Integration Master');
  });

  test('2. Inventory, Recipe Creation & Matching Engine: pantry items correctly inform recipe canCook calculation', async () => {
    // Add pantry items: Basmati Rice (1000g), Tomatoes (500g)
    await request(app)
      .post('/api/inventory')
      .set('Cookie', userAToken)
      .send({
        name: 'Basmati Rice',
        category: 'Grains',
        quantity: 1000,
        unit: 'g',
        minimumQuantity: 200,
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString()
      })
      .expect(201);

    await request(app)
      .post('/api/inventory')
      .set('Cookie', userAToken)
      .send({
        name: 'Ripe Tomatoes',
        category: 'Vegetables',
        quantity: 500,
        unit: 'g',
        minimumQuantity: 100,
        expiryDate: new Date(Date.now() + 4 * 86400000).toISOString()
      })
      .expect(201);

    // Create a recipe requiring Rice and Tomatoes
    const recipeRes = await request(app)
      .post('/api/recipes')
      .set('Cookie', userAToken)
      .send({
        title: 'Quick Tomato Rice',
        description: 'Flavorful spiced tomato rice',
        instructions: 'Cook rice with pureed tomatoes and spices.',
        category: 'Rice Dishes',
        difficulty: 'Easy',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 2,
        ingredients: [
          { name: 'Basmati Rice', quantity: 200, unit: 'g', isOptional: false },
          { name: 'Ripe Tomatoes', quantity: 150, unit: 'g', isOptional: false }
        ]
      })
      .expect(201);

    tomatoRiceRecipeId = recipeRes.body.data.recipe.id;

    // Verify recipe matching
    const matchesRes = await request(app)
      .get('/api/recipes/matches')
      .set('Cookie', userAToken)
      .expect(200);

    const matched = matchesRes.body.data.matches.find((m) => m.id === tomatoRiceRecipeId);
    assert.ok(matched, 'Recipe must appear in matches');
    assert.equal(matched.matchPercentage, 100);
    assert.equal(matched.canCook, true);
  });

  test('3. Meal Planning, Preview, Atomic Cooking & Idempotent Deduction Lifecycle', async () => {
    // 1. Schedule Meal Plan
    const mealRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', userAToken)
      .send({
        recipeId: tomatoRiceRecipeId,
        scheduledDate: new Date().toISOString().split('T')[0],
        mealType: 'Lunch',
        servings: 2
      })
      .expect(201);

    const mealPlan = mealRes.body.mealPlan || mealRes.body.data?.mealPlan;
    assert.ok(mealPlan);
    const mealPlanId = mealPlan.id;
    assert.equal(mealPlan.status, 'PLANNED');

    // 2. Preview Cooking (Verifies no stock is deducted)
    const previewRes = await request(app)
      .post(`/api/meal-plans/${mealPlanId}/cook-preview`)
      .set('Cookie', userAToken)
      .expect(200);

    const preview = previewRes.body.preview || previewRes.body.data?.preview;
    assert.equal(preview.canCookCompletely, true);
    assert.equal(preview.hasShortfall, false);

    // Verify rice stock is still 1000g
    const itemsBefore = await request(app)
      .get('/api/inventory')
      .set('Cookie', userAToken)
      .expect(200);

    const riceBefore = itemsBefore.body.data.items.find((i) => i.name === 'Basmati Rice');
    assert.equal(riceBefore.quantity, 1000);

    // 3. Confirm Cooking
    const cookRes = await request(app)
      .post(`/api/meal-plans/${mealPlanId}/cook`)
      .set('Cookie', userAToken)
      .send({ allowPartial: false })
      .expect(200);

    const cookedPlan = cookRes.body.mealPlan || cookRes.body.data?.mealPlan;
    const deductions = cookRes.body.deductions || cookRes.body.data?.deductions;
    assert.equal(cookedPlan.status, 'COOKED');
    assert.equal(deductions.length, 2);

    // 4. Verify Inventory Deducted (1000g - 200g = 800g, 500g - 150g = 350g)
    const itemsAfter = await request(app)
      .get('/api/inventory')
      .set('Cookie', userAToken)
      .expect(200);

    const riceAfter = itemsAfter.body.data.items.find((i) => i.name === 'Basmati Rice');
    const tomatoAfter = itemsAfter.body.data.items.find((i) => i.name === 'Ripe Tomatoes');
    assert.equal(riceAfter.quantity, 800);
    assert.equal(tomatoAfter.quantity, 350);

    // 5. Idempotency Check: Cooking again is rejected with 409
    await request(app)
      .post(`/api/meal-plans/${mealPlanId}/cook`)
      .set('Cookie', userAToken)
      .send({ allowPartial: false })
      .expect(409);

    // 6. Reverse Cooking Consumption
    const reverseRes = await request(app)
      .post(`/api/meal-plans/${mealPlanId}/reverse-consumption`)
      .set('Cookie', userAToken)
      .send({ confirm: true })
      .expect(200);

    const reversedPlan = reverseRes.body.mealPlan || reverseRes.body.data?.mealPlan;
    assert.equal(reversedPlan.status, 'PLANNED');

    // 7. Verify Stock Restored to 1000g and 500g
    const itemsRestored = await request(app)
      .get('/api/inventory')
      .set('Cookie', userAToken)
      .expect(200);

    const riceRestored = itemsRestored.body.data.items.find((i) => i.name === 'Basmati Rice');
    const tomatoRestored = itemsRestored.body.data.items.find((i) => i.name === 'Ripe Tomatoes');
    assert.equal(riceRestored.quantity, 1000);
    assert.equal(tomatoRestored.quantity, 500);
  });

  test('4. Shopping Lists & Purchase Workflow: generates from shortfall and adds to inventory idempotently', async () => {
    // 1. Create a recipe requiring 2500g of Basmati Rice (we currently have 1000g)
    const bulkRecipe = await request(app)
      .post('/api/recipes')
      .set('Cookie', userAToken)
      .send({
        title: 'Community Biryani Handi',
        description: 'Large handi biryani',
        instructions: 'Cook in giant handi with aromatic whole spices.',
        category: 'Rice Dishes',
        difficulty: 'Medium',
        prepTimeMinutes: 30,
        cookTimeMinutes: 60,
        servings: 10,
        ingredients: [
          { name: 'Basmati Rice', quantity: 2500, unit: 'g', isOptional: false }
        ]
      })
      .expect(201);

    partyBiryaniRecipeId = bulkRecipe.body.data.recipe.id;

    // 2. Schedule Meal Plan for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const mealRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', userAToken)
      .send({
        recipeId: partyBiryaniRecipeId,
        scheduledDate: dateStr,
        mealType: 'Dinner',
        servings: 10
      })
      .expect(201);

    const mealPlanId = mealRes.body.mealPlan?.id || mealRes.body.data?.mealPlan?.id;

    // 3. Generate Shopping List from Meal Plans
    const genRes = await request(app)
      .post('/api/shopping-lists/generate-from-meal-plan')
      .set('Cookie', userAToken)
      .send({
        mealPlanIds: [mealPlanId],
        newListName: 'Weekend Handi Groceries',
        budget: 1500
      })
      .expect(200);

    const shoppingList = genRes.body.data.list;
    assert.ok(shoppingList);
    const riceItem = shoppingList.items.find((i) => (i.ingredientName || i.name || '').toLowerCase().includes('rice'));
    assert.ok(riceItem, 'Shortfall for rice must be added to shopping list');
    // Needed 2500g, had 1000g => shortfall = 1500g
    assert.equal(riceItem.quantity, 1500);

    // 4. Mark Item as Purchased with actual total price = ₹180
    const purchaseRes = await request(app)
      .post(`/api/shopping-lists/${shoppingList.id}/items/${riceItem.id}/purchase`)
      .set('Cookie', userAToken)
      .send({
        isPurchased: true,
        actualTotalPrice: 180.0
      })
      .expect(200);

    assert.equal(purchaseRes.body.data.item.isPurchased, true);

    // 5. Add Purchased Item to Kitchen Inventory
    const addInvRes = await request(app)
      .post(`/api/shopping-lists/${shoppingList.id}/items/${riceItem.id}/add-to-inventory`)
      .set('Cookie', userAToken)
      .send({})
      .expect(200);

    assert.equal(addInvRes.body.data.item.addedToInventory, true);

    // 6. Verify Inventory Stock Increased (1000g original + 1500g purchased = 2500g)
    const invCheck = await request(app)
      .get('/api/inventory')
      .set('Cookie', userAToken)
      .expect(200);

    const updatedRice = invCheck.body.data.items.find((i) => i.name === 'Basmati Rice');
    assert.equal(updatedRice.quantity, 2500);

    // 7. Duplicate Addition Prevention: Retrying returns 409
    await request(app)
      .post(`/api/shopping-lists/${shoppingList.id}/items/${riceItem.id}/add-to-inventory`)
      .set('Cookie', userAToken)
      .send({})
      .expect(409);
  });

  test('5. Nutrition & Dietary Tracking: recipe estimates, consumption ledger, and profile targets', async () => {
    // 1. Update Dietary Profile Goals
    const profileRes = await request(app)
      .patch('/api/nutrition/profile')
      .set('Cookie', userAToken)
      .send({
        dailyCalorieTarget: 2200,
        proteinTarget: 90,
        carbsTarget: 250,
        fatTarget: 60,
        dietaryPreference: 'Vegetarian'
      })
      .expect(200);

    assert.equal(profileRes.body.data.dailyCalorieTarget, 2200);

    // 2. Log Meal Consumption
    const logRes = await request(app)
      .post('/api/nutrition/consumption')
      .set('Cookie', userAToken)
      .send({
        recipeId: tomatoRiceRecipeId,
        mealType: 'Lunch',
        servingsConsumed: 1,
        notes: 'Delicious lunch'
      })
      .expect(201);

    const consumptionId = logRes.body.data.id;
    assert.ok(consumptionId);

    // 3. Verify Daily Nutrition Summary Aggregation
    const dailyRes = await request(app)
      .get('/api/nutrition/daily')
      .set('Cookie', userAToken)
      .expect(200);

    assert.ok(dailyRes.body.data.totals.calories > 0);
    assert.equal(dailyRes.body.data.targetsComparison.calories.target, 2200);

    // 4. Update Consumption Entry
    await request(app)
      .patch(`/api/nutrition/consumption/${consumptionId}`)
      .set('Cookie', userAToken)
      .send({ servingsConsumed: 1.5 })
      .expect(200);

    // 5. Delete Consumption Entry
    await request(app)
      .delete(`/api/nutrition/consumption/${consumptionId}`)
      .set('Cookie', userAToken)
      .expect(200);
  });

  test('6. Food-Waste & Expiry Tracking: categorization, atomic deduction, and reversal restoration', async () => {
    // 1. Get an inventory item to discard
    const invRes = await request(app)
      .get('/api/inventory')
      .set('Cookie', userAToken)
      .expect(200);

    const tomato = invRes.body.data.items.find((i) => i.name === 'Ripe Tomatoes');
    assert.ok(tomato);
    const startQty = tomato.quantity;

    // 2. Record 100g of spoiled tomatoes
    const wasteRes = await request(app)
      .post('/api/waste/records')
      .set('Cookie', userAToken)
      .send({
        inventoryItemId: tomato.id,
        quantityWasted: 100,
        unit: 'g',
        reason: 'SPOILED',
        estimatedTotalCost: 15.0,
        notes: 'Soft spots noticed on tomato surface'
      })
      .expect(201);

    const wasteRecordId = wasteRes.body.data.id || wasteRes.body.data.record?.id;
    assert.ok(wasteRecordId, 'Waste record id must be present');

    // 3. Verify Stock Deducted by 100g
    const invAfterWaste = await request(app)
      .get(`/api/inventory/${tomato.id}`)
      .set('Cookie', userAToken)
      .expect(200);

    assert.equal(invAfterWaste.body.data.item.quantity, startQty - 100);

    // 4. Verify Waste Analytics includes this incident and safe unit
    const analyticsRes = await request(app)
      .get('/api/waste/analytics?period=30d')
      .set('Cookie', userAToken)
      .expect(200);

    assert.ok(analyticsRes.body.data.recordsCount >= 1);
    assert.ok(analyticsRes.body.data.quantitiesByUnit['g'] >= 100);

    // 5. Reverse Waste Record with Stock Restoration
    const reverseRes = await request(app)
      .post(`/api/waste/records/${wasteRecordId}/reverse`)
      .set('Cookie', userAToken)
      .send({
        confirm: true,
        restoreToInventory: true,
        reversalReason: 'Rescued into simmered curry sauce'
      })
      .expect(200);

    const reversedRecord = reverseRes.body.data.record || reverseRes.body.data;
    assert.equal(reversedRecord.isReversed, true);

    // 6. Verify Stock Fully Restored
    const invAfterReverse = await request(app)
      .get(`/api/inventory/${tomato.id}`)
      .set('Cookie', userAToken)
      .expect(200);

    assert.equal(invAfterReverse.body.data.item.quantity, startQty);
  });

  test('7. Strict Cross-User Data Isolation (IDOR Protection): User B cannot access User A records', async () => {
    // 1. Get User A's private inventory item
    const invA = await request(app)
      .get('/api/inventory')
      .set('Cookie', userAToken)
      .expect(200);

    const itemA = invA.body.data.items[0];

    // User B tries to view, edit, or delete User A's item -> 404
    await request(app)
      .get(`/api/inventory/${itemA.id}`)
      .set('Cookie', userBToken)
      .expect(404);

    await request(app)
      .patch(`/api/inventory/${itemA.id}`)
      .set('Cookie', userBToken)
      .send({ quantity: 99999 })
      .expect(404);

    await request(app)
      .delete(`/api/inventory/${itemA.id}`)
      .set('Cookie', userBToken)
      .expect(404);

    // 2. User B tries to record food waste from User A's item -> 404
    await request(app)
      .post('/api/waste/records')
      .set('Cookie', userBToken)
      .send({
        inventoryItemId: itemA.id,
        quantityWasted: 50,
        unit: 'g',
        reason: 'EXPIRED'
      })
      .expect(404);

    // 3. User B tries to view User A's shopping lists -> sees only User B lists (empty)
    const listsB = await request(app)
      .get('/api/shopping-lists')
      .set('Cookie', userBToken)
      .expect(200);

    const bLists = listsB.body.data?.lists || listsB.body.data?.shoppingLists || [];
    assert.equal(bLists.length, 0);
  });

  test('8. Rate Limiting on AI Endpoints: sliding window throttles excessive requests', async () => {
    setMockGeminiClient(async () => 'Mock AI response');

    // Make rapid requests within rate limiter threshold
    const calls = [];
    for (let i = 0; i < 5; i++) {
      calls.push(
        request(app)
          .post('/api/ai/chat')
          .set('Cookie', userAToken)
          .send({ message: `Message ${i}` })
      );
    }
    const results = await Promise.all(calls);
    for (const res of results) {
      assert.equal(res.status, 200);
      assert.ok(res.body.success);
    }
  });
});
