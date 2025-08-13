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
  resetUserGameData(userId: number): Promise<void>;
}

const hasDatabaseUrl = !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0;

// Lazy-resolve storage to avoid importing DB layer when DATABASE_URL is not set
let storageInstance: IStorage | null = null;

export async function getStorage(): Promise<IStorage> {
  if (storageInstance) return storageInstance;
  
  if (hasDatabaseUrl) {
    const mod = await import("./storage.db.ts");
    storageInstance = new mod.DatabaseStorage();
  } else {
    const mod = await import("./storage.memory.ts");
    storageInstance = new mod.MemoryStorage();
  }
  
  return storageInstance;
}

// For backwards compatibility
export const storage = {
  async getUser(id: number) { return (await getStorage()).getUser(id); },
  async getUserByUsername(username: string) { return (await getStorage()).getUserByUsername(username); },
  async getUserByEmail(email: string) { return (await getStorage()).getUserByEmail(email); },
  async createUser(user: { username: string; email: string; password: string }) { return (await getStorage()).createUser(user); },
  async updateUserProfile(id: number, profile: any) { return (await getStorage()).updateUserProfile(id, profile); },
  async updateUserCredits(userId: number, credits: number) { return (await getStorage()).updateUserCredits(userId, credits); },
  async addUserCredits(userId: number, amount: number) { return (await getStorage()).addUserCredits(userId, amount); },
  async spendUserCredits(userId: number, amount: number) { return (await getStorage()).spendUserCredits(userId, amount); },
  async getGlobalLeaderboard(limit?: number) { return (await getStorage()).getGlobalLeaderboard(limit); },
  async updateGlobalLeaderboard(userId: number, points: number) { return (await getStorage()).updateGlobalLeaderboard(userId, points); },
  async getUserLeaderboardPosition(userId: number, gameId?: number, type?: "monthly" | "yearly") { return (await getStorage()).getUserLeaderboardPosition(userId, gameId, type); },
  async resetMonthlyLeaderboards() { return (await getStorage()).resetMonthlyLeaderboards(); },
  async resetYearlyLeaderboards() { return (await getStorage()).resetYearlyLeaderboards(); },
  async updateGameResult(userId: number, points: number) { return (await getStorage()).updateGameResult(userId, points); },
  async getAllUsersForLeaderboard() { return (await getStorage()).getAllUsersForLeaderboard(); },
  getCurrentPeriod(type: "monthly" | "yearly") { throw new Error("getCurrentPeriod must be called directly on storage instance"); },
  async getUserGameBreakdown(userId: number) { return (await getStorage()).getUserGameBreakdown(userId); },
  async addGameLeaderboardEntry(gameId: number, userId: number, score: number) { return (await getStorage()).addGameLeaderboardEntry(gameId, userId, score); },
  async getIndividualGameLeaderboard(gameId: number, type: "monthly" | "yearly", limit: number) { return (await getStorage()).getIndividualGameLeaderboard(gameId, type, limit); },
  async resetUserGameData(userId: number) { return (await getStorage()).resetUserGameData(userId); },
} as IStorage;