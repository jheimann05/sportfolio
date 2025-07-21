// Trading engine utilities for price calculations and market operations

export interface TradeOrder {
  userId: number;
  athleteId: number;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
}

export interface MarketData {
  totalVolume: number;
  marketCap: number;
  activeTraders: number;
  topGainer: {
    name: string;
    change: number;
  } | null;
}

export class TradingEngine {
  private static FEE_RATE = 0.015; // 1.5% trading fee

  static calculateTradingFee(amount: number): number {
    return amount * this.FEE_RATE;
  }

  static calculateTotalCost(shares: number, pricePerShare: number, type: 'buy' | 'sell'): {
    subtotal: number;
    fee: number;
    total: number;
  } {
    const subtotal = shares * pricePerShare;
    const fee = this.calculateTradingFee(subtotal);
    const total = type === 'buy' ? subtotal + fee : subtotal - fee;

    return { subtotal, fee, total };
  }

  static validateTrade(order: TradeOrder, userBalance: number, userShares: number): {
    isValid: boolean;
    error?: string;
  } {
    if (order.shares <= 0) {
      return { isValid: false, error: "Invalid number of shares" };
    }

    const { total } = this.calculateTotalCost(order.shares, order.price, order.type);

    if (order.type === 'buy') {
      if (userBalance < total) {
        return { isValid: false, error: "Insufficient funds" };
      }
    } else {
      if (userShares < order.shares) {
        return { isValid: false, error: "Insufficient shares to sell" };
      }
    }

    return { isValid: true };
  }

  static calculatePortfolioValue(holdings: Array<{
    shares: number;
    currentPrice: number;
  }>): number {
    return holdings.reduce((total, holding) => {
      return total + (holding.shares * holding.currentPrice);
    }, 0);
  }

  static calculatePortfolioGainLoss(holdings: Array<{
    shares: number;
    averageCost: number;
    currentPrice: number;
  }>): {
    totalGain: number;
    totalGainPercent: number;
  } {
    let totalCost = 0;
    let totalValue = 0;

    holdings.forEach(holding => {
      const cost = holding.shares * holding.averageCost;
      const value = holding.shares * holding.currentPrice;
      totalCost += cost;
      totalValue += value;
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    return { totalGain, totalGainPercent };
  }

  static updatePriceBasedOnVolume(
    currentPrice: number,
    tradingVolume: number,
    averageVolume: number,
    marketSentiment: number = 0
  ): number {
    // Simple price adjustment based on trading volume and market sentiment
    const volumeRatio = averageVolume > 0 ? tradingVolume / averageVolume : 1;
    const volumeImpact = Math.log(volumeRatio) * 0.05; // 5% max impact from volume
    const sentimentImpact = marketSentiment * 0.03; // 3% max impact from sentiment
    
    const priceMultiplier = 1 + volumeImpact + sentimentImpact;
    return Math.max(currentPrice * priceMultiplier, 1); // Minimum price of $1
  }

  static calculateMarketStats(athletes: any[], trades: any[]): MarketData {
    const totalMarketCap = athletes.reduce((sum, athlete) => 
      sum + parseFloat(athlete.currentPrice), 0
    );

    const recentTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return tradeDate > oneDayAgo;
    });

    const totalVolume = recentTrades.reduce((sum, trade) => 
      sum + parseFloat(trade.totalAmount), 0
    );

    const activeTraders = new Set(recentTrades.map(trade => trade.userId)).size;

    const topGainer = athletes
      .filter(athlete => athlete.previousPrice)
      .sort((a, b) => {
        const aChange = (parseFloat(a.currentPrice) - parseFloat(a.previousPrice)) / parseFloat(a.previousPrice);
        const bChange = (parseFloat(b.currentPrice) - parseFloat(b.previousPrice)) / parseFloat(b.previousPrice);
        return bChange - aChange;
      })[0];

    return {
      totalVolume,
      marketCap: totalMarketCap,
      activeTraders,
      topGainer: topGainer ? {
        name: topGainer.name.split(' ')[0][0] + '. ' + topGainer.name.split(' ').slice(-1)[0],
        change: ((parseFloat(topGainer.currentPrice) - parseFloat(topGainer.previousPrice)) / parseFloat(topGainer.previousPrice)) * 100
      } : null
    };
  }
}
