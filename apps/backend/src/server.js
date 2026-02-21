const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
      console.log(`🌍 Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();