import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';

describe('Smart Rasoi Phase 2 - Authentication & User Profile Test Suite', () => {
  const testUser = {
    name: 'Chef Ananya',
    email: 'ananya@smartrasoi.test',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  let authCookie = null;
  let authToken = null;

  before(async () => {
    // Clean up any test records in the test database
    await prisma.user.deleteMany({
      where: { email: { contains: 'smartrasoi.test' } }
    });
  });

  after(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'smartrasoi.test' } }
    });
    await prisma.$disconnect();
  });

  describe('1. Registration Endpoints', () => {
    test('Valid registration succeeds and returns safe user fields with HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.user);
      assert.equal(res.body.data.user.name, testUser.name);
      assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
      assert.ok(res.body.data.user.id);

      // Verify passwordHash is NEVER leaked
      assert.equal(res.body.data.user.passwordHash, undefined);
      assert.equal(res.body.data.user.password, undefined);

      // Verify HttpOnly cookie header was set
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies && cookies.length > 0);
      assert.ok(cookies[0].includes('smart_rasoi_auth_token'));
      assert.ok(cookies[0].toLowerCase().includes('httponly'));

      // Save cookie for subsequent session tests
      authCookie = cookies[0];
    });

    test('Password is stored in SQLite as a bcrypt hash, not plaintext', async () => {
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() }
      });

      assert.ok(dbUser);
      assert.notEqual(dbUser.passwordHash, testUser.password);
      assert.ok(dbUser.passwordHash.startsWith('$2'), 'Password should be bcrypt hash starting with $2');
    });

    test('Duplicate email registration is rejected with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.toLowerCase().includes('already exists'));
    });

    test('Missing required fields are rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Incomplete User', email: 'incomplete@smartrasoi.test' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    test('Invalid email format is rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'Password123!',
          confirmPassword: 'Password123!'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    test('Password mismatch is rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mismatch User',
          email: 'mismatch@smartrasoi.test',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.toLowerCase().includes('match'));
    });

    test('Weak password (< 8 chars) is rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Password',
          email: 'short@smartrasoi.test',
          password: 'short',
          confirmPassword: 'short'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.toLowerCase().includes('8 characters'));
    });
  });

  describe('2. Login Endpoints', () => {
    test('Valid credentials succeed with 200, returns safe user and sets cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
      assert.equal(res.body.data.user.passwordHash, undefined);

      const cookies = res.headers['set-cookie'];
      assert.ok(cookies && cookies.length > 0);
      assert.ok(cookies[0].includes('smart_rasoi_auth_token'));
      assert.ok(cookies[0].toLowerCase().includes('httponly'));

      authCookie = cookies[0];
    });

    test('Invalid password is rejected with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Invalid email or password');
    });

    test('Unknown email is rejected with same generic 401 error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown-chef@smartrasoi.test',
          password: 'Password123!'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Invalid email or password');
    });

    test('Malformed/empty login payload is rejected with 400/401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      assert.ok(res.status === 400 || res.status === 401);
      assert.equal(res.body.success, false);
    });
  });

  describe('3. Session and Current User Endpoints', () => {
    test('Unauthenticated GET /api/auth/me is rejected with 401', async () => {
      const res = await request(app).get('/api/auth/me');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.toLowerCase().includes('authentication required'));
    });

    test('Authenticated GET /api/auth/me returns current user profile using cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
      assert.equal(res.body.data.user.passwordHash, undefined);
    });

    test('Invalid token in cookie is rejected with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'smart_rasoi_auth_token=invalid.tampered.token');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });

  describe('4. User Profile Endpoints', () => {
    test('Authenticated GET /api/users/me returns profile info', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Cookie', authCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.name, testUser.name);
      assert.equal(res.body.data.user.passwordHash, undefined);
    });

    test('Authenticated PATCH /api/users/me updates name successfully', async () => {
      const updatedName = 'Chef Ananya Sharma';
      const res = await request(app)
        .patch('/api/users/me')
        .set('Cookie', authCookie)
        .send({ name: updatedName });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.name, updatedName);

      // Verify in SQLite database
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() }
      });
      assert.equal(dbUser.name, updatedName);
    });

    test('PATCH /api/users/me ignores or disallows overriding id, email, or passwordHash', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Cookie', authCookie)
        .send({
          name: 'Chef Ananya Updated',
          email: 'hacked-email@smartrasoi.test',
          passwordHash: 'plaintext'
        });

      assert.equal(res.status, 200);
      // Email should remain unchanged
      assert.equal(res.body.data.user.email, testUser.email.toLowerCase());

      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() }
      });
      assert.equal(dbUser.email, testUser.email.toLowerCase());
      assert.ok(dbUser.passwordHash.startsWith('$2'));
    });
  });

  describe('5. Logout Endpoint', () => {
    test('POST /api/auth/logout successfully clears auth cookie', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Check cookie was cleared (Expires in past or empty)
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies);
      assert.ok(
        cookies[0].includes('smart_rasoi_auth_token=;') ||
        cookies[0].includes('Expires=Thu, 01 Jan 1970') ||
        cookies[0].includes('Max-Age=0')
      );
    });
  });
});
