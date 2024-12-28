import { Keypair, PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';

export class WalletService {
  private wallets: Map<string, Keypair> = new Map();

  generateWallet(): { publicKey: string; secretKey: string } {
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toString();
    const secretKey = Buffer.from(wallet.secretKey).toString('base64');
    
    this.wallets.set(publicKey, wallet);
    
    return {
      publicKey,
      secretKey,
    };
  }

  getWallet(publicKey: string): Keypair | undefined {
    return this.wallets.get(publicKey);
  }

  // TODO: Implement Doppler integration for secure key storage
  async storeWalletInDoppler(publicKey: string, secretKey: string) {
    // Implementation pending
  }
}

export const walletService = new WalletService();
