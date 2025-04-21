import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { z } from "zod";
import { storage } from "./storage";
import { registerSchema, loginSchema, registerUser, loginUser, isAuthenticated, isAdmin } from "./auth";
import { setupWebSocketServer } from "./websocket";
import { insertTransactionSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    user: {
      id: number;
      username: string;
      email: string;
      balance: number;
      isAdmin: boolean;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "aviator-game-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Setup WebSocket server and game manager
  const gameManager = setupWebSocketServer(httpServer);

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await registerUser(storage, validatedData);

      // Set user in session
      req.session.user = user;

      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }

      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "Something went wrong" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await loginUser(storage, validatedData);

      // Set user in session
      req.session.user = user;

      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }

      if (error instanceof Error) {
        return res.status(401).json({ message: error.message });
      }

      res.status(500).json({ message: "Something went wrong" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }

      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Game routes
  app.get("/api/game/state", (req: Request, res: Response) => {
    const gameState = gameManager.getCurrentState();
    res.json(gameState);
  });

  app.get("/api/game/history", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const history = await storage.getGameHistory(limit);
    res.json(history);
  });

  // User routes
  app.get("/api/user/transactions", isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const transactions = await storage.getUserTransactions(userId, limit);
    res.json(transactions);
  });

  app.get("/api/user/bets", isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const bets = await storage.getUserBets(userId, limit);
    res.json(bets);
  });

  // Payment routes
  app.post("/api/payment/deposit", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const depositSchema = insertTransactionSchema.pick({ 
        amount: true, 
        paymentMethod: true,
        transactionDetails: true
      });

      const validatedData = depositSchema.parse(req.body);
      const userId = req.session.user!.id;

      const transaction = await storage.createTransaction({
        userId,
        type: 'deposit',
        amount: validatedData.amount,
        status: 'pending',
        paymentMethod: validatedData.paymentMethod,
        transactionDetails: validatedData.transactionDetails
      });

      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }

      res.status(500).json({ message: "Deposit request failed" });
    }
  });

  app.post("/api/payment/withdraw", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const withdrawSchema = insertTransactionSchema.pick({ 
        amount: true, 
        paymentMethod: true,
        transactionDetails: true
      });

      const validatedData = withdrawSchema.parse(req.body);
      const userId = req.session.user!.id;

      // Check if user has enough balance
      const user = await storage.getUser(userId);
      if (!user || user.balance < validatedData.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct from user's balance
      await storage.updateUserBalance(userId, -validatedData.amount);

      // Create withdrawal transaction
      const transaction = await storage.createTransaction({
        userId,
        type: 'withdrawal',
        amount: -validatedData.amount,
        status: 'pending',
        paymentMethod: validatedData.paymentMethod,
        transactionDetails: validatedData.transactionDetails
      });

      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }

      res.status(500).json({ message: "Withdrawal request failed" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const users = await storage.getUsers(limit, offset);
    const total = await storage.getUsersCount();

    res.json({ users, total });
  });

  app.get("/api/admin/withdrawals", isAdmin, async (req: Request, res: Response) => {
    const withdrawals = await storage.getPendingWithdrawals();
    res.json(withdrawals);
  });

  app.get("/api/admin/deposits", isAdmin, async (req: Request, res: Response) => {
    const deposits = await storage.getPendingDeposits();
    res.json(deposits);
  });

  app.patch("/api/admin/transaction/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { status } = req.body;

      if (status !== 'completed' && status !== 'rejected') {
        return res.status(400).json({ message: "Invalid status" });
      }

      const transaction = await storage.updateTransactionStatus(transactionId, status);

      // If this is a deposit and it's approved, add the amount to the user's balance
      if (transaction.type === 'deposit' && status === 'completed') {
        // Log the transaction for debugging
        console.log('Approving deposit:', transaction);

        // Make sure we handle the amount correctly - deposit amounts are stored as positive values
        await storage.updateUserBalance(transaction.userId, Math.abs(transaction.amount));
      }

      // If this is a withdrawal and it's rejected, return the amount to the user's balance
      if (transaction.type === 'withdrawal' && status === 'rejected') {
        await storage.updateUserBalance(transaction.userId, -transaction.amount);
      }

      res.json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.get("/api/admin/game/settings", isAdmin, async (req: Request, res: Response) => {
    const settings = await storage.getGameSettings();
    res.json(settings);
  });

  app.patch("/api/admin/game/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      const settingsSchema = z.object({
        minBet: z.number().optional(),
        maxBet: z.number().optional(),
        houseEdge: z.number().optional(),
        maxMultiplier: z.number().optional()
      });

      const validatedData = settingsSchema.parse(req.body);
      const settings = await storage.updateGameSettings(validatedData);

      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }

      res.status(500).json({ message: "Failed to update game settings" });
    }
  });

  app.patch("/api/admin/game/manual-mode", isAdmin, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        enabled: z.boolean()
      });

      const { enabled } = schema.parse(req.body);
      const result = gameManager.setManualMode(enabled);

      res.json({ enabled: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }

      res.status(500).json({ message: "Failed to update manual mode" });
    }
  });

  app.patch("/api/admin/game/crash-point", isAdmin, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        crashPoint: z.number().min(1)
      });

      const { crashPoint } = schema.parse(req.body);
      const result = gameManager.setManualCrashPoint(crashPoint);

      res.json({ crashPoint: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }

      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "Failed to set crash point" });
    }
  });

  app.get("/api/admin/game/manual-mode", isAdmin, (req: Request, res: Response) => {
    const manualMode = gameManager.getManualMode();
    res.json(manualMode);
  });

  app.get("/api/admin/dashboard", isAdmin, async (req: Request, res: Response) => {
    const [
      users,
      bets,
      deposits,
      withdrawals,
      dailyBets,
      dailyActiveUsers
    ] = await Promise.all([
      storage.getUsersCount(),
      storage.getTotalBets(),
      storage.getTotalDeposits(),
      storage.getTotalWithdrawals(),
      storage.getTodayBets(),
      storage.getDailyActiveUsers()
    ]);

    // Calculate profit/loss
    const profitLoss = deposits - withdrawals;

    res.json({
      totalUsers: users,
      activeUsers: dailyActiveUsers.reduce((sum, hour) => sum + hour.users, 0),
      totalBets: bets,
      todayBets: dailyBets,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      profitLoss,
      dailyActiveUsers
    });
  });

  app.patch("/api/admin/users/:id/suspend", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.updateUser(userId, { suspended: true });
      res.json({ message: "User suspended successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.patch("/api/admin/users/:id/balance", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      await storage.updateUserBalance(userId, amount);
      res.json({ message: "User balance updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user balance" });
    }
  });

  return httpServer;
}