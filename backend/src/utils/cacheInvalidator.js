const redis = require('../config/redis');

/**
 * Cache invalidation helper functions to keep Redis cache synchronized with database mutations.
 */

/**
 * Invalidate product related cache entries and dashboard stats
 */
const invalidateProductCache = async () => {
  if (!redis.isRedisAvailable()) return;
  try {
    await Promise.all([
      redis.delByPattern('products:*'),
      redis.delByPattern('dashboard:*')
    ]);
  } catch (err) {
    console.warn('[CacheInvalidator] Error invalidating product cache:', err.message);
  }
};

/**
 * Invalidate category related cache entries, products, and dashboard stats
 */
const invalidateCategoryCache = async () => {
  if (!redis.isRedisAvailable()) return;
  try {
    await Promise.all([
      redis.delByPattern('categories:*'),
      redis.delByPattern('products:*'),
      redis.delByPattern('dashboard:*')
    ]);
  } catch (err) {
    console.warn('[CacheInvalidator] Error invalidating category cache:', err.message);
  }
};

/**
 * Invalidate inventory transaction cache, products cache, and dashboard stats
 */
const invalidateInventoryCache = async () => {
  if (!redis.isRedisAvailable()) return;
  try {
    await Promise.all([
      redis.delByPattern('inventory:*'),
      redis.delByPattern('products:*'),
      redis.delByPattern('dashboard:*')
    ]);
  } catch (err) {
    console.warn('[CacheInvalidator] Error invalidating inventory cache:', err.message);
  }
};

/**
 * Invalidate dashboard stats cache
 */
const invalidateDashboardCache = async () => {
  if (!redis.isRedisAvailable()) return;
  try {
    await redis.delByPattern('dashboard:*');
  } catch (err) {
    console.warn('[CacheInvalidator] Error invalidating dashboard cache:', err.message);
  }
};

/**
 * Invalidate all application cache
 */
const invalidateAllCache = async () => {
  if (!redis.isRedisAvailable()) return;
  try {
    await redis.flushAll();
  } catch (err) {
    console.warn('[CacheInvalidator] Error invalidating all cache:', err.message);
  }
};

module.exports = {
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateInventoryCache,
  invalidateDashboardCache,
  invalidateAllCache
};
