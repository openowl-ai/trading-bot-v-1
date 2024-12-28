import { BaseStrategy } from '../strategies/baseStrategy';
import { PositionManager } from './position';
import { RiskManager } from './risk';

interface BacktestResult {
  trades: Trade[];
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
  };
  equity: number[];
}

interface Trade {
  entry: { price: number; timestamp: number };
  exit: { price: number; timestamp: number };
  pnl: number;
  type: 'LONG' | 'SHORT';
}

export class BacktestService {
  private strategy: BaseStrategy;
  private positionManager: PositionManager;
  private riskManager: RiskManager;
  
  constructor(
    strategy: BaseStrategy,
    positionManager: PositionManager,
    riskManager: RiskManager
  ) {
    this.strategy = strategy;
    this.positionManager = positionManager;
    this.riskManager = riskManager;
  }

  async runBacktest(
    historicalData: any[],
    initialCapital: number,
    startDate: Date,
    endDate: Date
  ): Promise<BacktestResult> {
    let equity = [initialCapital];
    let trades: Trade[] = [];
    let currentPosition: any = null;
    let capital = initialCapital;

    const filteredData = historicalData.filter(
      d => new Date(d.timestamp) >= startDate && new Date(d.timestamp) <= endDate
    );

    for (let i = 0; i < filteredData.length; i++) {
      const candle = filteredData[i];
      const signal = await this.strategy.analyze(
        historicalData.slice(Math.max(0, i - 100), i + 1)
      );

      // Risk check before any trade
      const riskParams = this.riskManager.evaluateRisk({
        capital,
        signal,
        currentPosition,
        marketData: candle
      });

      if (!riskParams.allowTrade) continue;

      // Position sizing
      const positionSize = this.positionManager.calculatePositionSize({
        capital,
        risk: riskParams.riskAmount,
        price: candle.price
      });

      if (signal.action !== 'HOLD') {
        if (!currentPosition && signal.action === 'BUY') {
          currentPosition = {
            type: 'LONG',
            entry: {
              price: candle.price,
              timestamp: candle.timestamp
            },
            size: positionSize
          };
        } else if (currentPosition && signal.action === 'SELL') {
          const pnl = this.calculatePnL(currentPosition, candle.price);
          trades.push({
            entry: currentPosition.entry,
            exit: {
              price: candle.price,
              timestamp: candle.timestamp
            },
            pnl,
            type: currentPosition.type
          });

          capital += pnl;
          equity.push(capital);
          currentPosition = null;
        }
      }
    }

    return {
      trades,
      metrics: this.calculateMetrics(trades, equity),
      equity
    };
  }

  private calculatePnL(position: any, exitPrice: number): number {
    const direction = position.type === 'LONG' ? 1 : -1;
    return direction * position.size * (exitPrice - position.entry.price);
  }

  private calculateMetrics(trades: Trade[], equity: number[]): any {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const totalReturn = (equity[equity.length - 1] - equity[0]) / equity[0] * 100;
    const winRate = winningTrades.length / trades.length;
    const profitFactor = Math.abs(
      winningTrades.reduce((sum, t) => sum + t.pnl, 0) /
      losingTrades.reduce((sum, t) => sum + t.pnl, 0)
    );

    const maxDrawdown = this.calculateMaxDrawdown(equity);
    const sharpeRatio = this.calculateSharpeRatio(equity);

    return {
      totalReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      profitFactor
    };
  }

  private calculateMaxDrawdown(equity: number[]): number {
    let maxDrawdown = 0;
    let peak = equity[0];

    for (const value of equity) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return maxDrawdown;
  }

  private calculateSharpeRatio(equity: number[]): number {
    const returns = equity.slice(1).map((e, i) => (e - equity[i]) / equity[i]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
    );
    
    return avgReturn / stdDev * Math.sqrt(252); // Annualized
  }
}
