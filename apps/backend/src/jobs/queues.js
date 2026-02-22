// ── queues.js ─────────────────────────────────────────────────────
const { Queue }  = require('bullmq');
const redis      = require('../config/redis');

const escalationQueue  = new Queue('escalation',  { connection: redis });
const notificationQueue = new Queue('notification', { connection: redis });

module.exports = { escalationQueue, notificationQueue };