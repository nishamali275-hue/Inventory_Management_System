const { createClient } = require('redis');

let client = null;
let isConnected = false;

const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

/**
 * Initialize and connect the Redis client.
 * Will not throw errors or crash the app if Redis is unreachable.
 */
const connectRedis = async () => {
  if (!REDIS_ENABLED) {
    console.log('[Redis] Caching is disabled via REDIS_ENABLED=false');
    return null;
  }

  try {
    client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            // Stop spamming reconnection attempts if Redis isn't running
            return false;
          }
          return Math.min(retries * 500, 2000);
        }
      }
    });

    client.on('connect', () => {
      console.log(`[Redis] Connected to server at ${REDIS_URL}`);
    });

    client.on('ready', () => {
      isConnected = true;
      console.log('[Redis] Client is ready for caching');
    });

    client.on('error', (err) => {
      isConnected = false;
      console.warn(`[Redis] Warning: ${err.message}`);
    });

    client.on('end', () => {
      isConnected = false;
      console.log('[Redis] Connection closed');
    });

    await client.connect();
    return client;
  } catch (err) {
    isConnected = false;
    console.warn(`[Redis] Could not connect to Redis at ${REDIS_URL}. Operating in fallback mode (no cache): ${err.message}`);
    return null;
  }
};

/**
 * Check if Redis is currently connected and operational
 */
const isRedisAvailable = () => {
  return isConnected && client && client.isOpen;
};

/**
 * Retrieve parsed JSON value from cache
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const get = async (key) => {
  if (!isRedisAvailable()) return null;
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Redis] Error fetching key "${key}":`, err.message);
    return null;
  }
};

/**
 * Store JSON value in cache with TTL
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - Expiration time in seconds (default: 300)
 * @returns {Promise<boolean>}
 */
const set = async (key, value, ttlSeconds = 300) => {
  if (!isRedisAvailable()) return false;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, serialized, { EX: ttlSeconds });
    } else {
      await client.set(key, serialized);
    }
    return true;
  } catch (err) {
    console.warn(`[Redis] Error setting key "${key}":`, err.message);
    return false;
  }
};

/**
 * Delete a specific key from cache
 * @param {string} key
 * @returns {Promise<boolean>}
 */
const del = async (key) => {
  if (!isRedisAvailable()) return false;
  try {
    await client.del(key);
    return true;
  } catch (err) {
    console.warn(`[Redis] Error deleting key "${key}":`, err.message);
    return false;
  }
};

/**
 * Delete all keys matching a pattern using non-blocking SCAN
 * @param {string} pattern - e.g. "products:*", "dashboard:*"
 * @returns {Promise<boolean>}
 */
const delByPattern = async (pattern) => {
  if (!isRedisAvailable()) return false;
  try {
    const keys = [];
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (err) {
    console.warn(`[Redis] Error deleting pattern "${pattern}":`, err.message);
    return false;
  }
};

/**
 * Flush all cache entries (useful for testing or full reset)
 */
const flushAll = async () => {
  if (!isRedisAvailable()) return false;
  try {
    await client.flushAll();
    return true;
  } catch (err) {
    console.warn('[Redis] Error flushing cache:', err.message);
    return false;
  }
};

/**
 * Disconnect the client cleanly
 */
const disconnectRedis = async () => {
  if (client && client.isOpen) {
    try {
      await client.quit();
    } catch (err) {
      console.warn('[Redis] Error during disconnect:', err.message);
    }
    isConnected = false;
  }
};

/**
 * Get raw client instance
 */
const getClient = () => client;

/**
 * Set client instance (primarily for unit testing and mocks)
 */
const setClient = (mockClient) => {
  client = mockClient;
  isConnected = !!(mockClient && mockClient.isOpen);
};

module.exports = {
  connectRedis,
  isRedisAvailable,
  get,
  set,
  del,
  delByPattern,
  flushAll,
  disconnectRedis,
  getClient,
  setClient
};
