import { config } from 'dotenv';
config();

export const CONFIG = {
  HELIUS_RPC_URL: process.env.HELIUS_RPC_URL || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  DOPPLER_TOKEN: process.env.DOPPLER_TOKEN || '',
  DOPPLER_PROJECT: process.env.DOPPLER_PROJECT || '',
  DOPPLER_CONFIG: process.env.DOPPLER_CONFIG || '',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  AUTHORIZED_TELEGRAM_USERS: process.env.AUTHORIZED_TELEGRAM_USERS || '',
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development'
};
