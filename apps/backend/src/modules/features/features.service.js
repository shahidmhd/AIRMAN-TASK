// ── features.service.js ───────────────────────────────────────────
const prisma = require('../../config/db');
const cache  = require('../../services/cache.service');

const FLAG_KEYS = {
  QUIZ_ATTEMPTS:       'quiz_attempts',
  BOOKING_SYSTEM:      'booking_system',
  ADVANCED_REPORTING:  'advanced_reporting',
  BULK_ENROLLMENT:     'bulk_enrollment',
};

const getFlags = async (tenantId) => {
  const cacheKey = cache.KEYS.featureFlags(tenantId);
  const cached   = await cache.get(cacheKey);
  if (cached) return cached;

  const flags = await prisma.featureFlag.findMany({ where: { tenantId } });
  const flagMap = flags.reduce((acc, f) => {
    acc[f.key] = { enabled: f.enabled, roles: f.roles };
    return acc;
  }, {});

  await cache.set(cacheKey, flagMap, 60);
  return flagMap;
};

const isEnabled = async (tenantId, key, userRole) => {
  const flags = await getFlags(tenantId);
  const flag  = flags[key];
  if (!flag || !flag.enabled) return false;
  if (flag.roles.length === 0) return true;
  return flag.roles.includes(userRole);
};

const setFlag = async (tenantId, key, enabled, roles = []) => {
  const flag = await prisma.featureFlag.upsert({
    where:  { tenantId_key: { tenantId, key } },
    update: { enabled, roles },
    create: { tenantId, key, enabled, roles },
  });
  await cache.del(cache.KEYS.featureFlags(tenantId));
  return flag;
};

module.exports = { getFlags, isEnabled, setFlag, FLAG_KEYS };