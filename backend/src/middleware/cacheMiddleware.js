const redis = require('../config/redis');

/**
 * Express middleware to cache GET requests in Redis
 *
 * @param {Object} options
 * @param {number} [options.ttl=300] - Time to live in seconds
 * @param {string} [options.prefix='cache'] - Prefix for the Redis cache key
 * @param {Function} [options.keyGenerator] - Optional custom key generator (req) => string
 */
const cacheMiddleware = (options = {}) => {
  const ttl = options.ttl || parseInt(process.env.REDIS_DEFAULT_TTL, 10) || 300;
  const prefix = options.prefix || 'cache';

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Bypass cache if Redis is unavailable or disabled
    if (!redis.isRedisAvailable()) {
      return next();
    }

    const cacheKey = typeof options.keyGenerator === 'function'
      ? options.keyGenerator(req)
      : `${prefix}:${req.originalUrl}`;

    try {
      const cachedData = await redis.get(cacheKey);

      if (cachedData !== null && cachedData !== undefined) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.status(200).json(cachedData);
      }

      // Cache MISS - intercept res.json to cache response body
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Cache only 2xx responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.set(cacheKey, body, ttl).catch((err) => {
            console.warn(`[CacheMiddleware] Failed to store cache for ${cacheKey}:`, err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.warn(`[CacheMiddleware] Cache read error for ${cacheKey}:`, error.message);
      next();
    }
  };
};

module.exports = cacheMiddleware;
