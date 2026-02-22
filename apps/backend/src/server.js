require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');

const PORT = env.PORT || 4000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start workers only if Redis is available
    try {
      require('./jobs/escalation.worker');
      console.log('✅ Background workers started');
    } catch (err) {
      console.warn('⚠️  Background workers skipped:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();