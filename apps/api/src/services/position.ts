interface PositionConfig {
  maxPositionSize: number;
  minPositionSize: number;
  defaultRiskPerTrade: number;
  positionSizingMethod: 'fixed' | 'risk-based' | 'kelly';
}

export class PositionManager {
  private config: PositionConfig;
  private positions: Map<string, any>;

  constructor(config?: Partial<PositionConfig>) {
    this.config = {
      maxPositionSize: 0.1, // 10% of capital
      minPositionSize: 0.01, // 1% of capital
      defaultRiskPerTrade: 0.02, // 2% risk per trade
      positionSizingMethod: 'risk-based',
      ...config
    };

    this.positions = new Map();
  }

  calculatePositionSize({
    capital,
    risk,
    price,
    method = this.config.positionSizingMethod
  }: {
    capital: number;
    risk: number;
    price: number;
    method?: 'fixed' | 'risk-based' | 'kelly';
  }): number {
    switch (method) {
      case 'fixed':
        return this.calculateFixedSize(capital);
      case 'risk-based':
        return this.calculateRiskBasedSize(capital, risk, price);
      case 'kelly':
        return this.calculateKellySize(capital, risk, price);
      default:
        return this.calculateRiskBasedSize(capital, risk, price);
    }
  }

  private calculateFixedSize(capital: number): number {
    const size = capital * this.config.defaultRiskPerTrade;
    return this.normalizeSize(size, capital);
  }

  private calculateRiskBasedSize(capital: number, risk: number, price: number): number {
    const riskAmount = capital * risk;
    const size = riskAmount / price;
    return this.normalizeSize(size, capital);
  }

  private calculateKellySize(capital: number, risk: number, price: number): number {
    // Simplified Kelly Criterion
    const winRate = 0.5; // This should be calculated based on historical data
    const winLossRatio = 1.5; // This should be calculated based on historical data
    
    const kellyPercentage = winRate - ((1 - winRate) / winLossRatio);
    const size = capital * Math.max(0, kellyPercentage) * risk;
    
    return this.normalizeSize(size, capital);
  }

  private normalizeSize(size: number, capital: number): number {
    const maxSize = capital * this.config.maxPositionSize;
    const minSize = capital * this.config.minPositionSize;
    
    return Math.min(Math.max(size, minSize), maxSize);
  }

  updatePosition(id: string, data: any) {
    this.positions.set(id, {
      ...this.positions.get(id),
      ...data,
      lastUpdated: Date.now()
    });
  }

  getPosition(id: string) {
    return this.positions.get(id);
  }

  getAllPositions() {
    return Array.from(this.positions.values());
  }

  closePosition(id: string) {
    const position = this.positions.get(id);
    if (position) {
      position.status = 'closed';
      position.closedAt = Date.now();
      this.positions.set(id, position);
    }
    return position;
  }
}
