import { IStorage } from "./storage";
import { GameState, type GameRound } from "@shared/schema";
import { WebSocketServer } from "ws";

export class GameManager {
  private storage: IStorage;
  private wss: WebSocketServer;
  private currentState: GameState;
  private currentRound: GameRound | null;
  private gameInterval: NodeJS.Timeout | null;
  private gameTimer: NodeJS.Timeout | null;
  private manualMode: boolean;
  private manualCrashPoint: number | null;
  
  constructor(storage: IStorage, wss: WebSocketServer) {
    this.storage = storage;
    this.wss = wss;
    this.currentState = {
      status: 'waiting',
      currentMultiplier: 1.0
    };
    this.currentRound = null;
    this.gameInterval = null;
    this.gameTimer = null;
    this.manualMode = false;
    this.manualCrashPoint = null;
  }
  
  public async initialize() {
    await this.loadGameSettings();
    this.startNewRound();
  }
  
  private async loadGameSettings() {
    // Load game settings from storage
    const settings = await this.storage.getGameSettings();
    console.log('Game settings loaded:', settings);
  }
  
  public async startNewRound() {
    // Clear any existing timers
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
    
    // Set game state to waiting with countdown
    const startTime = Date.now();
    const waitDuration = 15000; // 15 seconds in milliseconds
    
    this.currentState = {
      status: 'waiting',
      currentMultiplier: 1.0,
      startTime,
      waitDuration
    };
    
    // Broadcast the game state
    this.broadcastGameState();
    
    // Update countdown every second
    let countdown = 15;
    const countdownInterval = setInterval(() => {
      countdown--;
      this.currentState = {
        ...this.currentState,
        countdown
      };
      this.broadcastGameState();
    }, 1000);
    
    // Wait 15 seconds before starting the game
    this.gameTimer = setTimeout(() => {
      clearInterval(countdownInterval);
      this.startGame();
    }, waitDuration);
  }
  
  private async startGame() {
    // Generate crash point
    const crashPoint = this.manualMode && this.manualCrashPoint !== null 
      ? this.manualCrashPoint 
      : this.generateCrashPoint();
    
    // Create new game round
    const gameRound = await this.storage.createGameRound({ 
      crashPoint 
    });
    
    this.currentRound = gameRound;
    
    // Set game state to in-progress
    this.currentState = {
      status: 'in-progress',
      currentMultiplier: 1.0,
      startTime: Date.now(),
      roundId: gameRound.id
    };
    
    // Broadcast the game state
    this.broadcastGameState();
    
    // Start game interval
    let multiplier = 1.0;
    const intervalMs = 100; // Update every 100ms
    const multiplierIncreasePerSecond = 1; // How much the multiplier increases per second
    
    this.gameInterval = setInterval(() => {
      // Increase multiplier
      multiplier += (multiplierIncreasePerSecond * intervalMs) / 1000;
      
      // Update current state
      this.currentState.currentMultiplier = multiplier;
      
      // Check if game should end
      if (multiplier >= crashPoint) {
        this.endGame(crashPoint);
      } else {
        // Broadcast updated game state
        this.broadcastGameState();
      }
    }, intervalMs);
  }
  
  private async endGame(crashPoint: number) {
    // Clear game interval
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    
    if (!this.currentRound) {
      console.error('No current round found when ending game');
      return;
    }
    
    // Update game round in storage
    await this.storage.endGameRound(this.currentRound.id, crashPoint);
    
    // Set game state to crashed
    this.currentState = {
      status: 'crashed',
      currentMultiplier: crashPoint,
      crashPoint
    };
    
    // Broadcast the final game state
    this.broadcastGameState();
    
    // Process all active bets for this round
    await this.processBetsForRound(this.currentRound.id, crashPoint);
    
    // Start a new round after 3 seconds
    this.gameTimer = setTimeout(() => {
      this.startNewRound();
    }, 3000);
    
    // Reset manual crash point if used
    if (this.manualMode && this.manualCrashPoint !== null) {
      this.manualCrashPoint = null;
    }
  }
  
  private async processBetsForRound(roundId: number, crashPoint: number) {
    // Get all bets for this round
    const bets = await this.storage.getLiveBets(roundId);
    
    // Process each bet
    for (const bet of bets) {
      if (bet.status === 'active') {
        // This bet did not cash out in time, mark as lost
        await this.storage.updateBetStatus(bet.id, 'lost');
      }
    }
  }
  
