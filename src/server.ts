import { createApp } from './app.js';
import { env } from './config/env.js';
import { ensureDatabaseExists } from './config/database.js';
import { syncDatabase, sequelize } from './models/index.js';

async function bootstrap() {
  console.log(' Initializing Crescent Wealth Management System Core Backend...');

  try {
    // 1. Verify or create PostgreSQL database
    await ensureDatabaseExists();

    // 2. Authenticate & synchronize Sequelize models
    await syncDatabase(true);

    // 3. Initialize Express application
    const app = createApp();

    // 4. Start HTTP Server
    const server = app.listen(env.port, () => {
      console.log(`\n======================================================`);
      console.log(` Crescent Wealth Core Backend API is running!`);
      console.log(` Environment: ${env.nodeEnv}`);
      console.log(` API Base URL: http://localhost:${env.port}/api/v1`);
      console.log(` Health Check: http://localhost:${env.port}/api/v1/health`);
      console.log(` API Logs:    http://localhost:${env.port}/api/v1/api-logs`);
      console.log(`======================================================\n`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log(' Database connection closed safely.');
          process.exit(0);
        } catch (err) {
          console.error('Error during database disconnect:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(' Fatal error during backend bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();

