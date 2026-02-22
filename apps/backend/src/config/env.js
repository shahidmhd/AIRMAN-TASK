require('dotenv').config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  DATABASE_URL:          process.env.DATABASE_URL,
  JWT_ACCESS_SECRET:     process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET:    process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
  JWT_REFRESH_EXPIRES_IN:process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  NODE_ENV:              process.env.NODE_ENV               || 'development',
  PORT:                  parseInt(process.env.PORT)          || 4000,
  FRONTEND_URL:          process.env.FRONTEND_URL            || 'http://localhost:3000',
  REDIS_URL:             process.env.REDIS_URL               || null,
  REDIS_HOST:            process.env.REDIS_HOST              || 'localhost',
  REDIS_PORT:            parseInt(process.env.REDIS_PORT)    || 6379,
  ESCALATION_HOURS:      parseInt(process.env.ESCALATION_HOURS) || 2,
};