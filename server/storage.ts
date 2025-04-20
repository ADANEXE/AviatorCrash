import { 
  users, type User, type InsertUser,
  gameRounds, type GameRound, type InsertGameRound,
  bets, type Bet, type InsertBet,
  transactions, type Transaction, type InsertTransaction,
  gameSettings, type GameSettings, type InsertGameSettings,
  type UserWithoutPassword, type LiveBet, type GameHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;
  getUsersCount(): Promise<number>;
  getUsers(limit: number, offset: number): Promise<UserWithoutPassword[]>;
  
  // Game rounds methods
  createGameRound(gameRound: InsertGameRound): Promise<GameRound>;
  getGameRound(id: number): Promise<GameRound | undefined>;
  endGameRound(id: number, crashPoint: number): Promise<GameRound>;
  getGameHistory(limit: number): Promise<GameHistory[]>;
  
  // Bets methods
  createBet(bet: InsertBet): Promise<Bet>;
  getBet(id: number): Promise<Bet | undefined>;
  getUserBets(userId: number, limit: number): Promise<Bet[]>;
  getLiveBets(gameRoundId: number): Promise<LiveBet[]>;
  updateBetStatus(id: number, status: string, cashedOutAt?: number, profit?: number): Promise<Bet>;
  
  // Transactions methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number, limit: number): Promise<Transaction[]>;
  getPendingWithdrawals(): Promise<Transaction[]>;
  getPendingDeposits(): Promise<any[]>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
  
  // Game settings methods
  getGameSettings(): Promise<GameSettings>;
  updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`LOWER(${users.username}) = LOWER(${username})`
    );
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`LOWER(${users.email}) = LOWER(${email})`
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const newBalance = user.balance + amount;
    const [updatedUser] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async getUsersCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    return result[0].count;
  }
  
  async getUsers(limit: number, offset: number): Promise<UserWithoutPassword[]> {
    const selectedUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        balance: users.balance,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt
      })
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(users.id);
    
    return selectedUsers;
  }

  // Game rounds methods
  async createGameRound(insertGameRound: InsertGameRound): Promise<GameRound> {
    const [gameRound] = await db
      .insert(gameRounds)
      .values(insertGameRound)
      .returning();
    return gameRound;
  }
  
  async getGameRound(id: number): Promise<GameRound | undefined> {
    const [gameRound] = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.id, id));
    return gameRound;
  }
  
  async endGameRound(id: number, crashPoint: number): Promise<GameRound> {
    const [updatedGameRound] = await db
      .update(gameRounds)
      .set({
        crashPoint,
        endedAt: new Date(),
        isComplete: true
      })
      .where(eq(gameRounds.id, id))
      .returning();
    
    if (!updatedGameRound) {
      throw new Error('Game round not found');
    }
    
    return updatedGameRound;
  }
  
  async getGameHistory(limit: number): Promise<GameHistory[]> {
    const history = await db
      .select({
        id: gameRounds.id,
        crashPoint: gameRounds.crashPoint
      })
      .from(gameRounds)
      .where(eq(gameRounds.isComplete, true))
      .orderBy(desc(gameRounds.endedAt))
      .limit(limit);
    
    return history;
  }

  // Bets methods
  async createBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db
      .insert(bets)
      .values(insertBet)
      .returning();
    return bet;
  }
  
  async getBet(id: number): Promise<Bet | undefined> {
    const [bet] = await db
      .select()
      .from(bets)
      .where(eq(bets.id, id));
    return bet;
  }
  
  async getUserBets(userId: number, limit: number): Promise<Bet[]> {
    const userBets = await db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.createdAt))
      .limit(limit);
    
    return userBets;
  }
  
  async getLiveBets(gameRoundId: number): Promise<LiveBet[]> {
    // Join bets and users to get the data for live bets
    const betResults = await db
      .select({
        id: bets.id,
        username: users.username,
        amount: bets.amount,
        status: bets.status,
        cashedOutAt: bets.cashedOutAt
      })
      .from(bets)
      .innerJoin(users, eq(bets.userId, users.id))
      .where(eq(bets.gameRoundId, gameRoundId));
    
    const liveBets: LiveBet[] = betResults.map(bet => {
      const initials = bet.username.substring(0, 2).toUpperCase();
      
      let status: 'active' | 'cashed_out' | 'lost';
      if (bet.status === 'won') {
        status = 'cashed_out';
      } else if (bet.status === 'lost') {
        status = 'lost';
      } else {
        status = 'active';
      }
      
      return {
        id: bet.id,
        username: bet.username,
        avatar: initials,
        amount: bet.amount,
        status,
        cashedOutAt: bet.cashedOutAt || undefined
      };
    });
    
    return liveBets;
  }
  
  async updateBetStatus(id: number, status: string, cashedOutAt?: number, profit?: number): Promise<Bet> {
    const updateValues: Partial<Bet> = { status };
    if (cashedOutAt !== undefined) updateValues.cashedOutAt = cashedOutAt;
    if (profit !== undefined) updateValues.profit = profit;
    
    const [updatedBet] = await db
      .update(bets)
      .set(updateValues)
      .where(eq(bets.id, id))
      .returning();
    
    if (!updatedBet) {
      throw new Error('Bet not found');
    }
    
    return updatedBet;
  }

  // Transactions methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }
  
  async getUserTransactions(userId: number, limit: number): Promise<Transaction[]> {
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
    
    return userTransactions;
  }
  
  async getPendingWithdrawals(): Promise<Transaction[]> {
    const pendingWithdrawals = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'withdrawal'),
          eq(transactions.status, 'pending')
        )
      )
      .orderBy(asc(transactions.createdAt));
    
    return pendingWithdrawals;
  }
  
  async getPendingDeposits(): Promise<any[]> {
    // Find all pending deposit transactions and join with user data
    const result = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        username: users.username,
        amount: transactions.amount,
        status: transactions.status,
        type: transactions.type,
        paymentMethod: transactions.paymentMethod,
        transactionDetails: transactions.transactionDetails,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .where(
        and(
          eq(transactions.type, 'deposit'),
          eq(transactions.status, 'pending')
        )
      )
      .orderBy(asc(transactions.createdAt));
    
    return result;
  }
  
  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id))
      .returning();
    
    if (!updatedTransaction) {
      throw new Error('Transaction not found');
    }
    
    return updatedTransaction;
  }

  // Game settings methods
  async getGameSettings(): Promise<GameSettings> {
    const [settings] = await db
      .select()
      .from(gameSettings)
      .orderBy(gameSettings.id)
      .limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = {
        minBet: 10,
        maxBet: 10000,
        houseEdge: 5,
        maxMultiplier: 100,
      };
      
      const [newSettings] = await db
        .insert(gameSettings)
        .values(defaultSettings)
        .returning();
      
      return newSettings;
    }
    
    return settings;
  }
  
  async updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings> {
    const existingSettings = await this.getGameSettings();
    
    const [updatedSettings] = await db
      .update(gameSettings)
      .set({
        ...settings,
        updatedAt: new Date()
      })
      .where(eq(gameSettings.id, existingSettings.id))
      .returning();
    
    return updatedSettings;
  }
}

// Initialize the database storage
export const storage = new DatabaseStorage();
