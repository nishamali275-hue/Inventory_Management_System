const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

let adminToken;
let sampleProductId;

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory_db';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Login as admin to get token
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@example.com',
      password: 'Admin@123'
    });

  adminToken = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Inventory Management System Backend Test Suite', () => {
  test('Health Check endpoint should return UP status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  test('Admin Login should authenticate successfully and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  test('Invalid login should be rejected with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'WrongPassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Protected routes should block requests without token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(401);
  });

  test('Get categories should return list with product counts', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.categories.length).toBeGreaterThanOrEqual(5);
  });

  test('Get products with pagination, search, and sorting', async () => {
    const res = await request(app)
      .get('/api/products?page=1&limit=10&sortBy=name&sortOrder=asc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
    sampleProductId = res.body.products[0]._id;
  });

  test('Search products by keyword', async () => {
    const res = await request(app)
      .get('/api/products?search=Dell')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.products.some((p) => p.name.includes('Dell'))).toBe(true);
  });

  test('Generate QR Code for product', async () => {
    const res = await request(app)
      .get(`/api/products/${sampleProductId}/qrcode`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.qrCode).toContain('data:image/png;base64');
  });

  test('Stock Out should strictly prevent negative inventory', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId: sampleProductId,
        quantity: 999999, // Exceeds any realistic quantity
        reason: 'Attempt invalid excessive reduction'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Negative inventory is prevented');
  });

  test('Dashboard KPIs and Analytics should return full aggregate data', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis.totalProducts).toBeGreaterThanOrEqual(15);
    expect(res.body.data.stockStatusDistribution.length).toBe(3);
  });
});
