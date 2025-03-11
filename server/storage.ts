import { IStorage } from "./types";
import { User, InsertUser, SharedCode, InsertSharedCode } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { nanoid } from "nanoid";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sharedCode: Map<string, SharedCode>;
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.sharedCode = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSharedCode(userId: number, data: InsertSharedCode): Promise<SharedCode> {
    const shareId = nanoid(10); // Generate a short unique ID
    const sharedCode: SharedCode = {
      id: this.currentId++,
      shareId,
      userId,
      ...data,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };
    this.sharedCode.set(shareId, sharedCode);
    return sharedCode;
  }

  async getSharedCode(shareId: string): Promise<SharedCode | undefined> {
    const code = this.sharedCode.get(shareId);
    if (!code) return undefined;

    // Check if code has expired
    if (code.expiresAt && code.expiresAt < new Date()) {
      this.sharedCode.delete(shareId);
      return undefined;
    }

    return code;
  }

  async getUserSharedCode(userId: number): Promise<SharedCode[]> {
    return Array.from(this.sharedCode.values())
      .filter(code => code.userId === userId)
      .filter(code => !code.expiresAt || code.expiresAt > new Date());
  }
}

export const storage = new MemStorage();