  private generateCrashPoint(): number {
    // House edge (default 5%)
    const houseEdge = 0.05;
    
    // Generate random number between 0 and 1
    const randomValue = Math.random();
    
    // Calculate crash point using house edge
    // Using a formula that creates an exponential distribution
    const crashPoint = 0.99 / (randomValue ** (1 / (1 - houseEdge)));
    
    // Round to 2 decimal places
    return Math.round(crashPoint * 100) / 100;
  }
  
  public broadcastGameState() {
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'gameState',
          data: this.currentState
        }));
      }
    });
  }
  
  public getCurrentState(): GameState {
    return { ...this.currentState };
  }
  
  public getCurrentRound(): GameRound | null {
    return this.currentRound;
  }
  
  public setManualMode(enabled: boolean) {
    this.manualMode = enabled;
    return this.manualMode;
  }
  
  public setManualCrashPoint(crashPoint: number) {
    if (crashPoint < 1.0) {
      throw new Error('Crash point must be at least 1.0');
    }
    
    this.manualCrashPoint = crashPoint;
    return this.manualCrashPoint;
  }
  
  public getManualMode() {
    return {
      enabled: this.manualMode,
      crashPoint: this.manualCrashPoint
    };
  }
  
  public async placeBet(userId: number, amount: number, autoCashoutAt: number | null) {
    // Check if game is in waiting state
    if (this.currentState.status !== 'waiting') {
      throw new Error('Cannot place bet while game is in progress');
    }
    
    if (!this.currentRound) {
      throw new Error('No active game round');
    }
    
    // Check if user has enough balance
    const user = await this.storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    // Get game settings
    const settings = await this.storage.getGameSettings();
    
    // Validate bet amount
    if (amount < settings.minBet) {
      throw new Error(`Bet amount must be at least ${settings.minBet}`);
    }
    
    if (amount > settings.maxBet) {
      throw new Error(`Bet amount cannot exceed ${settings.maxBet}`);
    }
    
    // Deduct amount from user balance
    await this.storage.updateUserBalance(userId, -amount);
    
    // Create bet record
    const bet = await this.storage.createBet({
      userId,
      gameRoundId: this.currentRound.id,
      amount,
      autoCashoutAt: autoCashoutAt || null,
      cashedOutAt: null,
      status: 'active'
    });
    
    // Create transaction record
    await this.storage.createTransaction({
      userId,
      type: 'bet',
      amount: -amount,
      status: 'completed',
      paymentMethod: 'balance',
      transactionDetails: `Bet on game round #${this.currentRound.id}`
    });
    
    // Broadcast updated bets
    this.broadcastLiveBets();
    
    return bet;
  }
  
  public async cashOut(userId: number, betId: number) {
    // Check if game is in progress
    if (this.currentState.status !== 'in-progress') {
      throw new Error('Cannot cash out when game is not in progress');
    }
    
    // Get the bet
    const bet = await this.storage.getBet(betId);
    if (!bet) {
      throw new Error('Bet not found');
    }
    
    // Check if bet belongs to the user
    if (bet.userId !== userId) {
      throw new Error('Bet does not belong to this user');
    }
    
    // Check if bet is active
    if (bet.status !== 'active') {
      throw new Error('Bet is not active');
    }
    
    // Calculate winnings
    const multiplier = this.currentState.currentMultiplier;
    const winAmount = bet.amount * multiplier;
    const profit = winAmount - bet.amount;
    
    // Update bet status
    await this.storage.updateBetStatus(betId, 'won', multiplier, profit);
    
    // Update user balance
    await this.storage.updateUserBalance(userId, winAmount);
    
    // Create transaction record
    await this.storage.createTransaction({
      userId,
      type: 'win',
      amount: winAmount,
      status: 'completed',
      paymentMethod: 'balance',
      transactionDetails: `Win from bet #${betId} at ${multiplier}x`
    });
    
    // Broadcast updated bets
    this.broadcastLiveBets();
    
    return {
      betId,
      cashoutMultiplier: multiplier,
      winAmount
    };
  }
  
  public async broadcastLiveBets() {
    if (!this.currentRound) return;
    
    const bets = await this.storage.getLiveBets(this.currentRound.id);
    
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'liveBets',
          data: bets
        }));
      }
    });
  }
  
  public async sendGameHistory(limit: number = 10) {
    const history = await this.storage.getGameHistory(limit);
    
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'gameHistory',
          data: history
        }));
      }
    });
    
    return history;
  }
}
