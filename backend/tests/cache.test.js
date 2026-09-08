const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const redis = require('../src/config/redis');
const {
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateInventoryCache,
  invalidateDashboardCache,
  invalidateAllCache
} = require('../src/utils/cacheInvalidator');

let adminToken;

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory_db';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Attempt Redis connection for testing (will fall back gracefully if no Redis server)
  await redis.connectRedis();

  // Login as admin
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@example.com',
      password: 'Admin@123'
    });

  adminToken = res.body.token;
});

afterAll(async () => {
  await redis.disconnectRedis();
  await mongoose.connection.close();
});

describe('Redis Caching & Graceful Degradation Test Suite', () => {
  test('Health check should report both database and redis status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.services).toBeDefined();
    expect(res.body.services.database).toBe('connected');
    expect(['connected', 'disconnected', 'disabled']).toContain(res.body.services.redis);
  });

  test('Redis helper functions should handle missing server gracefully without crashing', async () => {
    // These calls must never throw errors regardless of whether Redis is connected or offline
    const testKey = 'test:jest:key';
    const setResult = await redis.set(testKey, { test: true }, 60);
    const getResult = await redis.get(testKey);
    const delResult = await redis.del(testKey);
    const patternResult = await redis.delByPattern('test:*');

    if (redis.isRedisAvailable()) {
      expect(setResult).toBe(true);
      expect(getResult).toEqual({ test: true });
      expect(delResult).toBe(true);
      expect(patternResult).toBe(true);
    } else {
      expect(setResult).toBe(false);
      expect(getResult).toBeNull();
      expect(delResult).toBe(false);
      expect(patternResult).toBe(false);
    }
  });

  test('Cache invalidators should run safely without throwing exceptions', async () => {
    await expect(invalidateProductCache()).resolves.not.toThrow();
    await expect(invalidateCategoryCache()).resolves.not.toThrow();
    await expect(invalidateInventoryCache()).resolves.not.toThrow();
    await expect(invalidateDashboardCache()).resolves.not.toThrow();
    await expect(invalidateAllCache()).resolves.not.toThrow();
  });

  test('GET /api/dashboard/stats should succeed and handle cache headers', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis).toBeDefined();

    if (redis.isRedisAvailable()) {
      // If redis is running, subsequent request should return X-Cache: HIT
      const res2 = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
    }
  });

  test('GET /api/categories should succeed and handle cache headers', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    if (redis.isRedisAvailable()) {
      const res2 = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
    }
  });

  test('GET /api/products should succeed and handle cache headers', async () => {
    const res = await request(app)
      .get('/api/products?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    if (redis.isRedisAvailable()) {
      const res2 = await request(app)
        .get('/api/products?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
    }
  });

  test('Stock mutation should invalidate cached product and dashboard data', async () => {
    // Get sample product
    const prodRes = await request(app)
      .get('/api/products?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(prodRes.statusCode).toBe(200);
    const product = prodRes.body.products[0];
    expect(product).toBeDefined();

    // Perform stock-in
    const stockInRes = await request(app)
      .post('/api/inventory/stock-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId: product._id,
        quantity: 5,
        reason: 'Cache invalidation test replenishment'
      });

    expect(stockInRes.statusCode).toBe(200);
    expect(stockInRes.body.success).toBe(true);

    // If redis was available, the next dashboard stats request should be a MISS due to invalidation
    if (redis.isRedisAvailable()) {
      const dashboardRes = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(dashboardRes.statusCode).toBe(200);
      expect(dashboardRes.headers['x-cache']).toBe('MISS');
    }
  });

  describe('Cache Middleware Behavior with Mocked Redis State', () => {
    let isAvailableSpy;
    let getSpy;
    let setSpy;

    beforeEach(() => {
      isAvailableSpy = jest.spyOn(redis, 'isRedisAvailable');
      getSpy = jest.spyOn(redis, 'get');
      setSpy = jest.spyOn(redis, 'set');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('Middleware returns X-Cache: HIT and cached payload when item is in cache', async () => {
      isAvailableSpy.mockReturnValue(true);
      const fakeData = { success: true, fake: 'cached-stats', data: { kpis: { totalProducts: 99 } } };
      getSpy.mockResolvedValue(fakeData);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['x-cache']).toBe('HIT');
      expect(res.body.fake).toBe('cached-stats');
      expect(res.body.data.kpis.totalProducts).toBe(99);
    });

    test('Middleware returns X-Cache: MISS and caches response when cache misses', async () => {
      isAvailableSpy.mockReturnValue(true);
      getSpy.mockResolvedValue(null);
      setSpy.mockResolvedValue(true);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['x-cache']).toBe('MISS');
      expect(setSpy).toHaveBeenCalledWith(
        expect.stringContaining('dashboard:/api/dashboard/stats'),
        expect.objectContaining({ success: true }),
        60
      );
    });

    test('delByPattern calls Redis scanIterator and del for matching keys', async () => {
      const mockDel = jest.fn().mockResolvedValue(1);
      const mockScanIterator = jest.fn().mockImplementation(async function* () {
        yield 'products:list:1';
        yield 'products:list:2';
      });

      const mockClient = {
        isOpen: true,
        scanIterator: mockScanIterator,
        del: mockDel
      };

      const originalClient = redis.getClient();
      redis.setClient(mockClient);

      try {
        const result = await redis.delByPattern('products:*');
        expect(result).toBe(true);
        expect(mockDel).toHaveBeenCalledWith(['products:list:1', 'products:list:2']);
      } finally {
        redis.setClient(originalClient);
      }
    });
  });
});
