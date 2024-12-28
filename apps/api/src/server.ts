import Fastify from 'fastify';
import cors from '@fastify/cors';
import { CONFIG } from './config';
import { setupTelegramBot } from './services/telegram';
import { setupTradeRoutes } from './routes/trades';

const server = Fastify({
  logger: true
});

async function main() {
  // Register plugins
  await server.register(cors, {
    origin: true
  });

  // Setup routes
  setupTradeRoutes(server);

  // Initialize Telegram bot
  const bot = setupTelegramBot();

  try {
    await server.listen({ port: CONFIG.PORT });
    console.log(`Server listening on port ${CONFIG.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
