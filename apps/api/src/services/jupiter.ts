import { Connection, PublicKey } from '@solana/web3.js';
import { Jupiter } from '@jup-ag/core';
import { CONFIG } from '../config';

export class JupiterService {
  private connection: Connection;
  private jupiter: Jupiter | null = null;

  constructor() {
    this.connection = new Connection(CONFIG.HELIUS_RPC_URL);
  }

  async initialize() {
    if (!this.jupiter) {
      this.jupiter = await Jupiter.load({
        connection: this.connection,
        cluster: 'mainnet-beta',
        userPublicKey: new PublicKey('11111111111111111111111111111111'), // Default, will be replaced with actual wallet
      });
    }
    return this.jupiter;
  }

  async getRoutes(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
  }) {
    const jupiter = await this.initialize();
    return await jupiter.computeRoutes(params);
  }

  async executeSwap(routeInfo: any, userPublicKey: PublicKey) {
    const jupiter = await this.initialize();
    try {
      const { transactions } = await jupiter.exchange({
        routeInfo,
        userPublicKey,
      });
      
      // Return unsigned transaction
      return transactions;
    } catch (error) {
      console.error('Swap execution failed:', error);
      throw error;
    }
  }
}

export const jupiterService = new JupiterService();
