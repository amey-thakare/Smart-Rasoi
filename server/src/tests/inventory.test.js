import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';

describe('Smart Rasoi Phase 3 - Inventory Management Test Suite', () => {
  const userAData = {
    name: 'Chef Ananya User A',
    email: 'ananya.inventory.a@inventory.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const userBData = {
    name: 'Chef Vikram User B',
    email: 'vikram.inventory.b@inventory.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  let cookieA = null;
  let userAId = null;
  let cookieB = null;
  let userBId = null;

  before(async () => {
    // Clean up any existing test records in isolated test SQLite DB
    await prisma.inventoryItem.deleteMany({
      where: {
        user: {
          email: { contains: 'inventory.test' }
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { contains: 'inventory.test' }
      }
    });

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
    // Clean up all test records
    await prisma.inventoryItem.deleteMany({
      where: {
        user: {
          email: { contains: 'inventory.test' }
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { contains: 'inventory.test' }
      }
    });

    await prisma.$disconnect();
  });

  // 1. Authenticated item creation succeeds
  test('1. Authenticated item creation succeeds and scopes to current user', async () => {
    const payload = {
      name: 'Basmati Rice',
      category: 'Grains',
      quantity: 5,
      unit: 'kg',
      minimumQuantity: 2,
      purchaseDate: '2026-10-01T00:00:00.000Z',
      expiryDate: '2027-04-01T00:00:00.000Z',
      notes: 'Premium aged long-grain rice'
    };

    const res = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.item);
    assert.equal(res.body.data.item.name, 'Basmati Rice');
    assert.equal(res.body.data.item.category, 'Grains');
    assert.equal(res.body.data.item.quantity, 5);
    assert.equal(res.body.data.item.unit, 'kg');
    assert.equal(res.body.data.item.minimumQuantity, 2);
    assert.equal(res.body.data.item.notes, 'Premium aged long-grain rice');
    assert.equal(res.body.data.item.userId, userAId);
  });

  // 2. Unauthenticated requests are rejected
  test('2. Unauthenticated requests are rejected with 401 across all endpoints', async () => {
    const postRes = await request(app)
      .post('/api/inventory')
      .send({ name: 'Milk', category: 'Dairy', quantity: 1, unit: 'L' });
    assert.equal(postRes.status, 401);

    const getRes = await request(app)
      .get('/api/inventory');
    assert.equal(getRes.status, 401);

    const summaryRes = await request(app)
      .get('/api/inventory/summary');
    assert.equal(summaryRes.status, 401);

    const getOneRes = await request(app)
      .get('/api/inventory/item-12345');
    assert.equal(getOneRes.status, 401);

    const patchRes = await request(app)
      .patch('/api/inventory/item-12345')
      .send({ quantity: 2 });
    assert.equal(patchRes.status, 401);

    const deleteRes = await request(app)
      .delete('/api/inventory/item-12345');
    assert.equal(deleteRes.status, 401);
  });

  // 3. Missing required fields are rejected
  test('3. Missing or empty required fields are rejected with 400', async () => {
    // Missing name
    const resNoName = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({ category: 'Dairy', quantity: 1, unit: 'L' });
    assert.equal(resNoName.status, 400);

    // Whitespace only name
    const resEmptyName = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({ name: '   ', category: 'Dairy', quantity: 1, unit: 'L' });
    assert.equal(resEmptyName.status, 400);

    // Missing category
    const resNoCat = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({ name: 'Milk', quantity: 1, unit: 'L' });
    assert.equal(resNoCat.status, 400);

    // Missing quantity
    const resNoQty = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({ name: 'Milk', category: 'Dairy', unit: 'L' });
    assert.equal(resNoQty.status, 400);

    // Missing unit
    const resNoUnit = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({ name: 'Milk', category: 'Dairy', quantity: 1 });
    assert.equal(resNoUnit.status, 400);
  });

  // 4. Negative quantities are rejected
  test('4. Negative quantities or minimum quantities are rejected with 400', async () => {
    const resNegQty = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({ name: 'Milk', category: 'Dairy', quantity: -2, unit: 'L' });
    assert.equal(resNegQty.status, 400);
    assert.ok(resNegQty.body.message.toLowerCase().includes('quantity'));

    const resNegMinQty = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({ name: 'Milk', category: 'Dairy', quantity: 2, unit: 'L', minimumQuantity: -1 });
    assert.equal(resNegMinQty.status, 400);
  });

  // 5. Invalid dates are rejected
  test('5. Invalid date strings are rejected with 400', async () => {
    const resBadPurchase = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({
        name: 'Eggs',
        category: 'Dairy',
        quantity: 12,
        unit: 'pieces',
        purchaseDate: 'not-a-valid-date'
      });
    assert.equal(resBadPurchase.status, 400);

    const resBadExpiry = await request(app)
      .post('/api/inventory')
      .set('Cookie', cookieA)
      .send({
        name: 'Eggs',
        category: 'Dairy',
        quantity: 12,
        unit: 'pieces',
        expiryDate: 'invalid-expiry-date'
      });
    assert.equal(resBadExpiry.status, 400);
  });

  // 6. A user can list their own items
  test('6. A user can list their own items', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .set('Cookie', cookieA);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.items));
    assert.ok(res.body.data.items.length >= 1);
    assert.ok(res.body.data.items.every((it) => it.userId === userAId));
  });

  // IDOR Cross-User Protection (Tests 7, 8, 9)
  describe('IDOR & Cross-User Security', () => {
    let itemBId = null;

    before(async () => {
      // User B creates a private item
      const createRes = await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieB)
        .send({
          name: 'Organic Ghee',
          category: 'Dairy',
          quantity: 1,
          unit: 'L',
          minimumQuantity: 1,
          notes: 'User B private ghee'
        });
      assert.equal(createRes.status, 201);
      itemBId = createRes.body.data.item.id;
    });

    test("7. One user cannot read another user's items (returns 404)", async () => {
      // User A attempts to read User B's item by ID
      const res = await request(app)
        .get(`/api/inventory/${itemBId}`)
        .set('Cookie', cookieA);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    test("8. One user cannot update another user's items (returns 404 and prevents mutation)", async () => {
      // User A attempts to update User B's item
      const res = await request(app)
        .patch(`/api/inventory/${itemBId}`)
        .set('Cookie', cookieA)
        .send({ quantity: 99, notes: 'Hacked by user A' });

      assert.equal(res.status, 404);

      // Verify item in DB is untouched
      const itemInDb = await prisma.inventoryItem.findUnique({
        where: { id: itemBId }
      });
      assert.equal(itemInDb.quantity, 1);
      assert.equal(itemInDb.notes, 'User B private ghee');
    });

    test("9. One user cannot delete another user's items (returns 404 and preserves record)", async () => {
      // User A attempts to delete User B's item
      const res = await request(app)
        .delete(`/api/inventory/${itemBId}`)
        .set('Cookie', cookieA);

      assert.equal(res.status, 404);

      // Verify item in DB is still present
      const itemInDb = await prisma.inventoryItem.findUnique({
        where: { id: itemBId }
      });
      assert.ok(itemInDb);
      assert.equal(itemInDb.id, itemBId);
    });
  });

  // Search & Filtering Tests (Tests 10, 11, 12, 13, 14, 15)
  describe('Search, Filters, Sorting & Summary Statistics', () => {
    before(async () => {
      // Clear User A's items to have known deterministic dataset
      await prisma.inventoryItem.deleteMany({
        where: { userId: userAId }
      });

      const today = new Date();

      // Item 1: Expired item (expiry 3 days ago)
      const expiredDate = new Date(today);
      expiredDate.setDate(today.getDate() - 3);

      await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'Greek Yogurt',
          category: 'Dairy',
          quantity: 2,
          unit: 'packets',
          minimumQuantity: 1,
          expiryDate: expiredDate.toISOString()
        });

      // Item 2: Expiring soon (expiry 2 days from now), low stock (quantity 1 <= min 2)
      const expiringSoonDate = new Date(today);
      expiringSoonDate.setDate(today.getDate() + 2);

      await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'Fresh Spinach',
          category: 'Vegetables',
          quantity: 1,
          unit: 'packets',
          minimumQuantity: 2,
          expiryDate: expiringSoonDate.toISOString()
        });

      // Item 3: Fresh item (expiry 30 days from now), sufficient stock
      const freshDate = new Date(today);
      freshDate.setDate(today.getDate() + 30);

      await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'Toor Dal',
          category: 'Pulses',
          quantity: 4,
          unit: 'kg',
          minimumQuantity: 1,
          expiryDate: freshDate.toISOString()
        });

      // Item 4: No expiry date, low stock (quantity 0.5 <= min 1)
      await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'Turmeric Powder',
          category: 'Spices',
          quantity: 0.5,
          unit: 'kg',
          minimumQuantity: 1
        });
    });

    test('10. Search works correctly and case-insensitively', async () => {
      const res = await request(app)
        .get('/api/inventory?search=spinach')
        .set('Cookie', cookieA);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.items.length, 1);
      assert.equal(res.body.data.items[0].name, 'Fresh Spinach');

      // Upper case
      const resUpper = await request(app)
        .get('/api/inventory?search=YOGURT')
        .set('Cookie', cookieA);
      assert.equal(resUpper.status, 200);
      assert.equal(resUpper.body.data.items.length, 1);
      assert.equal(resUpper.body.data.items[0].name, 'Greek Yogurt');
    });

    test('11. Category filtering works correctly', async () => {
      const res = await request(app)
        .get('/api/inventory?category=Vegetables')
        .set('Cookie', cookieA);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.items.length, 1);
      assert.equal(res.body.data.items[0].category, 'Vegetables');

      const resPulses = await request(app)
        .get('/api/inventory?category=Pulses')
        .set('Cookie', cookieA);
      assert.equal(resPulses.status, 200);
      assert.equal(resPulses.body.data.items.length, 1);
      assert.equal(resPulses.body.data.items[0].category, 'Pulses');
    });

    test('12. Expiry filtering works for expired, expiring-soon, and fresh', async () => {
      const resExpired = await request(app)
        .get('/api/inventory?expiry=expired')
        .set('Cookie', cookieA);
      assert.equal(resExpired.status, 200);
      assert.equal(resExpired.body.data.items.length, 1);
      assert.equal(resExpired.body.data.items[0].name, 'Greek Yogurt');

      const resExpSoon = await request(app)
        .get('/api/inventory?expiry=expiring-soon')
        .set('Cookie', cookieA);
      assert.equal(resExpSoon.status, 200);
      assert.equal(resExpSoon.body.data.items.length, 1);
      assert.equal(resExpSoon.body.data.items[0].name, 'Fresh Spinach');
    });

    test('13. Low-stock filtering works (quantity <= minimumQuantity)', async () => {
      const res = await request(app)
        .get('/api/inventory?lowStock=true')
        .set('Cookie', cookieA);

      assert.equal(res.status, 200);
      // Fresh Spinach (1 <= 2) and Turmeric Powder (0.5 <= 1) are low stock
      assert.equal(res.body.data.items.length, 2);
      const names = res.body.data.items.map((i) => i.name);
      assert.ok(names.includes('Fresh Spinach'));
      assert.ok(names.includes('Turmeric Powder'));
    });

    test('14. Sorting works by name and quantity', async () => {
      const resNameAsc = await request(app)
        .get('/api/inventory?sortBy=name&sortOrder=asc')
        .set('Cookie', cookieA);
      assert.equal(resNameAsc.status, 200);
      const namesAsc = resNameAsc.body.data.items.map((i) => i.name);
      const sortedNames = [...namesAsc].sort((a, b) => a.localeCompare(b));
      assert.deepEqual(namesAsc, sortedNames);

      const resQtyDesc = await request(app)
        .get('/api/inventory?sortBy=quantity&sortOrder=desc')
        .set('Cookie', cookieA);
      assert.equal(resQtyDesc.status, 200);
      const qtys = resQtyDesc.body.data.items.map((i) => i.quantity);
      assert.equal(qtys[0], 4); // Toor Dal has 4
    });

    test('15. Summary counts are correct and isolated to authenticated user', async () => {
      const res = await request(app)
        .get('/api/inventory/summary')
        .set('Cookie', cookieA);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.totalItems, 4);
      assert.equal(res.body.data.expiredItems, 1);
      assert.equal(res.body.data.expiringSoonItems, 1);
      assert.equal(res.body.data.lowStockItems, 2);

      // Verify User B summary is completely independent
      const resB = await request(app)
        .get('/api/inventory/summary')
        .set('Cookie', cookieB);
      assert.equal(resB.status, 200);
      assert.equal(resB.body.data.totalItems, 1); // Only Organic Ghee
      assert.equal(resB.body.data.expiredItems, 0);
    });
  });

  // Persistence Tests (Tests 16 & 17)
  describe('Persistence in SQLite', () => {
    let testItemId = null;

    before(async () => {
      const createRes = await request(app)
        .post('/api/inventory')
        .set('Cookie', cookieA)
        .send({
          name: 'Coriander Seeds',
          category: 'Spices',
          quantity: 200,
          unit: 'g',
          minimumQuantity: 50,
          notes: 'Whole roasted'
        });
      testItemId = createRes.body.data.item.id;
    });

    test('16. Updates persist directly in SQLite database', async () => {
      const patchRes = await request(app)
        .patch(`/api/inventory/${testItemId}`)
        .set('Cookie', cookieA)
        .send({
          quantity: 350,
          notes: 'Refilled freshly roasted batch'
        });

      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.body.data.item.quantity, 350);
      assert.equal(patchRes.body.data.item.notes, 'Refilled freshly roasted batch');

      // Verify directly via Prisma in SQLite
      const inDb = await prisma.inventoryItem.findUnique({
        where: { id: testItemId }
      });
      assert.ok(inDb);
      assert.equal(inDb.quantity, 350);
      assert.equal(inDb.notes, 'Refilled freshly roasted batch');
    });

    test('17. Deletions persist directly in SQLite database', async () => {
      const delRes = await request(app)
        .delete(`/api/inventory/${testItemId}`)
        .set('Cookie', cookieA);

      assert.equal(delRes.status, 200);
      assert.equal(delRes.body.success, true);

      // Verify directly in SQLite
      const inDb = await prisma.inventoryItem.findUnique({
        where: { id: testItemId }
      });
      assert.equal(inDb, null);

      // Verify endpoint returns 404
      const getRes = await request(app)
        .get(`/api/inventory/${testItemId}`)
        .set('Cookie', cookieA);
      assert.equal(getRes.status, 404);
    });
  });
});
