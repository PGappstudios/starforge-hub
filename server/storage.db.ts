import {
  users,
  globalLeaderboards,
  game1Leaderboard,
  game2Leaderboard,
  game3Leaderboard,
  game4Leaderboard,
  game5Leaderboard,
  game6Leaderboard,
  type User,
  type InsertUser,
  type UpdateUserProfile,
  type GlobalLeaderboard,
  type Game1Leaderboard,
  type Game2Leaderboard,
  type Game3Leaderboard,
  type Game4Leaderboard,
  type Game5Leaderboard,
  type Game6Leaderboard,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

const GAMES_CONFIG = {
  1: { name: "Space Shooter" },
  2: { name: "Space Snake" },
  3: { name: "Memory Match" },
  4: { name: "Star Atlas Quiz" },
  5: { name: "Puzzle Master" },
  6: { name: "Resource Runner" },
} as const;

export class DatabaseStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(
    userId: number,
    profileData: UpdateUserProfile,
  ): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserCredits(
    userId: number,
    credits: number,
  ): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async addUserCredits(userId: number, amount: number): Promise<User | undefined> {
    const currentUser = await this.getUser(userId);
    if (!currentUser) return undefined;
    const newCredits = currentUser.credits + amount;
    return this.updateUserCredits(userId, newCredits);
  }

  async spendUserCredits(
    userId: number,
    amount: number,
  ): Promise<User | undefined> {
    const currentUser = await this.getUser(userId);
    if (!currentUser || currentUser.credits < amount) return undefined;
    const newCredits = currentUser.credits - amount;
    return this.updateUserCredits(userId, newCredits);
  }

  async getGlobalLeaderboard(
    limit = 50,
  ): Promise<(GlobalLeaderboard & { user: User })[]> {
    const leaderboards = await db
      .select({ globalLeaderboard: globalLeaderboards, user: users })
      .from(globalLeaderboards)
      .innerJoin(users, eq(globalLeaderboards.userId, users.id))
      .orderBy(desc(globalLeaderboards.totalPoints))
      .limit(limit);

    return leaderboards.map(({ globalLeaderboard, user }) => ({
      ...globalLeaderboard,
      user,
    }));
  }

  async updateGlobalLeaderboard(userId: number, points: number): Promise<void> {
    // Calculate user's total by summing their BEST score from each game (1-6)
    let calculatedTotal = 0;
    let totalGamesPlayed = 0;

    for (let gameId = 1; gameId <= 6; gameId++) {
      const gameTable = this.getGameTable(gameId);

      // Get user's best score from this specific game
      const userGameScores = await db
        .select()
        .from(gameTable)
        .where(eq(gameTable.userId, userId));

      if (userGameScores.length > 0) {
        const bestScore = Math.max(...userGameScores.map((entry) => entry.score));
        calculatedTotal += bestScore;
        totalGamesPlayed += userGameScores.length;
      }
    }

    console.log(`Global leaderboard calculation for user ${userId}: Total = ${calculatedTotal} (from ${totalGamesPlayed} total game sessions across all games)`);

    // Update global leaderboard entry
    const [existingEntry] = await db
      .select()
      .from(globalLeaderboards)
      .where(eq(globalLeaderboards.userId, userId));

    if (existingEntry) {
      await db
        .update(globalLeaderboards)
        .set({
          totalPoints: calculatedTotal, // SET the calculated total, don't add
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(globalLeaderboards.userId, userId));
    } else {
      await db.insert(globalLeaderboards).values({
        userId,
        totalPoints: calculatedTotal,
        rank: 1,
        lastUpdated: new Date(),
      });
    }

    // Update user's total points and games played count
    await db
      .update(users)
      .set({
        totalPoints: calculatedTotal, // SET the calculated total, don't add
        gamesPlayed: totalGamesPlayed,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await this.updateRanks();
  }

  private async updateRanks(): Promise<void> {
    const allEntries = await db
      .select()
      .from(globalLeaderboards)
      .orderBy(desc(globalLeaderboards.totalPoints));

    for (let i = 0; i < allEntries.length; i++) {
      await db
        .update(globalLeaderboards)
        .set({ rank: i + 1, updatedAt: new Date() })
        .where(eq(globalLeaderboards.id, allEntries[i].id));
    }
  }

  async getUserLeaderboardPosition(
    userId: number,
    gameId?: number,
    type: "monthly" | "yearly" = "monthly",
  ): Promise<number> {
    if (gameId && type) {
      const leaderboard = await this.getIndividualGameLeaderboard(gameId, type, 100);
      const position = leaderboard.findIndex((entry: any) => entry.userId === userId);
      return position === -1 ? 0 : position + 1;
    } else {
      const [entry] = await db
        .select()
        .from(globalLeaderboards)
        .where(eq(globalLeaderboards.userId, userId));
      return entry?.rank || 0;
    }
  }

  async resetMonthlyLeaderboards(): Promise<void> {
    for (let gameId = 1; gameId <= 6; gameId++) {
      const gameTable = this.getGameTable(gameId);
      await db.delete(gameTable).where(eq(gameTable.leaderboardType, "monthly"));
    }
  }

  async resetYearlyLeaderboards(): Promise<void> {
    for (let gameId = 1; gameId <= 6; gameId++) {
      const gameTable = this.getGameTable(gameId);
      await db.delete(gameTable).where(eq(gameTable.leaderboardType, "yearly"));
    }
  }

  async updateGameResult(userId: number, points: number): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${points}`,
        gamesPlayed: sql`${users.gamesPlayed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || null;
  }

  async getAllUsersForLeaderboard(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.totalPoints));
  }

  getCurrentPeriod(type: "monthly" | "yearly"): { start: Date; end: Date } {
    const now = new Date();
    if (type === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return { start, end };
    } else {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }

  async getUserGameBreakdown(
    userId: number,
  ): Promise<
    Array<{
      gameId: number;
      gameName: string;
      bestScore: number;
      totalPoints: number;
      gamesPlayed: number;
    }>
  > {
    const breakdown: Record<
      number,
      { gameId: number; gameName: string; bestScore: number; totalPoints: number; gamesPlayed: number }
    > = {};

    for (let gameId = 1; gameId <= 6; gameId++) {
      const gameTable = this.getGameTable(gameId);
      const gameName = GAMES_CONFIG[gameId as keyof typeof GAMES_CONFIG]?.name || `Game ${gameId}`;
      const sessions = await db
        .select()
        .from(gameTable)
        .where(eq(gameTable.userId, userId));

      if (sessions.length > 0) {
        const bestScore = Math.max(...sessions.map((s) => s.score));
        // Dashboard should show best score, not sum of all sessions
        breakdown[gameId] = {
          gameId,
          gameName,
          bestScore,
          totalPoints: bestScore, // Use best score instead of summing all points
          gamesPlayed: sessions.length,
        };
      }
    }

    return Object.values(breakdown);
  }

  async addGameLeaderboardEntry(gameId: number, userId: number, score: number): Promise<any> {
    const gameTable = this.getGameTable(gameId);
    const { start, end } = this.getCurrentPeriod("monthly");
    const yearPeriod = this.getCurrentPeriod("yearly");

    const points = score; // No multiplier, score = points

    const user = await this.getUser(userId);
    if (!user) throw new Error(`User ${userId} not found`);

    const monthlyEntry = {
      userId,
      username: user.username,
      score,
      points,
      leaderboardType: "monthly" as const,
      periodStart: start,
      periodEnd: end,
      playedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const yearlyEntry = {
      userId,
      username: user.username,
      score,
      points,
      leaderboardType: "yearly" as const,
      periodStart: yearPeriod.start,
      periodEnd: yearPeriod.end,
      playedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [monthlyResult] = await db.insert(gameTable).values(monthlyEntry).returning();
    const [yearlyResult] = await db.insert(gameTable).values(yearlyEntry).returning();
    return { monthly: monthlyResult, yearly: yearlyResult };
  }

  async getIndividualGameLeaderboard(
    gameId: number,
    type: "monthly" | "yearly",
    limit: number,
  ): Promise<any[]> {
    const gameTable = this.getGameTable(gameId);
    const results = await db
      .select({
        // Game leaderboard fields
        id: gameTable.id,
        userId: gameTable.userId,
        username: gameTable.username,
        score: gameTable.score,
        points: gameTable.points,
        playedAt: gameTable.playedAt,
        leaderboardType: gameTable.leaderboardType,
        periodStart: gameTable.periodStart,
        periodEnd: gameTable.periodEnd,
        createdAt: gameTable.createdAt,
        updatedAt: gameTable.updatedAt,
        // User fields nested under 'user'
        user: {
          id: users.id,
          username: users.username,
          faction: users.faction,
          totalPoints: users.totalPoints,
          gamesPlayed: users.gamesPlayed
        }
      })
      .from(gameTable)
      .innerJoin(users, eq(gameTable.userId, users.id))
      .where(eq(gameTable.leaderboardType, type))
      .orderBy(desc(gameTable.score))
      .limit(limit);
    return results;
  }

  // Reset all game data for a specific user
  async resetUserGameData(userId: number): Promise<void> {
    // Delete from global leaderboard
    await db.delete(globalLeaderboards).where(eq(globalLeaderboards.userId, userId));

    // Delete from all individual game leaderboards
    for (let gameId = 1; gameId <= 6; gameId++) {
      const gameTable = this.getGameTable(gameId);
      await db.delete(gameTable).where(eq(gameTable.userId, userId));
    }

    // Reset user's total points and games played
    await db
      .update(users)
      .set({
        totalPoints: 0,
        gamesPlayed: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`Reset all game data for user ${userId}`);
  }

  private getGameTable(
    gameId: number,
  ):
    | typeof game1Leaderboard
    | typeof game2Leaderboard
    | typeof game3Leaderboard
    | typeof game4Leaderboard
    | typeof game5Leaderboard
    | typeof game6Leaderboard {
    switch (gameId) {
      case 1:
        return game1Leaderboard as typeof game1Leaderboard;
      case 2:
        return game2Leaderboard as typeof game2Leaderboard;
      case 3:
        return game3Leaderboard as typeof game3Leaderboard;
      case 4:
        return game4Leaderboard as typeof game4Leaderboard;
      case 5:
        return game5Leaderboard as typeof game5Leaderboard;
      case 6:
        return game6Leaderboard as typeof game6Leaderboard;
      default:
        throw new Error(`Invalid game ID: ${gameId}`);
    }
  }
}

export { GAMES_CONFIG };