require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const { errorHandler, notFound }     = require('./middleware/error.middleware');
const { correlationMiddleware }      = require('./middleware/correlation.middleware');
const setupSwagger                   = require('./config/swagger');

const authRoutes       = require('./modules/auth/auth.routes');
const usersRoutes      = require('./modules/users/users.routes');
const coursesRoutes    = require('./modules/courses/courses.routes');
const quizzesRoutes    = require('./modules/quizzes/quizzes.routes');
const schedulingRoutes = require('./modules/scheduling/scheduling.routes');
const auditRoutes      = require('./modules/audit/audit.routes');
const featuresRoutes   = require('./modules/features/features.routes');

const app = express();

app.use(correlationMiddleware);
app.use(cors({
  origin:         [process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-correlation-id'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger docs at /api/docs ─────────────────────────────────────
setupSwagger(app);

const authLimiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many auth requests' } });
const bookingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50,  message: { error: 'Too many booking requests' } });

app.use('/api/auth',       authLimiter,    authRoutes);
app.use('/api/users',                      usersRoutes);
app.use('/api/courses',                    coursesRoutes);
app.use('/api/quizzes',                    quizzesRoutes);
app.use('/api/scheduling', bookingLimiter, schedulingRoutes);
app.use('/api/audit',                      auditRoutes);
app.use('/api/features',                   featuresRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use(notFound);
app.use(errorHandler);

module.exports = app;