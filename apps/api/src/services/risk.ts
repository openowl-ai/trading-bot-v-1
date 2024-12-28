import { TradeSignal } from '../strategies/baseStrategy';

interface RiskParameters {
  maxPositionSize: number;
  maxDrawdown: number;
  maxDailyLoss: number;
  maxLeverage: number;
}

interface RiskEvaluation {
  allowTrade: boolean;
  riskAmount: number;
  reason?: string;
}

export class RiskManager {
  private params: RiskParameters;
  private dailyStats: Map<string, any>;
  private totalEquity: number;
  private maxDrawdownReached: number;

  constructor(initialEquity: number, params?: Partial<RiskParameters>) {
    this.params = {
      maxPositionSize: 0.1, // 10% of equity
      maxDrawdown: 0.2, // 20% max drawdown
      maxDailyLoss: 0.05, // 5% max daily loss
      maxLeverage: 2, // 2x max leverage
      ...params
    };

    this.totalEquity = initialEquity;
    this.dailyStats = new Map();
    this.maxDrawdownReached = 0;
  }

  evaluateRisk({
    capital,
    signal,
    currentPosition,
    marketData
  }: {
    capital: number;
    signal: TradeSignal;
    currentPosition: any;
    marketData: any;
  }): RiskEvaluation {
    // Update equity
    this.updateEquity(capital);

    // Check daily loss limit
    if (!this.checkDailyLossLimit(capital)) {
      return {
        allowTrade: false,
        riskAmount: 0,
        reason: 'Daily loss limit reached'
      };
    }

    // Check drawdown
    if (!this.checkDrawdown()) {
      return {
        allowTrade: false,
        riskAmount: 0,
        reason: 'Maximum drawdown reached'
      };
    }

    // Calculate position risk
    const riskAmount = this.calculatePositionRisk(signal, marketData);

    // Check if risk amount exceeds limits
    if (riskAmount > capital * this.params.maxPositionSize) {
      return {
        allowTrade: false,
        riskAmount: 0,
        reason: 'Position size exceeds limit'
      };
    }

    return {
      allowTrade: true,
      riskAmount
    };
  }

  private updateEquity(currentEquity: number) {
    const date = new Date().toISOString().split('T')[0];
    if (!this.dailyStats.has(date)) {
      this.dailyStats.set(date, {
        startEquity: currentEquity,
        currentEquity,
        trades: 0
      });
    } else {
      const stats = this.dailyStats.get(date);
      stats.currentEquity = currentEquity;
      this.dailyStats.set(date, stats);
    }

    // Update max drawdown
    const drawdown = (this.totalEquity - currentEquity) / this.totalEquity;
    if (drawdown > this.maxDrawdownReached) {
      this.maxDrawdownReached = drawdown;
    }
  }

  private checkDailyLossLimit(currentEquity: number): boolean {
    const date = new Date().toISOString().split('T')[0];
    const stats = this.dailyStats.get(date);
    if (!stats) return true;

    const dailyReturn = (currentEquity - stats.startEquity) / stats.startEquity;
    return dailyReturn > -this.params.maxDailyLoss;
  }

  private checkDrawdown(): boolean {
    return this.maxDrawdownReached < this.params.maxDrawdown;
  }

  private calculatePositionRisk(signal: TradeSignal, marketData: any): number {
    // Calculate risk based on volatility and signal confidence
    const volatility = this.calculateVolatility(marketData);
    const adjustedRisk = this.params.maxPositionSize * signal.confidence * (1 - volatility);
    
    return adjustedRisk;
  }

  private calculateVolatility(marketData: any): number {
    // Simple volatility calculation - can be enhanced
    const returns = marketData.slice(-20).map((d: any, i: number, arr: any[]) => 
      i > 0 ? (d.price - arr[i-1].price) / arr[i-1].price : 0
    );

    const std = Math.sqrt(
      returns.reduce((a: number, b: number) => a + b * b, 0) / returns.length
    );

    return Math.min(std, 1); // Normalize between 0 and 1
  }
}
