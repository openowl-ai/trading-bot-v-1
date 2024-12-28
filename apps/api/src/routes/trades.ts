import { FastifyInstance } from 'fastify';
import { jupiterService } from '../services/jupiter';
import { walletService } from '../services/wallet';

interface TradeSignal {
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  amount: number;
}

export function setupTradeRoutes(server: FastifyInstance) {
  // TradingView webhook endpoint
  server.post('/webhook/tradingview', async (request, reply) => {
    try {
      const signal = request.body as TradeSignal;
      
      // TODO: Validate webhook signature
      
      // Process trade signal
      // This is a placeholder implementation
      console.log('Received trade signal:', signal);
      
      return { success: true, message: 'Signal received' };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return reply.code(500).send({ error: 'Failed to process trade signal' });
    }
  });

  // Generate new wallet
  server.post('/wallet/generate', async (request, reply) => {
    try {
      const wallet = walletService.generateWallet();
      return { success: true, wallet: { publicKey: wallet.publicKey } };
    } catch (error) {
      console.error('Error generating wallet:', error);
      return reply.code(500).send({ error: 'Failed to generate wallet' });
    }
  });

  // Get swap route
  server.post('/trade/route', async (request, reply) => {
    try {
      const { inputMint, outputMint, amount } = request.body as any;
      const routes = await jupiterService.getRoutes({
        inputMint,
        outputMint,
        amount,
        slippageBps: 50, // 0.5% slippage
      });
      return { success: true, routes };
    } catch (error) {
      console.error('Error getting route:', error);
      return reply.code(500).send({ error: 'Failed to get route' });
    }
  });
}
