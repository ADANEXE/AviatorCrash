import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  balance: doublePrecision("balance").notNull().default(0), // Default balance is 0
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Game rounds table
export const gameRounds = pgTable("game_rounds", {
  id: serial("id").primaryKey(),
  crashPoint: doublePrecision("crash_point").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  isComplete: boolean("is_complete").notNull().default(false),
});

// Bets table
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameRoundId: integer("game_round_id").notNull().references(() => gameRounds.id),
  amount: doublePrecision("amount").notNull(),
  autoCashoutAt: doublePrecision("auto_cashout_at"),
  cashedOutAt: doublePrecision("cashed_out_at"),
  profit: doublePrecision("profit"),
  status: text("status").notNull(), // 'active', 'won', 'lost'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'bet', 'win'
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'rejected'
  paymentMethod: text("payment_method"),
  transactionDetails: text("transaction_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Game settings table
export const gameSettings = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  minBet: doublePrecision("min_bet").notNull().default(10),
  maxBet: doublePrecision("max_bet").notNull().default(10000),
  houseEdge: doublePrecision("house_edge").notNull().default(5), // percentage
  maxMultiplier: doublePrecision("max_multiplier").notNull().default(100),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
  transactions: many(transactions),
}));

export const gameRoundsRelations = relations(gameRounds, ({ many }) => ({
  bets: many(bets),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
  gameRound: one(gameRounds, {
    fields: [bets.gameRoundId],
    references: [gameRounds.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertGameRoundSchema = createInsertSchema(gameRounds).omit({ id: true, startedAt: true, endedAt: true, isComplete: true });
export const insertBetSchema = createInsertSchema(bets).omit({ id: true, createdAt: true, profit: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGameSettingsSchema = createInsertSchema(gameSettings).omit({ id: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type GameRound = typeof gameRounds.$inferSelect;
export type InsertGameRound = z.infer<typeof insertGameRoundSchema>;

export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type GameSettings = typeof gameSettings.$inferSelect;
export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;

// Custom types for API responses
export type GameState = {
  status: 'waiting' | 'in-progress' | 'crashed';
  currentMultiplier: number;
  crashPoint?: number;
  startTime?: number;
  roundId?: number;
};

export type UserWithoutPassword = Omit<User, 'password'>;

export type LiveBet = {
  id: number;
  username: string;
  avatar: string;
  amount: number;
  status: 'active' | 'cashed_out' | 'lost';
  cashedOutAt?: number;
};

export type GameHistory = {
  id: number;
  crashPoint: number;
};
