import { 
  users, type User, type InsertUser,
  gameRounds, type GameRound, type InsertGameRound,
  bets, type Bet, type InsertBet,
  transactions, type Transaction, type InsertTransaction,
  gameSettings, type GameSettings, type InsertGameSettings,
  type UserWithoutPassword, type LiveBet, type GameHistory
} from "@shared/schema";

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
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
  
  // Game settings methods
  getGameSettings(): Promise<GameSettings>;
  updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameRounds: Map<number, GameRound>;
  private bets: Map<number, Bet>;
  private transactions: Map<number, Transaction>;
  private gameSettings: GameSettings;
  
  private userIdCounter: number;
  private gameRoundIdCounter: number;
  private betIdCounter: number;
  private transactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.gameRounds = new Map();
    this.bets = new Map();
    this.transactions = new Map();
    
    this.userIdCounter = 1;
    this.gameRoundIdCounter = 1;
    this.betIdCounter = 1;
    this.transactionIdCounter = 1;
    
    // Initialize default game settings
    this.gameSettings = {
      id: 1,
      minBet: 10,
      maxBet: 10000,
      houseEdge: 5,
      maxMultiplier: 100,
      updatedAt: new Date()
    };
    
    // Create default admin user
    this.createUser({
      username: 'admin',
      password: '$2b$10$UJHG5HIeVJnkElB1t7PuE.NQdHJxTe6YTjX.XHHCIfkudVNb8DkB.', // 'admin123'
      email: 'admin@example.com',
      balance: 10000,
      isAdmin: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.balance += amount;
    this.users.set(userId, user);
    return user;
  }
  
  async getUsersCount(): Promise<number> {
    return this.users.size;
  }
  
  async getUsers(limit: number, offset: number): Promise<UserWithoutPassword[]> {
    const users = Array.from(this.users.values())
      .sort((a, b) => a.id - b.id)
      .slice(offset, offset + limit)
      .map(({ password, ...userWithoutPassword }) => userWithoutPassword as UserWithoutPassword);
    
    return users;
  }

  // Game rounds methods
  async createGameRound(insertGameRound: InsertGameRound): Promise<GameRound> {
    const id = this.gameRoundIdCounter++;
    const startedAt = new Date();
    const gameRound: GameRound = { 
      ...insertGameRound, 
      id, 
      startedAt, 
      endedAt: null, 
      isComplete: false 
    };
    this.gameRounds.set(id, gameRound);
    return gameRound;
  }
  
  async getGameRound(id: number): Promise<GameRound | undefined> {
    return this.gameRounds.get(id);
  }
  
  async endGameRound(id: number, crashPoint: number): Promise<GameRound> {
    const gameRound = await this.getGameRound(id);
    if (!gameRound) {
      throw new Error('Game round not found');
    }
    
    const endedAt = new Date();
    const updatedGameRound: GameRound = { 
      ...gameRound, 
      crashPoint, 
      endedAt, 
      isComplete: true 
    };
    
    this.gameRounds.set(id, updatedGameRound);
    return updatedGameRound;
  }
  
  async getGameHistory(limit: number): Promise<GameHistory[]> {
    return Array.from(this.gameRounds.values())
      .filter(round => round.isComplete)
      .sort((a, b) => {
        if (!a.endedAt || !b.endedAt) return 0;
        return b.endedAt.getTime() - a.endedAt.getTime();
      })
      .slice(0, limit)
      .map(round => ({
        id: round.id,
        crashPoint: round.crashPoint
      }));
  }

  // Bets methods
  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = this.betIdCounter++;
    const createdAt = new Date();
    const bet: Bet = { ...insertBet, id, createdAt, profit: null };
    this.bets.set(id, bet);
    return bet;
  }
  
  async getBet(id: number): Promise<Bet | undefined> {
    return this.bets.get(id);
  }
  
  async getUserBets(userId: number, limit: number): Promise<Bet[]> {
    return Array.from(this.bets.values())
      .filter(bet => bet.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getLiveBets(gameRoundId: number): Promise<LiveBet[]> {
    const liveBets: LiveBet[] = [];
    
    for (const bet of this.bets.values()) {
      if (bet.gameRoundId === gameRoundId) {
        const user = await this.getUser(bet.userId);
        if (user) {
          const initials = user.username.substring(0, 2).toUpperCase();
          
          let status: 'active' | 'cashed_out' | 'lost';
          if (bet.status === 'won') {
            status = 'cashed_out';
          } else if (bet.status === 'lost') {
            status = 'lost';
          } else {
            status = 'active';
          }
          
          liveBets.push({
            id: bet.id,
            username: user.username,
            avatar: initials,
            amount: bet.amount,
            status,
            cashedOutAt: bet.cashedOutAt || undefined
          });
        }
      }
    }
    
    return liveBets;
  }
  
  async updateBetStatus(id: number, status: string, cashedOutAt?: number, profit?: number): Promise<Bet> {
    const bet = await this.getBet(id);
    if (!bet) {
      throw new Error('Bet not found');
    }
    
    const updatedBet: Bet = { 
      ...bet, 
      status,
      cashedOutAt: cashedOutAt || bet.cashedOutAt,
      profit: profit !== undefined ? profit : bet.profit
    };
    
    this.bets.set(id, updatedBet);
    return updatedBet;
  }

  // Transactions methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const createdAt = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt, 
      updatedAt: null 
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getUserTransactions(userId: number, limit: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getPendingWithdrawals(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.type === 'withdrawal' && transaction.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    const updatedAt = new Date();
    const updatedTransaction: Transaction = { 
      ...transaction, 
      status, 
      updatedAt
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Game settings methods
  async getGameSettings(): Promise<GameSettings> {
    return this.gameSettings;
  }
  
  async updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings> {
    this.gameSettings = { 
      ...this.gameSettings, 
      ...settings,
      updatedAt: new Date()
    };
    return this.gameSettings;
  }
}

export const storage = new MemStorage();
