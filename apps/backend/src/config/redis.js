const { Redis } = require('ioredis');
const env = require('./env');

let redis;

try {
  if (env.REDIS_URL) {
    // Upstash or any Redis URL
    redis = new Redis(env.REDIS_URL, {
      tls: env.REDIS_URL.includes('upstash') ? {} : undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableReadyCheck: false,
    });
  } else {
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }

  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error', (err) => console.error('Redis error:', err.message));
} catch (err) {
  console.error('Redis init error:', err.message);
  // Fallback no-op redis for environments without Redis
  redis = {
    get: async () => null,
    set: async () => null,
    setex: async () => null,
    del: async () => null,
    keys: async () => [],
    ping: async () => 'PONG',
  };
}

module.exports = redis;