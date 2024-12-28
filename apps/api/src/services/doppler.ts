import { DopplerSDK } from '@dopplerhq/node-sdk';
import { CONFIG } from '../config';

export class DopplerService {
  private doppler: DopplerSDK;

  constructor() {
    this.doppler = new DopplerSDK(CONFIG.DOPPLER_TOKEN);
  }

  async storeWallet(name: string, publicKey: string, secretKey: string) {
    try {
      await this.doppler.secrets.update({
        project: CONFIG.DOPPLER_PROJECT,
        config: CONFIG.DOPPLER_CONFIG,
        secrets: {
          [`WALLET_${name}_PUBLIC_KEY`]: publicKey,
          [`WALLET_${name}_SECRET_KEY`]: secretKey,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to store wallet in Doppler:', error);
      throw new Error('Failed to store wallet securely');
    }
  }

  async getWallet(name: string) {
    try {
      const secrets = await this.doppler.secrets.get({
        project: CONFIG.DOPPLER_PROJECT,
        config: CONFIG.DOPPLER_CONFIG,
      });
      
      return {
        publicKey: secrets[`WALLET_${name}_PUBLIC_KEY`],
        secretKey: secrets[`WALLET_${name}_SECRET_KEY`],
      };
    } catch (error) {
      console.error('Failed to retrieve wallet from Doppler:', error);
      throw new Error('Failed to retrieve wallet');
    }
  }
}

export const dopplerService = new DopplerService();
