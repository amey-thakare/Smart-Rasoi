/**
 * Smart Rasoi - Phase 10 Food-Waste Analytics, Expiry Tracking & Waste Reduction Test Suite
 */

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';
import { setMockGeminiClient, resetMockGeminiClient } from '../services/geminiService.js';
import { getExpiryCategorisation } from '../services/wasteService.js';

describe('Smart Rasoi Phase 10 - Food-Waste Analytics, Expiry Tracking & Waste Reduction', () => {
  let userACookies;
  let userAId;
  let userBCookies;
  let userBId;
  let itemMilkId;
  let itemTomatoId;
  let itemBreadId;
  let itemRiceId;
  let recipeId;

  const userA = {
    name: 'Priya WasteTester',
    email: `priya.waste.${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const userB = {
    name: 'Rohan OtherUser',
    email: `rohan.waste.${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  before(async () => {
    // 1. Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send(userA);
    assert.equal(resA.status, 201);
    userACookies = resA.headers['set-cookie'];
    userAId = resA.body.data.user.id;

    // 2. Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send(userB);
    assert.equal(resB.status, 201);
    userBCookies = resB.headers['set-cookie'];
    userBId = resB.body.data.user.id;

    // 3. Record price for Milk to test automatic unit cost estimation
    await request(app)
      .post('/api/ingredient-prices')
      .set('Cookie', userACookies)
      .send({
        ingredientName: 'Fresh Milk',
        unit: 'l',
        price: 64,
        quantity: 1,
        source: 'Grocery Store'
      });

    // 4. Create inventory items for User A with varying expiry dates
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const inTwentyDays = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

    // Item 1: Expired (Milk)
    const milkRes = await request(app)
      .post('/api/inventory')
      .set('Cookie', userACookies)
      .send({
        name: 'Fresh Milk',
        category: 'Dairy',
        quantity: 2,
        unit: 'l',
        expiryDate: twoDaysAgo.toISOString()
      });
    itemMilkId = milkRes.body.data.item.id;

    // Item 2: Expiring in 2 days (Tomato)
    const tomatoRes = await request(app)
      .post('/api/inventory')
      .set('Cookie', userACookies)
      .send({
        name: 'Tomatoes',
        category: 'Produce',
        quantity: 1.5,
        unit: 'kg',
        expiryDate: inTwoDays.toISOString()
      });
    itemTomatoId = tomatoRes.body.data.item.id;

    // Item 3: Expiring in 5 days (Bread)
    const breadRes = await request(app)
      .post('/api/inventory')
      .set('Cookie', userACookies)
      .send({
        name: 'Whole Wheat Bread',
        category: 'Bakery',
        quantity: 1,
        unit: 'piece',
        expiryDate: inFiveDays.toISOString()
      });
    itemBreadId = breadRes.body.data.item.id;

    // Item 4: Long shelf life (Basmati Rice, no expiry or far expiry)
    const riceRes = await request(app)
      .post('/api/inventory')
      .set('Cookie', userACookies)
      .send({
        name: 'Basmati Rice',
        category: 'Grains',
        quantity: 5,
        unit: 'kg',
        expiryDate: inTwentyDays.toISOString()
      });
    itemRiceId = riceRes.body.data.item.id;

    // Item 5: No expiry date recorded
    await request(app)
      .post('/api/inventory')
      .set('Cookie', userACookies)
      .send({
        name: 'Salt',
        category: 'Spices',
        quantity: 1,
        unit: 'kg'
      });

    // 5. Create a recipe for User A using Tomatoes
    const recRes = await request(app)
      .post('/api/recipes')
      .set('Cookie', userACookies)
      .send({
        title: 'Fresh Tomato Rasam',
        category: 'Soup',
        cuisine: 'South Indian',
        instructions: '1. Crush tomatoes.\n2. Simmer with spices.',
        servings: 2,
        ingredients: [
          { name: 'Tomatoes', quantity: 0.5, unit: 'kg' },
          { name: 'Salt', quantity: 10, unit: 'g' }
        ]
      });
    recipeId = recRes.body.data.recipe.id;
  });

  after(async () => {
    resetMockGeminiClient();
  });

  test('1. Expiry Categorisation categorises items and respects date boundaries', async () => {
    const res = await request(app)
      .get('/api/waste/expiry')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const { summary, categorised } = res.body.data;

    assert.ok(summary.totalItems >= 5);
    assert.ok(summary.expiredCount >= 1, 'Expired count should be >= 1');
    assert.ok(summary.expiringIn3DaysCount >= 1, 'Expiring in 3 days should be >= 1 (Tomatoes)');
    assert.ok(summary.expiringIn7DaysCount >= 1, 'Expiring in 7 days should be >= 1 (Bread)');
    assert.ok(summary.longerShelfLifeCount >= 1, 'Long shelf life should be >= 1 (Rice)');
    assert.ok(summary.noExpiryDateCount >= 1, 'No expiry date count should be >= 1 (Salt)');

    // Verify Milk is flagged as EXPIRED
    const expiredMilk = categorised.EXPIRED.find((i) => i.id === itemMilkId);
    assert.ok(expiredMilk, 'Milk should be categorized as EXPIRED');
    assert.equal(expiredMilk.status, 'EXPIRED');
    assert.ok(expiredMilk.daysRemaining < 0, 'Days remaining for expired milk must be negative');

    // Verify Salt has NO_EXPIRY_DATE and is not marked expired
    const noExpSalt = categorised.NO_EXPIRY_DATE.find((i) => i.name === 'Salt');
    assert.ok(noExpSalt, 'Salt should be in NO_EXPIRY_DATE category');
    assert.equal(noExpSalt.status, 'NO_EXPIRY_DATE');
    assert.equal(noExpSalt.daysRemaining, null);
  });

  test('2. POST /api/waste/records records waste and atomically deducts inventory', async () => {
    // Milk had quantity 2. Discard 0.5 l due to SPOILED
    const res = await request(app)
      .post('/api/waste/records')
      .set('Cookie', userACookies)
      .send({
        inventoryItemId: itemMilkId,
        quantityWasted: 0.5,
        unit: 'l',
        reason: 'SPOILED',
        notes: 'Forgot to refrigerate overnight'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    const record = res.body.data;
    assert.equal(record.ingredientName, 'Fresh Milk');
    assert.equal(record.quantityWasted, 0.5);
    assert.equal(record.reason, 'SPOILED');
    assert.equal(record.remainingStock, 1.5, 'Stock should be deducted from 2 to 1.5');
    assert.equal(record.estimatedUnitCost, 64, 'Estimated unit cost should resolve from price history');
    assert.equal(record.estimatedTotalCost, 32, '0.5 * 64 = 32 INR');

    // Verify inventory in database was actually updated
    const itemInDb = await prisma.inventoryItem.findUnique({ where: { id: itemMilkId } });
    assert.equal(itemInDb.quantity, 1.5);
  });

  test('3. Rejects waste recording with insufficient inventory stock (prevents negative quantity)', async () => {
    // Current stock is 1.5 l. Attempting to discard 5 l must be rejected with 400
    const res = await request(app)
      .post('/api/waste/records')
      .set('Cookie', userACookies)
      .send({
        inventoryItemId: itemMilkId,
        quantityWasted: 5,
        unit: 'l',
        reason: 'EXPIRED'
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message || res.body.error, /Cannot discard/);

    // Verify stock was NOT modified
    const itemInDb = await prisma.inventoryItem.findUnique({ where: { id: itemMilkId } });
    assert.equal(itemInDb.quantity, 1.5);
  });

  test('4. Rejects invalid waste payloads (negative quantity, invalid reason)', async () => {
    // Negative quantity
    const resNeg = await request(app)
      .post('/api/waste/records')
      .set('Cookie', userACookies)
      .send({
        inventoryItemId: itemMilkId,
        quantityWasted: -1,
        reason: 'EXPIRED'
      });
    assert.equal(resNeg.status, 400);

    // Invalid reason
    const resReason = await request(app)
      .post('/api/waste/records')
      .set('Cookie', userACookies)
      .send({
        inventoryItemId: itemMilkId,
        quantityWasted: 1,
        reason: 'ALIEN_ABDUCTION'
      });
    assert.equal(resReason.status, 400);
    assert.match(resReason.body.message || resReason.body.error, /Invalid reason/);
  });

  test('5. IDOR: User B cannot record waste from User A inventory item', async () => {
    const res = await request(app)
      .post('/api/waste/records')
      .set('Cookie', userBCookies)
      .send({
        inventoryItemId: itemMilkId, // User A's item
        quantityWasted: 0.5,
        reason: 'EXPIRED'
      });

    assert.equal(res.status, 404);
    assert.match(res.body.message || res.body.error, /Inventory item not found/);
  });

  test('6. POST /api/waste/records supports standalone waste entry without inventory deduction', async () => {
    const res = await request(app)
      .post('/api/waste/records')
      .set('Cookie', userACookies)
      .send({
        ingredientName: 'Cooked Biryani Leftovers',
        quantityWasted: 1,
        unit: 'portion',
        reason: 'EXCESS_PREPARED',
        estimatedTotalCost: 150,
        notes: 'Excess party food'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.inventoryItemId, null);
    assert.equal(res.body.data.ingredientName, 'Cooked Biryani Leftovers');
    assert.equal(res.body.data.estimatedTotalCost, 150);
  });

  test('7. Waste correction and reversal with confirmation and inventory restoration', async () => {
    // 1. Create a waste record for Tomato (discard 0.5 kg from 1.5 kg -> 1.0 kg remaining)
    const createRes = await request(app)
      .post('/api/waste/records')
      .set('Cookie', userACookies)
      .send({
        inventoryItemId: itemTomatoId,
        quantityWasted: 0.5,
        unit: 'kg',
        reason: 'COOKING_MISTAKE',
        notes: 'Accidental burn'
      });
    assert.equal(createRes.status, 201);
    const wasteRecordId = createRes.body.data.id;

    // Verify tomato stock is now 1.0 kg
    let tomato = await prisma.inventoryItem.findUnique({ where: { id: itemTomatoId } });
    assert.equal(tomato.quantity, 1.0);

    // 2. Attempt reversal without confirmation -> must fail with 400
    const failRev = await request(app)
      .post(`/api/waste/records/${wasteRecordId}/reverse`)
      .set('Cookie', userACookies)
      .send({ confirm: false });
    assert.equal(failRev.status, 400);

    // 3. Reverse with confirmation and restoreToInventory: true
    const successRev = await request(app)
      .post(`/api/waste/records/${wasteRecordId}/reverse`)
      .set('Cookie', userACookies)
      .send({
        confirm: true,
        restoreToInventory: true,
        reversalReason: 'Mistakenly logged wrong ingredient'
      });

    assert.equal(successRev.status, 200);
    assert.equal(successRev.body.success, true);
    assert.equal(successRev.body.data.isReversed, true);
    assert.equal(successRev.body.data.restoredToInventory, true);

    // Verify tomato stock was restored back to 1.5 kg
    tomato = await prisma.inventoryItem.findUnique({ where: { id: itemTomatoId } });
    assert.equal(tomato.quantity, 1.5);

    // 4. Duplicate reversal attempt must be prevented
    const dupRev = await request(app)
      .post(`/api/waste/records/${wasteRecordId}/reverse`)
      .set('Cookie', userACookies)
      .send({ confirm: true });
    assert.equal(dupRev.status, 400);
    assert.match(dupRev.body.message || dupRev.body.error, /already been reversed/);
  });

  test('8. GET /api/waste/analytics computes accurate metrics, breakdowns, and safe unit groupings', async () => {
    const res = await request(app)
      .get('/api/waste/analytics?period=30d')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const analytics = res.body.data;

    assert.ok(analytics.recordsCount >= 2, 'Should include active unreversed waste records');
    assert.ok(analytics.totalEstimatedCost >= 32, 'Total cost should accumulate accurately');
    assert.ok(Array.isArray(analytics.reasonsBreakdown));
    assert.ok(Array.isArray(analytics.topIngredients));
    assert.ok(analytics.quantitiesByUnit && typeof analytics.quantitiesByUnit === 'object');

    // Safe unit grouping: quantities must be separated by unit
    assert.ok(analytics.quantitiesByUnit['l'] !== undefined, 'Liters should be in unit grouping');

    // Reversed record must NOT be included in analytics total cost
    const reasonsMap = new Map(analytics.reasonsBreakdown.map((r) => [r.reason, r]));
    assert.ok(reasonsMap.has('SPOILED'));
  });

  test('9. GET /api/waste/at-risk identifies items near expiry and cross-references upcoming meal plans', async () => {
    // Check at-risk inventory
    const res = await request(app)
      .get('/api/waste/at-risk')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const atRisk = res.body.data;

    assert.ok(atRisk.atRiskCount >= 1, 'Should find near-expiry items');
    const tomatoRisk = atRisk.items.find((i) => i.id === itemTomatoId);
    assert.ok(tomatoRisk, 'Tomato should be flagged as near-expiry at-risk item');
    assert.ok(['CRITICAL', 'HIGH', 'MEDIUM'].includes(tomatoRisk.riskLevel));
    assert.ok(typeof tomatoRisk.riskReason === 'string' && tomatoRisk.riskReason.length > 0);
  });

  test('10. GET /api/waste/recipe-suggestions suggests recipes rescuing near-expiry stock and excludes expired stock', async () => {
    const res = await request(app)
      .get('/api/waste/recipe-suggestions')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const { suggestions, nearExpiryIngredients } = res.body.data;

    // Near expiry ingredients should include Tomatoes, but NOT expired Milk
    assert.ok(nearExpiryIngredients.includes('Tomatoes'));
    assert.ok(!nearExpiryIngredients.includes('Fresh Milk'), 'Expired milk must be excluded from consumption suggestions');

    // Fresh Tomato Rasam should be suggested
    const rasam = suggestions.find((s) => s.title === 'Fresh Tomato Rasam');
    assert.ok(rasam, 'Tomato Rasam should be recommended');
    assert.ok(rasam.nearExpiryUsed.includes('Tomatoes'));
  });

  test('11. GET /api/waste/summary returns live dashboard summary', async () => {
    const res = await request(app)
      .get('/api/waste/summary')
      .set('Cookie', userACookies);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const summary = res.body.data;

    assert.ok(summary.expiredCount >= 1);
    assert.ok(summary.expiringSoonCount >= 1);
    assert.ok(typeof summary.monthlyWasteCost === 'number');
    assert.ok(typeof summary.monthlyWasteIncidents === 'number');
  });

  test('12. POST /api/waste/ai-advice returns grounded advice or rule-based safety fallback', async () => {
    const res = await request(app)
      .post('/api/waste/ai-advice')
      .set('Cookie', userACookies)
      .send({
        prompt: 'How can I prevent my tomatoes from going to waste?'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const adviceData = res.body.data;
    assert.ok(typeof adviceData.advice === 'string' && adviceData.advice.length > 20);
    assert.ok(Array.isArray(adviceData.quickTips));
    assert.ok(adviceData.source);
  });

  test('13. Rejects unauthenticated requests across waste endpoints with 401', async () => {
    const ep1 = await request(app).get('/api/waste/expiry');
    assert.equal(ep1.status, 401);

    const ep2 = await request(app).get('/api/waste/analytics');
    assert.equal(ep2.status, 401);

    const ep3 = await request(app).post('/api/waste/records').send({ quantityWasted: 1 });
    assert.equal(ep3.status, 401);

    const ep4 = await request(app).get('/api/waste/at-risk');
    assert.equal(ep4.status, 401);
  });
});
