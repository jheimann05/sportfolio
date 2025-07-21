import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ user: { id: user.id, username: user.username, coins: user.coins, portfolioValue: user.portfolioValue } });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, username: user.username, coins: user.coins, portfolioValue: user.portfolioValue } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Athletes routes
  app.get("/api/athletes", async (req, res) => {
    try {
      const athletes = await storage.getAllAthletes();
      res.json(athletes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch athletes" });
    }
  });

  app.get("/api/athletes/trending", async (req, res) => {
    try {
      const athletes = await storage.getTrendingAthletes();
      res.json(athletes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending athletes" });
    }
  });

  app.get("/api/athletes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const athlete = await storage.getAthlete(id);
      
      if (!athlete) {
        return res.status(404).json({ message: "Athlete not found" });
      }

      res.json(athlete);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch athlete" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const holdings = await storage.getUserPortfolio(userId);
      
      // Get athlete details for each holding
      const portfolioWithAthletes = await Promise.all(
        holdings.map(async (holding) => {
          const athlete = await storage.getAthlete(holding.athleteId);
          return {
            ...holding,
            athlete
          };
        })
      );

      res.json(portfolioWithAthletes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Trading routes
  app.post("/api/trade", async (req, res) => {
    try {
      const tradeData = z.object({
        userId: z.number(),
        athleteId: z.number(),
        type: z.enum(["buy", "sell"]),
        shares: z.number().positive()
      }).parse(req.body);

      const athlete = await storage.getAthlete(tradeData.athleteId);
      if (!athlete) {
        return res.status(404).json({ message: "Athlete not found" });
      }

      const user = await storage.getUser(tradeData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const pricePerShare = parseFloat(athlete.currentPrice);
      const totalAmount = pricePerShare * tradeData.shares;
      const fee = totalAmount * 0.015; // 1.5% fee
      const totalCost = totalAmount + fee;

      if (tradeData.type === "buy") {
        const userCoins = parseFloat(user.coins);
        if (userCoins < totalCost) {
          return res.status(400).json({ message: "Insufficient coins" });
        }

        // Update user coins
        await storage.updateUserCoins(tradeData.userId, (userCoins - totalCost).toFixed(2));

        // Update or create portfolio holding
        const existingHolding = await storage.getPortfolioHolding(tradeData.userId, tradeData.athleteId);
        
        if (existingHolding) {
          const newShares = existingHolding.shares + tradeData.shares;
          const newAverageCost = ((parseFloat(existingHolding.averageCost) * existingHolding.shares) + totalAmount) / newShares;
          const newTotalValue = newShares * pricePerShare;
          
          await storage.updatePortfolioHolding(
            existingHolding.id,
            newShares,
            newAverageCost.toFixed(2),
            newTotalValue.toFixed(2)
          );
        } else {
          await storage.createPortfolioHolding({
            userId: tradeData.userId,
            athleteId: tradeData.athleteId,
            shares: tradeData.shares,
            averageCost: pricePerShare.toFixed(2),
            totalValue: totalAmount.toFixed(2)
          });
        }
      } else { // sell
        const holding = await storage.getPortfolioHolding(tradeData.userId, tradeData.athleteId);
        if (!holding || holding.shares < tradeData.shares) {
          return res.status(400).json({ message: "Insufficient shares" });
        }

        const saleAmount = totalAmount - fee;
        
        // Update user coins
        const userCoins = parseFloat(user.coins);
        await storage.updateUserCoins(tradeData.userId, (userCoins + saleAmount).toFixed(2));

        // Update portfolio holding
        const newShares = holding.shares - tradeData.shares;
        if (newShares === 0) {
          await storage.deletePortfolioHolding(holding.id);
        } else {
          const newTotalValue = newShares * pricePerShare;
          await storage.updatePortfolioHolding(
            holding.id,
            newShares,
            holding.averageCost,
            newTotalValue.toFixed(2)
          );
        }
      }

      // Create trade record
      const trade = await storage.createTrade({
        userId: tradeData.userId,
        athleteId: tradeData.athleteId,
        type: tradeData.type,
        shares: tradeData.shares,
        pricePerShare: pricePerShare.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        fee: fee.toFixed(2)
      });

      // Update athlete trading volume
      const newVolume = (athlete.tradingVolume || 0) + tradeData.shares;
      await storage.updateAthleteTradingVolume(tradeData.athleteId, newVolume);

      res.json({ trade, message: "Trade executed successfully" });
    } catch (error) {
      res.status(400).json({ message: "Trade execution failed" });
    }
  });

  // Trading history
  app.get("/api/trades/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const trades = await storage.getUserTrades(userId, 20);
      
      // Get athlete details for each trade
      const tradesWithAthletes = await Promise.all(
        trades.map(async (trade) => {
          const athlete = await storage.getAthlete(trade.athleteId);
          return {
            ...trade,
            athlete
          };
        })
      );

      res.json(tradesWithAthletes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trading history" });
    }
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const topTraders = await storage.getTopTraders(10);
      const leaderboard = topTraders.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        portfolioValue: user.portfolioValue,
        coins: user.coins
      }));
      
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Market stats
  app.get("/api/market/stats", async (req, res) => {
    try {
      const athletes = await storage.getAllAthletes();
      const users = Array.from((storage as any).users.values());
      const trades = await storage.getRecentTrades(1000);
      
      const totalMarketCap = athletes.reduce((sum, athlete) => sum + parseFloat(athlete.currentPrice), 0);
      const activeTraders = users.length;
      const dailyVolume = trades
        .filter(trade => {
          const tradeDate = new Date(trade.createdAt);
          const today = new Date();
          return tradeDate.toDateString() === today.toDateString();
        })
        .reduce((sum, trade) => sum + parseFloat(trade.totalAmount), 0);
      
      const topGainer = athletes
        .filter(athlete => athlete.previousPrice)
        .sort((a, b) => {
          const aChange = (parseFloat(a.currentPrice) - parseFloat(a.previousPrice!)) / parseFloat(a.previousPrice!) * 100;
          const bChange = (parseFloat(b.currentPrice) - parseFloat(b.previousPrice!)) / parseFloat(b.previousPrice!) * 100;
          return bChange - aChange;
        })[0];

      res.json({
        marketCap: totalMarketCap.toFixed(0),
        activeTraders,
        dailyVolume: dailyVolume.toFixed(0),
        topGainer: topGainer ? {
          name: topGainer.name.split(' ').map(n => n[0]).join('.') + ' ' + topGainer.name.split(' ').slice(-1)[0],
          change: ((parseFloat(topGainer.currentPrice) - parseFloat(topGainer.previousPrice!)) / parseFloat(topGainer.previousPrice!) * 100).toFixed(1)
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
