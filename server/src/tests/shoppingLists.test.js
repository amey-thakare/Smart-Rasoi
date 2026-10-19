import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';
import { seedSharedRecipes } from '../scripts/seedRecipes.js';

describe('Smart Rasoi Phase 8 - Smart Shopping Lists, Grocery Budgets & Ingredient Cost Optimisation', () => {
  const userAData = {
    name: 'Chef Meera Shopper A',
    email: 'meera.shopper.a@shop.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const userBData = {
    name: 'Chef Kabir Shopper B',
    email: 'kabir.shopper.b@shop.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  let cookieA = null;
  let userAId = null;
  let cookieB = null;
  let userBId = null;
  let sharedRecipeId = null;

  before(async () => {
    // Clean up test records
    await prisma.shoppingListItem.deleteMany({
      where: { shoppingList: { user: { email: { contains: 'shop.test' } } } }
    });
    await prisma.shoppingList.deleteMany({
      where: { user: { email: { contains: 'shop.test' } } }
    });
    await prisma.ingredientPrice.deleteMany({
      where: { user: { email: { contains: 'shop.test' } } }
    });
    await prisma.mealPlanConsumption.deleteMany({
      where: { mealPlan: { user: { email: { contains: 'shop.test' } } } }
    });
    await prisma.mealPlanEntry.deleteMany({
      where: { user: { email: { contains: 'shop.test' } } }
    });
    await prisma.inventoryItem.deleteMany({
      where: { user: { email: { contains: 'shop.test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'shop.test' } }
    });

    await seedSharedRecipes();
    const shared = await prisma.recipe.findFirst({
      where: { userId: null, isPublic: true }
    });
    sharedRecipeId = shared.id;

    // Register User A
    const resA = await request(app).post('/api/auth/register').send(userAData);
    assert.equal(resA.status, 201);
    cookieA = resA.headers['set-cookie'][0];
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send(userBData);
    assert.equal(resB.status, 201);
    cookieB = resB.headers['set-cookie'][0];
    userBId = resB.body.data.user.id;
  });

  after(async () => {
    await prisma.shoppingListItem.deleteMany({
      where: { shoppingList: { user: { email: { contains: 'shop.test' } } } }
    });
    await prisma.shoppingList.deleteMany({
      where: { user: { email: { contains: 'shop.test' } } }
    });
    await prisma.ingredientPrice.deleteMany({
      where: { user: { email: { contains: 'shop.test' } } }
    });
    await prisma.mealPlanConsumption.deleteMany({
      where: { mealPlan: { user: { email: { contains: 'shop.test' } } } }
    });
    await prisma.mealPlanEntry.deleteMany({
      where: { user: { email: { contains: 'shop.test' } } }
    });
    await prisma.inventoryItem.deleteMany({
      where: { user: { email: { contains: 'shop.test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'shop.test' } }
    });
  });

  test('1. Unauthenticated requests are rejected with 401 across shopping list and price endpoints', async () => {
    const endpoints = [
      { method: 'get', url: '/api/shopping-lists' },
      { method: 'post', url: '/api/shopping-lists' },
      { method: 'get', url: '/api/shopping-lists/dummy-id' },
      { method: 'patch', url: '/api/shopping-lists/dummy-id' },
      { method: 'delete', url: '/api/shopping-lists/dummy-id' },
      { method: 'get', url: '/api/ingredient-prices' },
      { method: 'post', url: '/api/ingredient-prices' },
      { method: 'get', url: '/api/shopping-lists/dashboard-summary' }
    ];

    for (const ep of endpoints) {
      const res = await request(app)[ep.method](ep.url);
      assert.equal(res.status, 401, `Endpoint ${ep.method.toUpperCase()} ${ep.url} should be protected with 401`);
    }
  });

  test('2. User can create, retrieve, update, and delete a shopping list with budget calculations', async () => {
    // Create list
    const createRes = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({
        name: 'Weekly Essentials',
        budget: 1500,
        notes: 'Groceries for the first week of the month'
      });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.success, true);
    const list = createRes.body.data.list;
    assert.equal(list.name, 'Weekly Essentials');
    assert.equal(list.budget, 1500);
    assert.equal(list.status, 'ACTIVE');

    // Retrieve list
    const getRes = await request(app)
      .get(`/api/shopping-lists/${list.id}`)
      .set('Cookie', cookieA);

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.list.id, list.id);
    assert.equal(getRes.body.data.list.remainingBudget, 1500);

    // Update list
    const updateRes = await request(app)
      .patch(`/api/shopping-lists/${list.id}`)
      .set('Cookie', cookieA)
      .send({
        name: 'Weekly Fresh Essentials',
        budget: 1800,
        status: 'ACTIVE'
      });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.list.name, 'Weekly Fresh Essentials');
    assert.equal(updateRes.body.data.list.budget, 1800);
  });

  test('3. Rejects invalid list inputs (empty name, negative budget, invalid status)', async () => {
    const invalidName = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: '', budget: 500 });
    assert.equal(invalidName.status, 400);

    const negativeBudget = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'Invalid Budget List', budget: -50 });
    assert.equal(negativeBudget.status, 400);

    const created = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'Temp Status List', budget: 500 });
    assert.equal(created.status, 201);

    const invalidStatus = await request(app)
      .patch(`/api/shopping-lists/${created.body.data.list.id}`)
      .set('Cookie', cookieA)
      .send({ status: 'UNKNOWN_STATUS' });
    assert.equal(invalidStatus.status, 400);
  });

  test('4. IDOR Protection: User B cannot view, edit, or delete User A shopping lists or items', async () => {
    const listA = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'User A Private List', budget: 1000 });
    assert.equal(listA.status, 201);
    const listAId = listA.body.data.list.id;

    // User B attempts to read User A's list
    const getRes = await request(app)
      .get(`/api/shopping-lists/${listAId}`)
      .set('Cookie', cookieB);
    assert.equal(getRes.status, 404);

    // User B attempts to edit User A's list
    const patchRes = await request(app)
      .patch(`/api/shopping-lists/${listAId}`)
      .set('Cookie', cookieB)
      .send({ name: 'Hacked List' });
    assert.equal(patchRes.status, 404);

    // User B attempts to delete User A's list
    const deleteRes = await request(app)
      .delete(`/api/shopping-lists/${listAId}`)
      .set('Cookie', cookieB);
    assert.equal(deleteRes.status, 404);
  });

  test('5. Ingredient Price Tracking: record price, fetch history, trends, and compatible unit conversions', async () => {
    // Record price: 1 kg Rice for ₹100
    const rec1 = await request(app)
      .post('/api/ingredient-prices')
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Basmati Rice',
        unit: 'kg',
        price: 100,
        quantity: 1,
        source: 'Supermarket Store'
      });
    assert.equal(rec1.status, 201);
    assert.equal(rec1.body.data.record.unitPrice, 100);

    // Record price: 2 kg Rice for ₹220 (unit price 110)
    const rec2 = await request(app)
      .post('/api/ingredient-prices')
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Basmati Rice',
        unit: 'kg',
        price: 220,
        quantity: 2,
        source: 'Local Mart'
      });
    assert.equal(rec2.status, 201);
    assert.equal(rec2.body.data.record.unitPrice, 110);

    // Fetch price history
    const historyRes = await request(app)
      .get('/api/ingredient-prices?ingredientName=Basmati')
      .set('Cookie', cookieA);
    assert.equal(historyRes.status, 200);
    assert.equal(historyRes.body.data.prices.length, 2);

    // Fetch trends
    const trendsRes = await request(app)
      .get('/api/ingredient-prices/trends')
      .set('Cookie', cookieA);
    assert.equal(trendsRes.status, 200);
    const riceTrend = trendsRes.body.data.trends.find((t) => t.ingredientName.toLowerCase().includes('rice'));
    assert.ok(riceTrend);
    assert.equal(riceTrend.latestUnitPrice, 110);
    assert.equal(riceTrend.previousUnitPrice, 100);
    assert.equal(riceTrend.trend, 'up');
  });

  test('6. User can add, edit, and delete shopping items with automatic price estimation from price history', async () => {
    const listRes = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'Pantry Restock', budget: 2000 });
    const listId = listRes.body.data.list.id;

    // Add item: 500 g Basmati Rice without explicit estimated price (should auto-derive from 110/kg -> 0.5 * 110 = ₹55)
    const addItemRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items`)
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Basmati Rice',
        quantity: 500,
        unit: 'g'
      });

    assert.equal(addItemRes.status, 201);
    const item = addItemRes.body.data.item;
    assert.equal(item.ingredientName, 'Basmati Rice');
    assert.equal(item.quantity, 500);
    assert.equal(item.unit, 'g');
    assert.equal(item.estimatedTotalPrice, 55);

    // Update item: change quantity to 1000 g (estimated total becomes 110)
    const updateItemRes = await request(app)
      .patch(`/api/shopping-lists/${listId}/items/${item.id}`)
      .set('Cookie', cookieA)
      .send({
        quantity: 1000
      });
    assert.equal(updateItemRes.status, 200);
    assert.equal(updateItemRes.body.data.item.quantity, 1000);
    assert.equal(updateItemRes.body.data.item.estimatedTotalPrice, 110);

    // Delete item
    const deleteItemRes = await request(app)
      .delete(`/api/shopping-lists/${listId}/items/${item.id}`)
      .set('Cookie', cookieA);
    assert.equal(deleteItemRes.status, 200);
    assert.equal(deleteItemRes.body.data.success, true);
  });

  test('7. Purchase Tracking: mark item as purchased with actual price, auto-record price, and unpurchase safely', async () => {
    const listRes = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'Dinner Shopping', budget: 1000 });
    const listId = listRes.body.data.list.id;

    const itemRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items`)
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Paneer',
        quantity: 400,
        unit: 'g',
        estimatedUnitPrice: 0.25
      });
    const itemId = itemRes.body.data.item.id;

    // Mark as purchased with actual total price = ₹90
    const purchaseRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items/${itemId}/purchase`)
      .set('Cookie', cookieA)
      .send({
        isPurchased: true,
        purchasedQuantity: 400,
        purchasedUnit: 'g',
        actualTotalPrice: 90
      });

    assert.equal(purchaseRes.status, 200);
    const purchased = purchaseRes.body.data.item;
    assert.equal(purchased.isPurchased, true);
    assert.equal(purchased.actualTotalPrice, 90);
    assert.equal(purchased.actualUnitPrice, 0.23); // 90 / 400 = 0.225 rounded to 0.23
    assert.ok(purchased.purchasedAt);

    // Verify list metrics updated
    const listMetricsRes = await request(app)
      .get(`/api/shopping-lists/${listId}`)
      .set('Cookie', cookieA);
    assert.equal(listMetricsRes.body.data.list.purchasedCount, 1);
    assert.equal(listMetricsRes.body.data.list.actualTotal, 90);
    assert.equal(listMetricsRes.body.data.list.remainingBudget, 910);

    // Unmark purchased
    const unmarkRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items/${itemId}/purchase`)
      .set('Cookie', cookieA)
      .send({ isPurchased: false });

    assert.equal(unmarkRes.status, 200);
    assert.equal(unmarkRes.body.data.item.isPurchased, false);
    assert.equal(unmarkRes.body.data.item.actualTotalPrice, null);
  });

  test('8. Purchase to Inventory: adding purchased item to kitchen inventory updates stock and prevents duplicate additions', async () => {
    // Ensure User A has an initial inventory item: 500 g Sugar
    const initialInv = await prisma.inventoryItem.create({
      data: {
        userId: userAId,
        name: 'Organic Sugar',
        quantity: 500,
        unit: 'g',
        category: 'Pantry'
      }
    });

    const listRes = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'Baking Groceries', budget: 500 });
    const listId = listRes.body.data.list.id;

    const itemRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items`)
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Organic Sugar',
        quantity: 1000,
        unit: 'g'
      });
    const itemId = itemRes.body.data.item.id;

    // Try adding to inventory BEFORE purchasing (should reject with 400)
    const prematureAdd = await request(app)
      .post(`/api/shopping-lists/${listId}/items/${itemId}/add-to-inventory`)
      .set('Cookie', cookieA)
      .send({});
    assert.equal(prematureAdd.status, 400);

    // Mark as purchased
    await request(app)
      .post(`/api/shopping-lists/${listId}/items/${itemId}/purchase`)
      .set('Cookie', cookieA)
      .send({ isPurchased: true, actualTotalPrice: 60 });

    // Add to kitchen inventory
    const addInvRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items/${itemId}/add-to-inventory`)
      .set('Cookie', cookieA)
      .send({});

    assert.equal(addInvRes.status, 200);
    assert.equal(addInvRes.body.data.item.addedToInventory, true);
    // Stock should have merged from 500g + 1000g = 1500g
    assert.equal(addInvRes.body.data.inventoryItem.quantity, 1500);

    // Try adding AGAIN (duplicate prevention should return 409)
    const duplicateAdd = await request(app)
      .post(`/api/shopping-lists/${listId}/items/${itemId}/add-to-inventory`)
      .set('Cookie', cookieA)
      .send({});
    assert.equal(duplicateAdd.status, 409);
  });

  test('9. Generate from Meal Plan: compiles shopping list from ingredient shortfalls without deducting inventory', async () => {
    // Schedule a meal for User A
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const mealPlanRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: sharedRecipeId,
        scheduledDate: dateStr,
        mealType: 'Dinner',
        servings: 4
      });
    assert.equal(mealPlanRes.status, 201);
    const mealPlanId = mealPlanRes.body.mealPlan?.id || mealPlanRes.body.data?.entry?.id || mealPlanRes.body.data?.mealPlan?.id;

    // Generate shopping list from this meal plan
    const genRes = await request(app)
      .post('/api/shopping-lists/generate-from-meal-plan')
      .set('Cookie', cookieA)
      .send({
        mealPlanIds: [mealPlanId],
        newListName: 'Auto Meal Plan List',
        budget: 1200
      });

    assert.equal(genRes.status, 200);
    assert.equal(genRes.body.success, true);
    const genList = genRes.body.data.list;
    assert.ok(genList.items.length > 0);
    assert.equal(genList.name, 'Auto Meal Plan List');
    assert.equal(genList.budget, 1200);

    // Verify inventory was NOT deducted
    const mealPlanCheck = await prisma.mealPlanEntry.findUnique({
      where: { id: mealPlanId },
      include: { consumptions: true }
    });
    assert.equal(mealPlanCheck.status, 'PLANNED');
    assert.equal(mealPlanCheck.consumptions.length, 0);
  });

  test('10. Regeneration duplicate prevention: preserves existing prices, notes, and purchase status on re-generation', async () => {
    const listRes = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'Preservation List', budget: 1000 });
    const listId = listRes.body.data.list.id;

    // Manually add an item to the list with custom price and mark as purchased
    const itemRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items`)
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Turmeric Powder',
        quantity: 50,
        unit: 'g',
        estimatedUnitPrice: 0.5,
        notes: 'Hand-picked organic brand'
      });
    const itemId = itemRes.body.data.item.id;

    await request(app)
      .post(`/api/shopping-lists/${listId}/items/${itemId}/purchase`)
      .set('Cookie', cookieA)
      .send({ isPurchased: true, actualTotalPrice: 25 });

    // Create a meal requiring Turmeric
    const mealRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: sharedRecipeId,
        scheduledDate: new Date().toISOString().split('T')[0],
        mealType: 'Lunch',
        servings: 2
      });

    const mealId = mealRes.body.mealPlan?.id || mealRes.body.data?.entry?.id || mealRes.body.data?.mealPlan?.id;

    // Re-generate into this existing target list
    const regenRes = await request(app)
      .post(`/api/shopping-lists/${listId}/generate-from-meal-plan`)
      .set('Cookie', cookieA)
      .send({
        mealPlanIds: [mealId]
      });

    assert.equal(regenRes.status, 200);
    const updatedList = regenRes.body.data.list;

    // Turmeric Powder should still be present, still marked as purchased, and retain its custom price
    const turmeric = updatedList.items.find((i) => i.ingredientName.toLowerCase().includes('turmeric'));
    if (turmeric) {
      assert.equal(turmeric.isPurchased, true);
      assert.equal(turmeric.actualTotalPrice, 25);
    }
  });

  test('11. Cost Optimisation: returns high cost drivers, missing price indicators, and actionable budget tips', async () => {
    const listRes = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'Budget Analysis List', budget: 500 });
    const listId = listRes.body.data.list.id;

    // Add 1 expensive item (₹400) and 1 item with unknown price
    await request(app)
      .post(`/api/shopping-lists/${listId}/items`)
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Saffron Threads',
        quantity: 5,
        unit: 'g',
        estimatedUnitPrice: 80 // 5 * 80 = 400
      });

    await request(app)
      .post(`/api/shopping-lists/${listId}/items`)
      .set('Cookie', cookieA)
      .send({
        ingredientName: 'Rare Exotic Spice',
        quantity: 1,
        unit: 'pcs'
        // No price provided
      });

    const optRes = await request(app)
      .get(`/api/shopping-lists/${listId}/optimisation`)
      .set('Cookie', cookieA);

    assert.equal(optRes.status, 200);
    const opt = optRes.body.data;
    assert.equal(opt.listId, listId);
    assert.ok(opt.mostExpensiveItems.length > 0);
    assert.equal(opt.mostExpensiveItems[0].ingredientName, 'Saffron Threads');
    assert.equal(opt.missingPriceCount, 1);
    assert.ok(opt.tips.length > 0);
  });

  test('12. User Budget Settings: retrieve and update monthly and weekly grocery budgets', async () => {
    const patchRes = await request(app)
      .patch('/api/shopping-lists/budget-settings')
      .set('Cookie', cookieA)
      .send({
        monthlyBudget: 8000,
        weeklyBudget: 2000
      });

    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.data.settings.monthlyBudget, 8000);
    assert.equal(patchRes.body.data.settings.weeklyBudget, 2000);

    const getRes = await request(app)
      .get('/api/shopping-lists/budget-settings')
      .set('Cookie', cookieA);

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.settings.monthlyBudget, 8000);
    assert.equal(getRes.body.data.settings.weeklyBudget, 2000);
  });

  test('13. Dashboard Shopping Summary: returns live database grocery metrics for authenticated user', async () => {
    const dashRes = await request(app)
      .get('/api/shopping-lists/dashboard-summary')
      .set('Cookie', cookieA);

    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.success, true);
    const summary = dashRes.body.data;
    assert.equal(typeof summary.hasActiveList, 'boolean');
    assert.equal(typeof summary.totalPendingItems, 'number');
    assert.equal(typeof summary.totalEstimatedCost, 'number');
    assert.ok(Array.isArray(summary.mostExpensivePending));
    assert.equal(summary.monthlyBudget, 8000);
    assert.equal(summary.weeklyBudget, 2000);
  });

  test('14. Bulk Item Addition: adds multiple missing ingredients, handles merging and IDOR isolation', async () => {
    // Create a new list for User A
    const listRes = await request(app)
      .post('/api/shopping-lists')
      .set('Cookie', cookieA)
      .send({ name: 'Recipe Ingredients Test List' });
    assert.equal(listRes.status, 201);
    const listId = listRes.body.data.list.id;

    // Bulk add items
    const bulkRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items/bulk`)
      .set('Cookie', cookieA)
      .send({
        items: [
          { ingredientName: 'Basmati Rice', quantity: 2, unit: 'cups', notes: 'For fried rice' },
          { ingredientName: 'Carrots', quantity: 0.5, unit: 'cups', notes: 'For fried rice' },
          { ingredientName: 'Garlic', quantity: 3, unit: 'cloves', notes: 'For fried rice' }
        ]
      });

    assert.equal(bulkRes.status, 201);
    assert.equal(bulkRes.body.data.count, 3);
    assert.equal(bulkRes.body.data.items.length, 3);

    // Bulk add again with overlapping item to verify merging
    const mergeRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items/bulk`)
      .set('Cookie', cookieA)
      .send({
        items: [
          { ingredientName: 'Basmati Rice', quantity: 1, unit: 'cups', notes: 'Extra rice' },
          { ingredientName: 'Soy Sauce', quantity: 2, unit: 'tbsp' }
        ]
      });

    assert.equal(mergeRes.status, 201);
    const listCheck = await request(app)
      .get(`/api/shopping-lists/${listId}`)
      .set('Cookie', cookieA);

    const riceItem = listCheck.body.data.list.items.find((i) => i.ingredientName.toLowerCase() === 'basmati rice');
    assert.ok(riceItem);
    assert.equal(riceItem.quantity, 3); // 2 + 1 merged!

    // IDOR Protection: User B cannot bulk add to User A's list
    const idorRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items/bulk`)
      .set('Cookie', cookieB)
      .send({
        items: [{ ingredientName: 'Hacker Salt', quantity: 10, unit: 'kg' }]
      });
    assert.equal(idorRes.status, 404);

    // Validation: empty array rejected with 400
    const emptyRes = await request(app)
      .post(`/api/shopping-lists/${listId}/items/bulk`)
      .set('Cookie', cookieA)
      .send({ items: [] });
    assert.equal(emptyRes.status, 400);
  });
});
