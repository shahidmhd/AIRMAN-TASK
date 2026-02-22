const redis = require('../config/redis');

const DEFAULT_TTL = 300; // 5 minutes

const get = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const set = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err.message);
  }
};

const del = async (key) => {
  try { await redis.del(key); } catch {/* ignore */}
};

const delPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {/* ignore */}
};

const KEYS = {
  courses:      (tenantId, page, search) => `courses:${tenantId}:${page}:${search}`,
  course:       (id)                     => `course:${id}`,
  instructors:  (tenantId)               => `instructors:${tenantId}`,
  users:        (tenantId, page)         => `users:${tenantId}:${page}`,
  featureFlags: (tenantId)               => `flags:${tenantId}`,
};

module.exports = { get, set, del, delPattern, KEYS };