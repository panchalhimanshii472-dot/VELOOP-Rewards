const env = require('./config/env');
const { connectDatabase } = require('./config/db');
const { ensureDefaultStreakSetup } = require('./services/reward.service');
const createApp = require('./app');

async function startServer() {
  await connectDatabase(env.mongoUri);
  await ensureDefaultStreakSetup();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`VELoop Daily Streak API running on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start VELoop Daily Streak API:', err.message);
  process.exit(1);
});

