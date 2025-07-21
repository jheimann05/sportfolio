import { 
  users, athletes, portfolioHoldings, trades,
  type User, type InsertUser, 
  type Athlete, type InsertAthlete,
  type PortfolioHolding, type InsertPortfolioHolding,
  type Trade, type InsertTrade
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoins(id: number, coins: string): Promise<void>;
  updateUserPortfolioValue(id: number, portfolioValue: string): Promise<void>;

  // Athlete operations
  getAllAthletes(): Promise<Athlete[]>;
  getAthlete(id: number): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthletePrice(id: number, price: string): Promise<void>;
  updateAthleteHotness(id: number, hotness: number): Promise<void>;
  updateAthleteTradingVolume(id: number, volume: number): Promise<void>;
  getTrendingAthletes(): Promise<Athlete[]>;

  // Portfolio operations
  getUserPortfolio(userId: number): Promise<PortfolioHolding[]>;
  getPortfolioHolding(userId: number, athleteId: number): Promise<PortfolioHolding | undefined>;
  createPortfolioHolding(holding: InsertPortfolioHolding): Promise<PortfolioHolding>;
  updatePortfolioHolding(id: number, shares: number, averageCost: string, totalValue: string): Promise<void>;
  deletePortfolioHolding(id: number): Promise<void>;

  // Trade operations
  createTrade(trade: InsertTrade): Promise<Trade>;
  getUserTrades(userId: number, limit?: number): Promise<Trade[]>;
  getRecentTrades(limit?: number): Promise<Trade[]>;

  // Leaderboard
  getTopTraders(limit?: number): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private athletes: Map<number, Athlete>;
  private portfolioHoldings: Map<number, PortfolioHolding>;
  private trades: Map<number, Trade>;
  private currentUserId: number;
  private currentAthleteId: number;
  private currentPortfolioId: number;
  private currentTradeId: number;

  constructor() {
    this.users = new Map();
    this.athletes = new Map();
    this.portfolioHoldings = new Map();
    this.trades = new Map();
    this.currentUserId = 1;
    this.currentAthleteId = 1;
    this.currentPortfolioId = 1;
    this.currentTradeId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create sample user
    this.createUser({
      username: "demo_user",
      password: "password123"
    });

    // Create sample athletes with NBA players
    const sampleAthletes: InsertAthlete[] = [
      {
        name: "LeBron James",
        position: "SF",
        team: "Lakers",
        sport: "NBA",
        currentPrice: "84.50",
        previousPrice: "81.26",
        imageUrl: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        stats: JSON.stringify({ ppg: 27.4, rpg: 8.2, apg: 7.1 }),
        injuryStatus: "healthy",
        hotness: 85,
        tradingVolume: 1250
      },
      {
        name: "Stephen Curry",
        position: "PG",
        team: "Warriors",
        sport: "NBA",
        currentPrice: "91.20",
        previousPrice: "93.05",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        stats: JSON.stringify({ ppg: 29.1, rpg: 6.2, apg: 6.8 }),
        injuryStatus: "healthy",
        hotness: 42,
        tradingVolume: 980
      },
      {
        name: "Giannis Antetokounmpo",
        position: "PF",
        team: "Bucks",
        sport: "NBA",
        currentPrice: "76.80",
        previousPrice: "84.92",
        imageUrl: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        stats: JSON.stringify({ ppg: 31.2, rpg: 12.1, apg: 5.7 }),
        injuryStatus: "minor",
        hotness: -45,
        tradingVolume: 1800
      },
      {
        name: "Luka Dončić",
        position: "PG",
        team: "Mavericks",
        sport: "NBA",
        currentPrice: "89.45",
        previousPrice: "83.78",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        stats: JSON.stringify({ ppg: 32.8, rpg: 8.9, apg: 9.1 }),
        injuryStatus: "healthy",
        hotness: 72,
        tradingVolume: 1450
      },
      {
        name: "Jayson Tatum",
        position: "SF",
        team: "Celtics",
        sport: "NBA",
        currentPrice: "78.90",
        previousPrice: "77.20",
        imageUrl: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        stats: JSON.stringify({ ppg: 26.9, rpg: 8.1, apg: 4.9 }),
        injuryStatus: "healthy",
        hotness: 28,
        tradingVolume: 750
      }
    ];

    sampleAthletes.forEach(athlete => {
      this.createAthlete(athlete);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      coins: "10000.00",
      portfolioValue: "0.00",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCoins(id: number, coins: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.coins = coins;
      this.users.set(id, user);
    }
  }

  async updateUserPortfolioValue(id: number, portfolioValue: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.portfolioValue = portfolioValue;
      this.users.set(id, user);
    }
  }

  // Athlete operations
  async getAllAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values());
  }

  async getAthlete(id: number): Promise<Athlete | undefined> {
    return this.athletes.get(id);
  }

  async createAthlete(insertAthlete: InsertAthlete): Promise<Athlete> {
    const id = this.currentAthleteId++;
    const athlete: Athlete = {
      id,
      name: insertAthlete.name,
      position: insertAthlete.position,
      team: insertAthlete.team,
      sport: insertAthlete.sport || "NBA",
      currentPrice: insertAthlete.currentPrice,
      previousPrice: insertAthlete.previousPrice || null,
      imageUrl: insertAthlete.imageUrl || null,
      stats: insertAthlete.stats || null,
      injuryStatus: insertAthlete.injuryStatus || null,
      hotness: insertAthlete.hotness || null,
      tradingVolume: insertAthlete.tradingVolume || null,
      createdAt: new Date()
    };
    this.athletes.set(id, athlete);
    return athlete;
  }

  async updateAthletePrice(id: number, price: string): Promise<void> {
    const athlete = this.athletes.get(id);
    if (athlete) {
      athlete.previousPrice = athlete.currentPrice;
      athlete.currentPrice = price;
      this.athletes.set(id, athlete);
    }
  }

  async updateAthleteHotness(id: number, hotness: number): Promise<void> {
    const athlete = this.athletes.get(id);
    if (athlete) {
      athlete.hotness = hotness;
      this.athletes.set(id, athlete);
    }
  }

  async updateAthleteTradingVolume(id: number, volume: number): Promise<void> {
    const athlete = this.athletes.get(id);
    if (athlete) {
      athlete.tradingVolume = volume;
      this.athletes.set(id, athlete);
    }
  }

  async getTrendingAthletes(): Promise<Athlete[]> {
    const athletes = Array.from(this.athletes.values());
    return athletes
      .sort((a, b) => (b.tradingVolume || 0) - (a.tradingVolume || 0))
      .slice(0, 10);
  }

  // Portfolio operations
  async getUserPortfolio(userId: number): Promise<PortfolioHolding[]> {
    return Array.from(this.portfolioHoldings.values())
      .filter(holding => holding.userId === userId);
  }

  async getPortfolioHolding(userId: number, athleteId: number): Promise<PortfolioHolding | undefined> {
    return Array.from(this.portfolioHoldings.values())
      .find(holding => holding.userId === userId && holding.athleteId === athleteId);
  }

  async createPortfolioHolding(insertHolding: InsertPortfolioHolding): Promise<PortfolioHolding> {
    const id = this.currentPortfolioId++;
    const holding: PortfolioHolding = {
      id,
      userId: insertHolding.userId,
      athleteId: insertHolding.athleteId,
      shares: insertHolding.shares,
      averageCost: insertHolding.averageCost,
      totalValue: insertHolding.totalValue,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.portfolioHoldings.set(id, holding);
    return holding;
  }

  async updatePortfolioHolding(id: number, shares: number, averageCost: string, totalValue: string): Promise<void> {
    const holding = this.portfolioHoldings.get(id);
    if (holding) {
      holding.shares = shares;
      holding.averageCost = averageCost;
      holding.totalValue = totalValue;
      holding.updatedAt = new Date();
      this.portfolioHoldings.set(id, holding);
    }
  }

  async deletePortfolioHolding(id: number): Promise<void> {
    this.portfolioHoldings.delete(id);
  }

  // Trade operations
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const trade: Trade = {
      ...insertTrade,
      id,
      createdAt: new Date()
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getUserTrades(userId: number, limit: number = 50): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getRecentTrades(limit: number = 50): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Leaderboard
  async getTopTraders(limit: number = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => parseFloat(b.portfolioValue) - parseFloat(a.portfolioValue))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
