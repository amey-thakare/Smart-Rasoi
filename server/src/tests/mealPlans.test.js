import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';
import { seedSharedRecipes } from '../scripts/seedRecipes.js';

describe('Smart Rasoi Phase 7 - Meal Planning, Calendar & Inventory Deduction Test Suite', () => {
  const userAData = {
    name: 'Chef Ananya Planner A',
    email: 'ananya.planner.a@planner.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const userBData = {
    name: 'Chef Vikram Planner B',
    email: 'vikram.planner.b@planner.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  let cookieA = null;
  let userAId = null;
  let cookieB = null;
  let userBId = null;
  let sharedRecipeId = null;
  let userARecipeId = null;
  let userBRecipeId = null;
  let userAInventoryPulaoRice = null;
  let userAInventoryPeas = null;

  before(async () => {
    // Clean up existing test records
    await prisma.mealPlanConsumption.deleteMany({
      where: { mealPlan: { user: { email: { contains: 'planner.test' } } } }
    });
    await prisma.mealPlanEntry.deleteMany({
      where: { user: { email: { contains: 'planner.test' } } }
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipe: { user: { email: { contains: 'planner.test' } } } }
    });
    await prisma.recipe.deleteMany({
      where: { user: { email: { contains: 'planner.test' } } }
    });
    await prisma.inventoryItem.deleteMany({
      where: { user: { email: { contains: 'planner.test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'planner.test' } }
    });

    // Seed shared recipes
    await seedSharedRecipes();

    const shared = await prisma.recipe.findFirst({
      where: { userId: null, isPublic: true }
    });
    assert.ok(shared, 'Shared recipe should exist');
    sharedRecipeId = shared.id;

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send(userAData);
    assert.equal(resA.status, 201);
    cookieA = resA.headers['set-cookie'][0];
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send(userBData);
    assert.equal(resB.status, 201);
    cookieB = resB.headers['set-cookie'][0];
    userBId = resB.body.data.user.id;

    // Create User A private recipe (2 servings)
    const recARes = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send({
        title: 'Ananya Special Dal Khichdi',
        instructions: '1. Wash dal and rice.\n2. Pressure cook with turmeric.\n3. Temper with ghee and cumin.',
        category: 'Dinner',
        cuisine: 'Indian',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 2,
        difficulty: 'Easy',
        ingredients: [
          { name: 'Moong Dal', quantity: 100, unit: 'g', isOptional: false },
          { name: 'Basmati Rice', quantity: 150, unit: 'g', isOptional: false },
          { name: 'Ghee', quantity: 2, unit: 'tbsp', isOptional: true }
        ]
      });
    assert.equal(recARes.status, 201);
    userARecipeId = recARes.body.data?.recipe?.id || recARes.body.recipe?.id;

    // Create User B private recipe
    const recBRes = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieB)
      .send({
        title: 'Vikram Secret Pasta',
        instructions: 'Boil pasta and add sauce.',
        category: 'Dinner',
        servings: 2,
        difficulty: 'Easy',
        ingredients: [
          { name: 'Penne Pasta', quantity: 200, unit: 'g', isOptional: false }
        ]
      });
    assert.equal(recBRes.status, 201);
    userBRecipeId = recBRes.body.data?.recipe?.id || recBRes.body.recipe?.id;

    // Stock User A inventory items
    const invRice = await prisma.inventoryItem.create({
      data: {
        userId: userAId,
        name: 'Basmati Rice',
        category: 'Grains',
        quantity: 500, // 500g in stock
        unit: 'g'
      }
    });
    userAInventoryPulaoRice = invRice;

    const invDal = await prisma.inventoryItem.create({
      data: {
        userId: userAId,
        name: 'Moong Dal',
        category: 'Pulses',
        quantity: 300, // 300g in stock
        unit: 'g'
      }
    });

    const invPeas = await prisma.inventoryItem.create({
      data: {
        userId: userAId,
        name: 'Green Peas',
        category: 'Vegetables',
        quantity: 50, // Only 50g in stock (insufficient for large meals)
        unit: 'g'
      }
    });
    userAInventoryPeas = invPeas;
  });

  after(async () => {
    await prisma.mealPlanConsumption.deleteMany({
      where: { mealPlan: { user: { email: { contains: 'planner.test' } } } }
    });
    await prisma.mealPlanEntry.deleteMany({
      where: { user: { email: { contains: 'planner.test' } } }
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipe: { user: { email: { contains: 'planner.test' } } } }
    });
    await prisma.recipe.deleteMany({
      where: { user: { email: { contains: 'planner.test' } } }
    });
    await prisma.inventoryItem.deleteMany({
      where: { user: { email: { contains: 'planner.test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'planner.test' } }
    });
  });

  // ==========================================
  // 1. MEAL PLAN CRUD & AUTHORIZATION
  // ==========================================
  test('1. Unauthenticated requests are rejected with 401 across meal plan endpoints', async () => {
    const resList = await request(app).get('/api/meal-plans');
    assert.equal(resList.status, 401);

    const resPost = await request(app).post('/api/meal-plans').send({});
    assert.equal(resPost.status, 401);

    const resReq = await request(app).get('/api/meal-plans/requirements');
    assert.equal(resReq.status, 401);
  });

  test('2. User can schedule a valid shared recipe and private recipe', async () => {
    // Schedule shared recipe for Monday
    const res1 = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: sharedRecipeId,
        scheduledDate: '2026-10-19',
        mealType: 'Dinner',
        servings: 4,
        notes: 'Family dinner'
      });
    assert.equal(res1.status, 201);
    assert.equal(res1.body.success, true);
    assert.equal(res1.body.mealPlan.servings, 4);
    assert.equal(res1.body.mealPlan.mealType, 'Dinner');
    assert.equal(res1.body.mealPlan.status, 'PLANNED');
    assert.equal(res1.body.mealPlan.scheduledDateStr, '2026-10-19');

    // Schedule user A private recipe for Tuesday
    const res2 = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-20',
        mealType: 'Lunch',
        servings: 2
      });
    assert.equal(res2.status, 201);
    assert.equal(res2.body.mealPlan.status, 'PLANNED');

    // Verify planning did NOT deduct any inventory
    const riceStock = await prisma.inventoryItem.findUnique({
      where: { id: userAInventoryPulaoRice.id }
    });
    assert.equal(riceStock.quantity, 500, 'Inventory quantity must not change upon meal planning');
  });

  test('3. Planning rejects invalid dates, meal types, servings, and unauthorized recipes', async () => {
    // Invalid date
    const resDate = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: 'not-a-valid-date',
        mealType: 'Dinner'
      });
    assert.equal(resDate.status, 400);

    // Invalid meal type
    const resType = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-19',
        mealType: 'MidnightSnack' // invalid
      });
    assert.equal(resType.status, 400);

    // Invalid servings (0 or negative)
    const resServ = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-19',
        mealType: 'Dinner',
        servings: 0
      });
    assert.equal(resServ.status, 400);

    // User A cannot schedule User B private recipe
    const resPriv = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userBRecipeId,
        scheduledDate: '2026-10-19',
        mealType: 'Dinner'
      });
    assert.equal(resPriv.status, 404);
  });

  test('4. User A can list and filter planned meals by date range', async () => {
    const res = await request(app)
      .get('/api/meal-plans?from=2026-10-18&to=2026-10-25')
      .set('Cookie', cookieA);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.mealPlans.length >= 2);
    // User B should have 0 meals in this range
    const resB = await request(app)
      .get('/api/meal-plans?from=2026-10-18&to=2026-10-25')
      .set('Cookie', cookieB);
    assert.equal(resB.body.mealPlans.length, 0, 'Cross-user plan entries must not leak');
  });

  test('5. IDOR Protection: User B cannot view, update, or delete User A planned meals', async () => {
    // Get one meal plan from User A
    const listRes = await request(app)
      .get('/api/meal-plans')
      .set('Cookie', cookieA);
    const mealA = listRes.body.mealPlans[0];

    // User B tries to get it
    const getRes = await request(app)
      .get(`/api/meal-plans/${mealA.id}`)
      .set('Cookie', cookieB);
    assert.equal(getRes.status, 404);

    // User B tries to update it
    const patchRes = await request(app)
      .patch(`/api/meal-plans/${mealA.id}`)
      .set('Cookie', cookieB)
      .send({ notes: 'Hacked by Vikram' });
    assert.equal(patchRes.status, 404);

    // User B tries to delete it
    const delRes = await request(app)
      .delete(`/api/meal-plans/${mealA.id}`)
      .set('Cookie', cookieB);
    assert.equal(delRes.status, 404);
  });

  test('6. User can update planned meal details and delete planned entry safely', async () => {
    // Create temporary meal
    const createRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-25',
        mealType: 'Snacks',
        servings: 3,
        notes: 'Quick snack'
      });
    const tempId = createRes.body.mealPlan.id;

    // Update servings and notes
    const updateRes = await request(app)
      .patch(`/api/meal-plans/${tempId}`)
      .set('Cookie', cookieA)
      .send({
        servings: 5,
        notes: 'Updated snack for 5 friends'
      });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.mealPlan.servings, 5);
    assert.equal(updateRes.body.mealPlan.notes, 'Updated snack for 5 friends');

    // Delete meal
    const delRes = await request(app)
      .delete(`/api/meal-plans/${tempId}`)
      .set('Cookie', cookieA);
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);

    // Verify it is gone
    const checkRes = await request(app)
      .get(`/api/meal-plans/${tempId}`)
      .set('Cookie', cookieA);
    assert.equal(checkRes.status, 404);
  });

  test('7. Skip and Cancel status transitions update status without inventory deductions', async () => {
    // Create meal to skip
    const createRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-22',
        mealType: 'Breakfast',
        servings: 2
      });
    const mealId = createRes.body.mealPlan.id;

    // Skip meal
    const skipRes = await request(app)
      .post(`/api/meal-plans/${mealId}/skip`)
      .set('Cookie', cookieA);
    assert.equal(skipRes.status, 200);
    assert.equal(skipRes.body.mealPlan.status, 'SKIPPED');

    // Cancel meal
    const cancelRes = await request(app)
      .post(`/api/meal-plans/${mealId}/cancel`)
      .set('Cookie', cookieA);
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.mealPlan.status, 'CANCELLED');

    // Verify no consumptions were recorded
    const consumptions = await prisma.mealPlanConsumption.findMany({
      where: { mealPlanId: mealId }
    });
    assert.equal(consumptions.length, 0);
  });

  // ==========================================
  // 2. INGREDIENT REQUIREMENTS CALCULATION
  // ==========================================
  test('8. Requirements aggregation calculates scaled quantities, shortfall, and pantry sufficiency', async () => {
    // Clear existing meal plans for clean math
    await prisma.mealPlanEntry.deleteMany({ where: { userId: userAId } });

    // Plan meal 1: Dal Khichdi (base servings 2, planned servings 4 -> scale 2x)
    // Needs: Moong Dal (200g), Basmati Rice (300g)
    await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-21',
        mealType: 'Lunch',
        servings: 4
      });

    // Plan meal 2: Dal Khichdi (base servings 2, planned servings 2 -> scale 1x)
    // Needs: Moong Dal (100g), Basmati Rice (150g)
    await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-22',
        mealType: 'Dinner',
        servings: 2
      });

    // Fetch requirements for period
    const reqRes = await request(app)
      .get('/api/meal-plans/requirements?from=2026-10-20&to=2026-10-25')
      .set('Cookie', cookieA);

    assert.equal(reqRes.status, 200);
    assert.equal(reqRes.body.success, true);

    const { requirements, summary } = reqRes.body;
    assert.equal(summary.plannedMealsCount, 2);

    // Basmati Rice: 300g + 150g = 450g needed. User A has 500g in stock -> Sufficient
    const riceReq = requirements.find((r) => r.name === 'Basmati Rice');
    assert.ok(riceReq);
    assert.equal(riceReq.totalRequired, 450);
    assert.equal(riceReq.availableQuantity, 500);
    assert.equal(riceReq.shortfall, 0);
    assert.equal(riceReq.status, 'sufficient');

    // Moong Dal: 200g + 100g = 300g needed. User A has 300g in stock -> Sufficient
    const dalReq = requirements.find((r) => r.name === 'Moong Dal');
    assert.ok(dalReq);
    assert.equal(dalReq.totalRequired, 300);
    assert.equal(dalReq.shortfall, 0);
    assert.equal(dalReq.status, 'sufficient');
  });

  // ==========================================
  // 3. COOKING & INVENTORY DEDUCTION WORKFLOW
  // ==========================================
  test('9. Cook preview shows expected deductions and shortfalls without modifying database', async () => {
    // Schedule a meal for User A
    const mealRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-21',
        mealType: 'Dinner',
        servings: 2 // Needs Moong Dal 100g, Basmati Rice 150g
      });
    const mealId = mealRes.body.mealPlan.id;

    const previewRes = await request(app)
      .post(`/api/meal-plans/${mealId}/cook-preview`)
      .set('Cookie', cookieA);

    assert.equal(previewRes.status, 200);
    assert.equal(previewRes.body.success, true);
    assert.equal(previewRes.body.preview.canCookCompletely, true);

    // Verify stock was NOT altered by preview
    const riceStock = await prisma.inventoryItem.findUnique({
      where: { id: userAInventoryPulaoRice.id }
    });
    assert.equal(riceStock.quantity, 500);
  });

  test('10. Cooking a planned meal deducts inventory atomically and prevents duplicate cooking', async () => {
    // Create planned meal: Dal Khichdi for 2 servings (Moong Dal: 100g, Basmati Rice: 150g)
    const mealRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-21',
        mealType: 'Dinner',
        servings: 2
      });
    const mealId = mealRes.body.mealPlan.id;

    // Initial stock
    const initialRice = await prisma.inventoryItem.findFirst({
      where: { userId: userAId, name: 'Basmati Rice' }
    });
    const initialDal = await prisma.inventoryItem.findFirst({
      where: { userId: userAId, name: 'Moong Dal' }
    });
    const startingRiceQty = initialRice.quantity;
    const startingDalQty = initialDal.quantity;

    // Cook meal
    const cookRes = await request(app)
      .post(`/api/meal-plans/${mealId}/cook`)
      .set('Cookie', cookieA)
      .send({});

    assert.equal(cookRes.status, 200);
    assert.equal(cookRes.body.success, true);
    assert.equal(cookRes.body.mealPlan.status, 'COOKED');
    assert.ok(cookRes.body.mealPlan.cookedAt);

    // Check inventory deduction
    const afterRice = await prisma.inventoryItem.findUnique({ where: { id: initialRice.id } });
    const afterDal = await prisma.inventoryItem.findUnique({ where: { id: initialDal.id } });
    assert.equal(afterRice.quantity, startingRiceQty - 150, 'Rice should be deducted by 150g');
    assert.equal(afterDal.quantity, startingDalQty - 100, 'Dal should be deducted by 100g');

    // Check consumption records
    const consumptions = await prisma.mealPlanConsumption.findMany({
      where: { mealPlanId: mealId, isReversed: false }
    });
    assert.equal(consumptions.length, 2, 'Two consumption records should exist');

    // Duplicate cook request MUST return 409 Conflict
    const dupRes = await request(app)
      .post(`/api/meal-plans/${mealId}/cook`)
      .set('Cookie', cookieA)
      .send({});
    assert.equal(dupRes.status, 409, 'Duplicate cook request must be rejected with 409 Conflict');

    // Inventory MUST remain unchanged after duplicate attempt
    const verifyRice = await prisma.inventoryItem.findUnique({ where: { id: initialRice.id } });
    assert.equal(verifyRice.quantity, startingRiceQty - 150);
  });

  test('11. Insufficient inventory rolls back cooking transaction and prevents negative inventory', async () => {
    // Schedule huge meal (20 servings -> 1500g rice needed, but User A has only ~350g)
    const mealRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-23',
        mealType: 'Dinner',
        servings: 20
      });
    const mealId = mealRes.body.mealPlan.id;

    const riceBefore = await prisma.inventoryItem.findFirst({
      where: { userId: userAId, name: 'Basmati Rice' }
    });

    // Cooking should fail with 400 Bad Request
    const cookRes = await request(app)
      .post(`/api/meal-plans/${mealId}/cook`)
      .set('Cookie', cookieA)
      .send({ allowPartial: false });

    assert.equal(cookRes.status, 400);
    assert.equal(cookRes.body.success, false);
    assert.ok(cookRes.body.details?.shortfalls?.length > 0);

    // Verify meal remains PLANNED and inventory is untouched
    const mealAfter = await prisma.mealPlanEntry.findUnique({ where: { id: mealId } });
    assert.equal(mealAfter.status, 'PLANNED');

    const riceAfter = await prisma.inventoryItem.findUnique({ where: { id: riceBefore.id } });
    assert.equal(riceAfter.quantity, riceBefore.quantity, 'Stock must not change when transaction fails');
  });

  // ==========================================
  // 4. REVERSAL & AUDIT TRAIL WORKFLOW
  // ==========================================
  test('12. Reversing consumption restores exact deducted quantities and preserves audit trail', async () => {
    // Plan and cook a meal
    const mealRes = await request(app)
      .post('/api/meal-plans')
      .set('Cookie', cookieA)
      .send({
        recipeId: userARecipeId,
        scheduledDate: '2026-10-24',
        mealType: 'Lunch',
        servings: 2 // 150g rice, 100g dal
      });
    const mealId = mealRes.body.mealPlan.id;

    // Cook meal
    await request(app)
      .post(`/api/meal-plans/${mealId}/cook`)
      .set('Cookie', cookieA)
      .send({});

    const riceAfterCook = await prisma.inventoryItem.findFirst({
      where: { userId: userAId, name: 'Basmati Rice' }
    });

    // Reverse consumption
    const revRes = await request(app)
      .post(`/api/meal-plans/${mealId}/reverse-consumption`)
      .set('Cookie', cookieA);

    assert.equal(revRes.status, 200);
    assert.equal(revRes.body.success, true);
    assert.equal(revRes.body.mealPlan.status, 'PLANNED');
    assert.equal(revRes.body.mealPlan.cookedAt, null);

    // Inventory should be restored by exactly 150g
    const riceAfterRev = await prisma.inventoryItem.findUnique({
      where: { id: riceAfterCook.id }
    });
    assert.equal(riceAfterRev.quantity, riceAfterCook.quantity + 150);

    // Consumption records must still exist in audit trail, marked isReversed: true
    const auditRecords = await prisma.mealPlanConsumption.findMany({
      where: { mealPlanId: mealId }
    });
    assert.ok(auditRecords.length > 0);
    assert.ok(auditRecords.every((r) => r.isReversed === true));

    // Calling reverse again should fail
    const secondRevRes = await request(app)
      .post(`/api/meal-plans/${mealId}/reverse-consumption`)
      .set('Cookie', cookieA);
    assert.equal(secondRevRes.status, 400, 'Cannot reverse already reversed meal');
  });

  test('13. Dashboard meal summary returns live data for authenticated user', async () => {
    const dashRes = await request(app)
      .get('/api/meal-plans/dashboard-summary')
      .set('Cookie', cookieA);

    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.success, true);
    assert.ok(dashRes.body.todayMeals !== undefined);
    assert.ok(dashRes.body.weekPlannedCount !== undefined);
  });
});
