// Facade: choose DB storage if DATABASE_URL is set, otherwise use in-memory storage
import type { User, UpdateUserProfile } from "../shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { username: string; email: string; password: string }): Promise<User>;
  updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User | undefined>;
  updateUserCredits(userId: number, credits: number): Promise<User | undefined>;
  addUserCredits(userId: number, amount: number): Promise<User | undefined>;
  spendUserCredits(userId: number, amount: number): Promise<User | undefined>;
  getGlobalLeaderboard(limit?: number): Promise<any[]>;
  updateGlobalLeaderboard(userId: number, points: number): Promise<void>;
  getUserLeaderboardPosition(userId: number, gameId?: number, type?: "monthly" | "yearly"): Promise<number>;
  resetMonthlyLeaderboards(): Promise<void>;
  resetYearlyLeaderboards(): Promise<void>;
  updateGameResult(userId: number, points: number): Promise<User | null>;
  getAllUsersForLeaderboard(): Promise<User[]>;
  getCurrentPeriod(type: "monthly" | "yearly"): { start: Date; end: Date };
  getUserGameBreakdown(userId: number): Promise<
    Array<{ gameId: number; gameName: string; bestScore: number; totalPoints: number; gamesPlayed: number }>
  >;
  addGameLeaderboardEntry(gameId: number, userId: number, score: number): Promise<any>;
  getIndividualGameLeaderboard(gameId: number, type: "monthly" | "yearly", limit: number): Promise<any[]>;
}

const hasDatabaseUrl = !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0;

// Lazy-resolve storage to avoid importing DB layer when DATABASE_URL is not set
let resolvedStorage: IStorage;
if (hasDatabaseUrl) {
  const mod = await import("./storage.db.ts");
  resolvedStorage = new mod.DatabaseStorage();
} else {
  const mod = await import("./storage.memory.ts");
  resolvedStorage = new mod.MemoryStorage();
}

export const storage: IStorage = resolvedStorage;