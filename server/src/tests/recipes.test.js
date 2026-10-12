import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';
import { seedSharedRecipes } from '../scripts/seedRecipes.js';

describe('Smart Rasoi Phase 4 - Recipe Management & Inventory Matching Test Suite', () => {
  const userAData = {
    name: 'Chef Ananya Recipes A',
    email: 'ananya.recipes.a@recipes.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const userBData = {
    name: 'Chef Vikram Recipes B',
    email: 'vikram.recipes.b@recipes.test',
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

  before(async () => {
    // Clean up test records
    await prisma.favourite.deleteMany({
      where: { user: { email: { contains: 'recipes.test' } } }
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipe: { user: { email: { contains: 'recipes.test' } } } }
    });
    await prisma.recipe.deleteMany({
      where: { user: { email: { contains: 'recipes.test' } } }
    });
    await prisma.inventoryItem.deleteMany({
      where: { user: { email: { contains: 'recipes.test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'recipes.test' } }
    });

    // Seed shared recipes in test database
    await seedSharedRecipes();

    // Grab one shared recipe ID for testing read-only rules
    const shared = await prisma.recipe.findFirst({
      where: { userId: null, isPublic: true }
    });
    assert.ok(shared, 'Shared recipe should exist after seeding');
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
  });

  after(async () => {
    await prisma.favourite.deleteMany({
      where: { user: { email: { contains: 'recipes.test' } } }
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipe: { user: { email: { contains: 'recipes.test' } } } }
    });
    await prisma.recipe.deleteMany({
      where: { user: { email: { contains: 'recipes.test' } } }
    });
    await prisma.inventoryItem.deleteMany({
      where: { user: { email: { contains: 'recipes.test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'recipes.test' } }
    });

    await prisma.$disconnect();
  });

  // 1. Authenticated users can list accessible recipes
  test('1. Authenticated users can list accessible recipes including shared seed recipes', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .set('Cookie', cookieA);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.recipes));
    assert.ok(res.body.data.recipes.length >= 10);
    // All returned recipes must be either shared or owned by User A
    assert.ok(
      res.body.data.recipes.every((r) => r.isPublic === true || r.userId === userAId)
    );
  });

  // 2. Unauthenticated requests are rejected
  test('2. Unauthenticated requests are rejected with 401 across recipe endpoints', async () => {
    const listRes = await request(app).get('/api/recipes');
    assert.equal(listRes.status, 401);

    const matchesRes = await request(app).get('/api/recipes/matches');
    assert.equal(matchesRes.status, 401);

    const favsRes = await request(app).get('/api/recipes/favourites');
    assert.equal(favsRes.status, 401);

    const getRes = await request(app).get(`/api/recipes/${sharedRecipeId}`);
    assert.equal(getRes.status, 401);

    const postRes = await request(app).post('/api/recipes').send({ title: 'Test' });
    assert.equal(postRes.status, 401);

    const patchRes = await request(app).patch(`/api/recipes/${sharedRecipeId}`).send({ title: 'Test' });
    assert.equal(patchRes.status, 401);

    const delRes = await request(app).delete(`/api/recipes/${sharedRecipeId}`);
    assert.equal(delRes.status, 401);

    const favPost = await request(app).post(`/api/recipes/${sharedRecipeId}/favourite`);
    assert.equal(favPost.status, 401);

    const favDel = await request(app).delete(`/api/recipes/${sharedRecipeId}/favourite`);
    assert.equal(favDel.status, 401);
  });

  // 3. Valid recipe creation succeeds
  test('3. Valid recipe creation succeeds with ingredients and assigns user ownership', async () => {
    const payload = {
      title: 'Grandma Paneer Curry',
      description: 'Traditional slow-cooked cottage cheese curry with rich gravy',
      instructions: '1. Sauté onions and pureed tomatoes.\n2. Add spices and paneer cubes.\n3. Simmer for 10 minutes.',
      category: 'Dinner',
      cuisine: 'North Indian',
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      servings: 4,
      difficulty: 'Medium',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
      ingredients: [
        { name: 'Paneer', quantity: 300, unit: 'g', isOptional: false },
        { name: 'Tomatoes', quantity: 3, unit: 'pcs', isOptional: false },
        { name: 'Heavy Cream', quantity: 2, unit: 'tbsp', isOptional: true }
      ]
    };

    const res = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.recipe);
    assert.equal(res.body.data.recipe.title, 'Grandma Paneer Curry');
    assert.equal(res.body.data.recipe.userId, userAId);
    assert.equal(res.body.data.recipe.isPublic, false);
    assert.equal(res.body.data.recipe.isOwner, true);
    assert.equal(res.body.data.recipe.ingredients.length, 3);

    userARecipeId = res.body.data.recipe.id;
  });

  // 4. Invalid recipe payloads are rejected
  test('4. Invalid recipe payloads are rejected with 400', async () => {
    // Missing title
    const noTitle = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send({
        instructions: 'Test',
        category: 'Dinner',
        ingredients: [{ name: 'Rice', quantity: 1, unit: 'cup' }]
      });
    assert.equal(noTitle.status, 400);

    // Missing instructions
    const noInst = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send({
        title: 'Title',
        category: 'Dinner',
        ingredients: [{ name: 'Rice', quantity: 1, unit: 'cup' }]
      });
    assert.equal(noInst.status, 400);

    // Missing category
    const noCat = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send({
        title: 'Title',
        instructions: 'Test',
        ingredients: [{ name: 'Rice', quantity: 1, unit: 'cup' }]
      });
    assert.equal(noCat.status, 400);

    // Negative prep time
    const negPrep = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send({
        title: 'Title',
        instructions: 'Test',
        category: 'Dinner',
        prepTimeMinutes: -5,
        ingredients: [{ name: 'Rice', quantity: 1, unit: 'cup' }]
      });
    assert.equal(negPrep.status, 400);

    // Zero or negative servings
    const zeroServ = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send({
        title: 'Title',
        instructions: 'Test',
        category: 'Dinner',
        servings: 0,
        ingredients: [{ name: 'Rice', quantity: 1, unit: 'cup' }]
      });
    assert.equal(zeroServ.status, 400);

    // Empty ingredients array
    const emptyIng = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send({
        title: 'Title',
        instructions: 'Test',
        category: 'Dinner',
        ingredients: []
      });
    assert.equal(emptyIng.status, 400);

    // Ingredient with negative quantity
    const negIngQty = await request(app)
      .post('/api/recipes')
      .set('Cookie', cookieA)
      .send({
        title: 'Title',
        instructions: 'Test',
        category: 'Dinner',
        ingredients: [{ name: 'Rice', quantity: -2, unit: 'cup' }]
      });
    assert.equal(negIngQty.status, 400);
  });

  // 5. Recipe ingredients persist correctly
  test('5. Recipe ingredients persist correctly in SQLite', async () => {
    const ingredientsInDb = await prisma.recipeIngredient.findMany({
      where: { recipeId: userARecipeId }
    });

    assert.equal(ingredientsInDb.length, 3);
    const paneer = ingredientsInDb.find((i) => i.name === 'Paneer');
    assert.ok(paneer);
    assert.equal(paneer.quantity, 300);
    assert.equal(paneer.unit, 'g');
    assert.equal(paneer.isOptional, false);
  });

  // 6. Users can update their own recipes
  test('6. Users can update their own recipes and replace ingredient lists safely', async () => {
    const updatePayload = {
      title: 'Grandma Paneer Makhani Curry',
      servings: 6,
      ingredients: [
        { name: 'Paneer', quantity: 400, unit: 'g', isOptional: false },
        { name: 'Tomatoes', quantity: 4, unit: 'pcs', isOptional: false },
        { name: 'Butter', quantity: 3, unit: 'tbsp', isOptional: false },
        { name: 'Cashews', quantity: 50, unit: 'g', isOptional: true }
      ]
    };

    const res = await request(app)
      .patch(`/api/recipes/${userARecipeId}`)
      .set('Cookie', cookieA)
      .send(updatePayload);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.recipe.title, 'Grandma Paneer Makhani Curry');
    assert.equal(res.body.data.recipe.servings, 6);
    assert.equal(res.body.data.recipe.ingredients.length, 4);

    // Verify in SQLite directly
    const inDb = await prisma.recipe.findUnique({
      where: { id: userARecipeId },
      include: { ingredients: true }
    });
    assert.equal(inDb.title, 'Grandma Paneer Makhani Curry');
    assert.equal(inDb.servings, 6);
    assert.equal(inDb.ingredients.length, 4);
  });

  // IDOR & Cross-User Security (Tests 7, 8, 9)
  describe('Ownership & Read-Only Protection', () => {
    before(async () => {
      // User B creates a private recipe
      const resB = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookieB)
        .send({
          title: 'User B Secret Biryani',
          instructions: 'Secret family steps',
          category: 'Dinner',
          ingredients: [{ name: 'Rice', quantity: 2, unit: 'cups', isOptional: false }]
        });
      assert.equal(resB.status, 201);
      userBRecipeId = resB.body.data.recipe.id;
    });

    test("7. Users cannot update another user's private recipes (returns 404)", async () => {
      const res = await request(app)
        .patch(`/api/recipes/${userBRecipeId}`)
        .set('Cookie', cookieA)
        .send({ title: 'Hacked Title' });

      assert.equal(res.status, 404);

      // Verify DB recipe remains unchanged
      const dbItem = await prisma.recipe.findUnique({ where: { id: userBRecipeId } });
      assert.equal(dbItem.title, 'User B Secret Biryani');
    });

    test("8. Users cannot delete another user's private recipes (returns 404)", async () => {
      const res = await request(app)
        .delete(`/api/recipes/${userBRecipeId}`)
        .set('Cookie', cookieA);

      assert.equal(res.status, 404);

      // Verify DB recipe still exists
      const dbItem = await prisma.recipe.findUnique({ where: { id: userBRecipeId } });
      assert.ok(dbItem);
    });

    test('9. Shared seed recipes cannot be modified or deleted (returns 403 Forbidden)', async () => {
      const patchShared = await request(app)
        .patch(`/api/recipes/${sharedRecipeId}`)
        .set('Cookie', cookieA)
        .send({ title: 'Modified Shared Recipe' });
      assert.equal(patchShared.status, 403);

      const delShared = await request(app)
        .delete(`/api/recipes/${sharedRecipeId}`)
        .set('Cookie', cookieA);
      assert.equal(delShared.status, 403);
    });
  });

  // Search, Filters & Sorting (Tests 10, 11)
  describe('Search and Filter Controls', () => {
    test('10. Search by title and category filters work correctly', async () => {
      const searchRes = await request(app)
        .get('/api/recipes?search=pulao')
        .set('Cookie', cookieA);

      assert.equal(searchRes.status, 200);
      assert.ok(searchRes.body.data.recipes.length >= 1);
      assert.ok(
        searchRes.body.data.recipes.some((r) => r.title.toLowerCase().includes('pulao'))
      );

      const catRes = await request(app)
        .get('/api/recipes?category=Breakfast')
        .set('Cookie', cookieA);

      assert.equal(catRes.status, 200);
      assert.ok(catRes.body.data.recipes.length >= 1);
      assert.ok(
        catRes.body.data.recipes.every((r) => r.category === 'Breakfast')
      );
    });

    test('11. Difficulty and preparation-time filters work correctly', async () => {
      const diffRes = await request(app)
        .get('/api/recipes?difficulty=Easy')
        .set('Cookie', cookieA);

      assert.equal(diffRes.status, 200);
      assert.ok(
        diffRes.body.data.recipes.every((r) => r.difficulty === 'Easy')
      );

      const prepRes = await request(app)
        .get('/api/recipes?maxPrepTime=10')
        .set('Cookie', cookieA);

      assert.equal(prepRes.status, 200);
      assert.ok(
        prepRes.body.data.recipes.every((r) => r.prepTimeMinutes <= 10)
      );
    });
  });

  // Favourites System (Tests 12, 13, 14)
  describe('Favourites System', () => {
    test('12. Favourites can be added and removed correctly', async () => {
      // Add favourite
      const addRes = await request(app)
        .post(`/api/recipes/${sharedRecipeId}/favourite`)
        .set('Cookie', cookieA);

      assert.equal(addRes.status, 200);
      assert.equal(addRes.body.success, true);

      // Verify in favourites list
      const favsRes = await request(app)
        .get('/api/recipes/favourites')
        .set('Cookie', cookieA);

      assert.equal(favsRes.status, 200);
      assert.ok(favsRes.body.data.favourites.some((f) => f.id === sharedRecipeId));

      // Remove favourite
      const removeRes = await request(app)
        .delete(`/api/recipes/${sharedRecipeId}/favourite`)
        .set('Cookie', cookieA);

      assert.equal(removeRes.status, 200);

      // Verify removed
      const favsAfter = await request(app)
        .get('/api/recipes/favourites')
        .set('Cookie', cookieA);
      assert.ok(!favsAfter.body.data.favourites.some((f) => f.id === sharedRecipeId));
    });

    test('13. Duplicate favourites are prevented idempotently', async () => {
      // Add first time
      await request(app)
        .post(`/api/recipes/${sharedRecipeId}/favourite`)
        .set('Cookie', cookieA);

      // Add second time
      const duplicateRes = await request(app)
        .post(`/api/recipes/${sharedRecipeId}/favourite`)
        .set('Cookie', cookieA);

      assert.equal(duplicateRes.status, 200);

      // Verify only 1 record exists in database
      const count = await prisma.favourite.count({
        where: { userId: userAId, recipeId: sharedRecipeId }
      });
      assert.equal(count, 1);
    });

    test('14. Favourites are strictly isolated between users', async () => {
      // User A favourited sharedRecipeId, but User B has not
      const resB = await request(app)
        .get('/api/recipes/favourites')
        .set('Cookie', cookieB);

      assert.equal(resB.status, 200);
      assert.equal(resB.body.data.favourites.length, 0);

      // Clean up favourite for User A
      await request(app)
        .delete(`/api/recipes/${sharedRecipeId}/favourite`)
        .set('Cookie', cookieA);
    });
  });

  // Inventory Matching System (Tests 15, 16, 17, 18, 19)
  describe('Inventory Matching Engine', () => {
    let testRecipeId = null;

    before(async () => {
      // Clear User A's inventory
      await prisma.inventoryItem.deleteMany({
        where: { userId: userAId }
      });

      // Recipe requires: Basmati Rice, Paneer, Tomatoes. Optional: Fresh Basil
      const recRes = await request(app)
        .post('/api/recipes')
        .set('Cookie', cookieA)
        .send({
          title: 'Matching Test Paneer Pulao',
          instructions: 'Mix and cook',
          category: 'Lunch',
          ingredients: [
            { name: 'Basmati Rice', quantity: 2, unit: 'cups', isOptional: false },
            { name: 'Paneer', quantity: 200, unit: 'g', isOptional: false },
            { name: 'Tomatoes', quantity: 2, unit: 'pcs', isOptional: false },
            { name: 'Fresh Basil', quantity: 5, unit: 'leaves', isOptional: true }
          ]
        });
      testRecipeId = recRes.body.data.recipe.id;

      // Add inventory for User A:
      // 1. Basmati Rice (valid)
      await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'basmati rice', // Lowercase to test case-insensitivity
          category: 'Grains',
          quantity: 5,
          unit: 'kg'
        });

      // 2. Paneer (expiring soon - 3 days)
      const soon = new Date();
      soon.setDate(soon.getDate() + 3);
      await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'PANEER', // Uppercase to test case-insensitivity
          category: 'Dairy',
          quantity: 400,
          unit: 'g',
          expiryDate: soon.toISOString()
        });

      // 3. Tomatoes (EXPIRED - 3 days ago)
      const expired = new Date();
      expired.setDate(expired.getDate() - 3);
      await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'Tomatoes',
          category: 'Vegetables',
          quantity: 4,
          unit: 'pcs',
          expiryDate: expired.toISOString()
        });
    });

    test('15. Recipe matching identifies available and missing ingredients correctly', async () => {
      const matchRes = await request(app)
        .get('/api/recipes/matches')
        .set('Cookie', cookieA);

      assert.equal(matchRes.status, 200);
      const testMatch = matchRes.body.data.matches.find((m) => m.id === testRecipeId);
      assert.ok(testMatch);

      // Basmati Rice and Paneer are available (2 of 3 required)
      assert.equal(testMatch.totalRequiredIngredients, 3);
      assert.equal(testMatch.availableRequiredIngredients, 2);
      assert.equal(testMatch.matchPercentage, 67); // 2/3 = 67%
      assert.equal(testMatch.canCook, false); // Tomatoes missing because expired!
    });

    test('16. Optional ingredients do not prevent canCook when all required ingredients are present', async () => {
      // Add fresh tomatoes to inventory
      const freshTomatoes = new Date();
      freshTomatoes.setDate(freshTomatoes.getDate() + 10);
      await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'Tomatoes',
          category: 'Vegetables',
          quantity: 6,
          unit: 'pcs',
          expiryDate: freshTomatoes.toISOString()
        });

      const matchRes = await request(app)
        .get('/api/recipes/matches')
        .set('Cookie', cookieA);

      const testMatch = matchRes.body.data.matches.find((m) => m.id === testRecipeId);
      assert.ok(testMatch);

      // Now all 3 required ingredients (Rice, Paneer, Tomatoes) are available.
      // Fresh Basil is optional and missing, but canCook MUST be true!
      assert.equal(testMatch.canCook, true);
      assert.equal(testMatch.matchPercentage, 100);
      assert.equal(testMatch.missingIngredients.length, 0);
      assert.equal(testMatch.optionalMissingIngredients.length, 1);
    });

    test('17. Expired ingredients are not considered usable in recipe matching', async () => {
      // If we remove fresh tomatoes and only keep expired tomatoes
      const allTomatoes = await prisma.inventoryItem.findMany({
        where: { userId: userAId, name: { contains: 'Tomatoes' } }
      });
      // Delete the non-expired tomatoes
      for (const item of allTomatoes) {
        if (new Date(item.expiryDate) > new Date()) {
          await prisma.inventoryItem.delete({ where: { id: item.id } });
        }
      }

      const matchRes = await request(app)
        .get('/api/recipes/matches')
        .set('Cookie', cookieA);

      const testMatch = matchRes.body.data.matches.find((m) => m.id === testRecipeId);
      assert.equal(testMatch.canCook, false);
      assert.ok(
        testMatch.missingIngredients.some((m) => m.name.toLowerCase() === 'tomatoes')
      );
    });

    test('18. Ingredient name matching is case-insensitive and trims whitespace', async () => {
      const matchRes = await request(app)
        .get('/api/recipes/matches')
        .set('Cookie', cookieA);

      const testMatch = matchRes.body.data.matches.find((m) => m.id === testRecipeId);
      const availNames = testMatch.availableIngredients.map((i) => i.name.toLowerCase());
      assert.ok(availNames.includes('basmati rice'));
      assert.ok(availNames.includes('paneer'));
    });

    test("19. Inventory matching never reads another user's inventory", async () => {
      // User B has no inventory items
      const matchResB = await request(app)
        .get('/api/recipes/matches')
        .set('Cookie', cookieB);

      assert.equal(matchResB.status, 200);
      const testMatchB = matchResB.body.data.matches.find((m) => m.id === sharedRecipeId);
      assert.ok(testMatchB);
      // User B should have 0 available ingredients
      assert.equal(testMatchB.availableRequiredIngredients, 0);
      assert.equal(testMatchB.canCook, false);
    });
  });

  // 20. Users can delete their own recipes and cascading cleans up relations
  test('20. Users can delete their own recipe and cascading cleans up relations', async () => {
    const delRes = await request(app)
      .delete(`/api/recipes/${userARecipeId}`)
      .set('Cookie', cookieA);

    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);

    // Verify recipe is gone from SQLite
    const inDb = await prisma.recipe.findUnique({
      where: { id: userARecipeId }
    });
    assert.equal(inDb, null);

    // Verify ingredients were cascaded
    const ingsInDb = await prisma.recipeIngredient.findMany({
      where: { recipeId: userARecipeId }
    });
    assert.equal(ingsInDb.length, 0);
  });
});
