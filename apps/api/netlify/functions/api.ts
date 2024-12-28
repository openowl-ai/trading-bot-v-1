import { HandlerEvent, HandlerContext } from "@netlify/functions";
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { setupTradeRoutes } from '../../src/routes/trades';
import { setupTelegramBot } from '../../src/services/telegram';
import { CONFIG } from '../../src/config';

// Create Fastify instance
const app = Fastify({
  logger: true
});

// Register plugins and routes
app.register(cors, { origin: true });
setupTradeRoutes(app);
setupTelegramBot();

// Serverless handler
export async function handler(event: HandlerEvent, context: HandlerContext) {
  await app.ready();

  const payload = {
    method: event.httpMethod,
    url: event.path,
    query: event.queryStringParameters,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : undefined,
  };

  try {
    const response = await app.inject(payload);
    return {
      statusCode: response.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: response.payload,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}
