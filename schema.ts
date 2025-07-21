import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  coins: decimal("coins", { precision: 10, scale: 2 }).notNull().default("10000.00"),
  portfolioValue: decimal("portfolio_value", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  team: text("team").notNull(),
  sport: text("sport").notNull().default("NBA"),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  previousPrice: decimal("previous_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  stats: text("stats"), // JSON string of performance stats
  injuryStatus: text("injury_status").default("healthy"), // healthy, minor, major, out
  hotness: integer("hotness").default(0), // -100 to 100 scale
  tradingVolume: integer("trading_volume").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  athleteId: integer("athlete_id").notNull(),
  shares: integer("shares").notNull(),
  averageCost: decimal("average_cost", { precision: 10, scale: 2 }).notNull(),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  athleteId: integer("athlete_id").notNull(),
  type: text("type").notNull(), // "buy" or "sell"
  shares: integer("shares").notNull(),
  pricePerShare: decimal("price_per_share", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({
  id: true,
  createdAt: true,
}).extend({
  sport: z.string().default("NBA"),
});

export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;
export type InsertPortfolioHolding = z.infer<typeof insertPortfolioHoldingSchema>;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
