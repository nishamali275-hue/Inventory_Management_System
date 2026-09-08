require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis, disconnectRedis } = require('./config/redis');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and Redis, then start server
Promise.all([connectDB(), connectRedis()]).then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[Server] Inventory API running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });

  const gracefulShutdown = async () => {
    console.log('[Server] Gracefully shutting down...');
    await disconnectRedis();
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    disconnectRedis().finally(() => {
      server.close(() => process.exit(1));
    });
  });
});
