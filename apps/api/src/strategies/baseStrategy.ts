import { Connection, PublicKey } from '@solana/web3.js';
import { jupiterService } from '../services/jupiter';
import { monitoringService } from '../services/monitor';

export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  timestamp: number;
}

export abstract class BaseStrategy {
  protected connection: Connection;
  protected tradingPair: string;
  protected interval: string;
  
  constructor(tradingPair: string, interval: string = '5m') {
    this.tradingPair = tradingPair;
    this.interval = interval;
  }

  abstract analyze(data: any): Promise<TradeSignal>;

  protected async executeTrade(signal: TradeSignal, wallet: PublicKey) {
    try {
      if (signal.action === 'HOLD') return null;

      const route = await jupiterService.getRoutes({
        inputMint: signal.action === 'BUY' ? 'USDC' : this.tradingPair,
        outputMint: signal.action === 'BUY' ? this.tradingPair : 'USDC',
        amount: signal.action === 'BUY' ? signal.price : 1,
        slippageBps: 50
      });

      const result = await jupiterService.executeSwap(route, wallet);
      
      monitoringService.emit('trade:executed', {
        strategy: this.constructor.name,
        signal,
        result
      });

      return result;
    } catch (error) {
      monitoringService.emit('error', error);
      throw error;
    }
  }
}
