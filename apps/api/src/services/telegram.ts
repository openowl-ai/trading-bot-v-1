import { Telegraf, Context } from 'telegraf';
import { CONFIG } from '../config';
import { walletService } from './wallet';
import { dopplerService } from './doppler';
import { jupiterService } from './jupiter';

export class TelegramBotService {
  private bot: Telegraf;
  private authorizedUsers: Set<number>;

  constructor() {
    this.bot = new Telegraf(CONFIG.TELEGRAM_BOT_TOKEN);
    this.authorizedUsers = new Set(CONFIG.AUTHORIZED_TELEGRAM_USERS.split(',').map(Number));
    this.setupCommands();
  }

  private isAuthorized(ctx: Context): boolean {
    const userId = ctx.from?.id;
    return userId ? this.authorizedUsers.has(userId) : false;
  }

  private setupCommands() {
    // Authorization middleware
    this.bot.use((ctx, next) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('Unauthorized access');
      }
      return next();
    });

    // Start command
    this.bot.command('start', (ctx) => {
      ctx.reply(
        'Welcome to Solana Trading Bot!\n\n' +
        'Available commands:\n' +
        '/status - Check bot status\n' +
        '/generate_wallet - Generate new wallet\n' +
        '/balances - Check wallet balances\n' +
        '/trades - Recent trade history'
      );
    });

    // Generate wallet
    this.bot.command('generate_wallet', async (ctx) => {
      try {
        const wallet = await walletService.generateWallet();
        await dopplerService.storeWallet(
          `telegram_${ctx.from.id}`,
          wallet.publicKey,
          wallet.secretKey
        );
        ctx.reply(`New wallet generated!\nPublic Key: ${wallet.publicKey}`);
      } catch (error) {
        ctx.reply('Failed to generate wallet');
      }
    });

    // Status command
    this.bot.command('status', async (ctx) => {
      const status = await jupiterService.getStatus();
      ctx.reply(
        '🤖 Bot Status:\n\n' +
        `Status: ${status.isOperational ? '✅ Operational' : '❌ Down'}\n` +
        `Active Trades: ${status.activeTrades}\n` +
        `24h Volume: ${status.volume24h} SOL`
      );
    });

    // Balances command
    this.bot.command('balances', async (ctx) => {
      try {
        const balances = await walletService.getBalances();
        const message = Object.entries(balances)
          .map(([token, amount]) => `${token}: ${amount}`)
          .join('\n');
        ctx.reply(`💰 Wallet Balances:\n\n${message}`);
      } catch (error) {
        ctx.reply('Failed to fetch balances');
      }
    });

    // Recent trades
    this.bot.command('trades', async (ctx) => {
      try {
        const trades = await jupiterService.getRecentTrades();
        const message = trades
          .map(t => `${t.type} ${t.amount} ${t.token} @ ${t.price}`)
          .join('\n');
        ctx.reply(`Recent Trades:\n\n${message}`);
      } catch (error) {
        ctx.reply('Failed to fetch recent trades');
      }
    });
  }

  start() {
    this.bot.launch();
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

export const telegramBot = new TelegramBotService();
