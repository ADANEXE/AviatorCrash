import { type Request, Response, NextFunction } from "express";
import { IStorage } from "./storage";
import { compare, hash } from "bcrypt";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

const SALT_ROUNDS = 10;

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(storage: IStorage, userData: z.infer<typeof registerSchema>) {
  const { confirmPassword, ...userWithoutConfirm } = userData;
  
  // Check if username already exists
  const existingUserByUsername = await storage.getUserByUsername(userData.username);
  if (existingUserByUsername) {
    throw new Error("Username is already taken");
  }
  
  // Check if email already exists
  const existingUserByEmail = await storage.getUserByEmail(userData.email);
  if (existingUserByEmail) {
    throw new Error("Email is already registered");
  }
  
  // Hash password
  const hashedPassword = await hash(userData.password, SALT_ROUNDS);
  
  // Create new user with initial balance of 0
  const newUser = await storage.createUser({
    ...userWithoutConfirm,
    password: hashedPassword,
    balance: 0, // Explicitly set balance to 0 for new users
    isAdmin: false
  });
  
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export async function loginUser(storage: IStorage, credentials: z.infer<typeof loginSchema>) {
  const user = await storage.getUserByUsername(credentials.username);
  
  if (!user) {
    throw new Error("Invalid username or password");
  }
  
  const isPasswordValid = await compare(credentials.password, user.password);
  
  if (!isPasswordValid) {
    throw new Error("Invalid username or password");
  }
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.user) {
    return next();
  }
  
  res.status(401).json({ message: "Unauthorized" });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  
  res.status(403).json({ message: "Forbidden - Admin access required" });
}
