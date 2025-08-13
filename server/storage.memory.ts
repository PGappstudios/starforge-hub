import type {
  User,
  UpdateUserProfile,
} from "../shared/schema";

type LeaderboardType = "monthly" | "yearly";

interface InMemoryLeaderboardEntry {
  id: number;
  userId: number;
  username: string;
  score: number;
  points: number;
  playedAt: Date;
  leaderboardType: LeaderboardType;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GlobalLeaderboardEntry {
  id: number;
  userId: number;
  totalPoints: number;
  rank: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GAMES_CONFIG = {
  1: { name: "Space Shooter" },
  2: { name: "Space Snake" },
  3: { name: "Memory Match" },
  4: { name: "Star Atlas Quiz" },
  5: { name: "Puzzle Master" },
  6: { name: "Resource Runner" },
} as const;

export class MemoryStorage {
  private users: Map<number, User> = new Map();
  private usersByEmail: Map<string, number> = new Map();
  private usersByUsername: Map<string, number> = new Map();
  private nextUserId = 1;

  private global: Map<number, GlobalLeaderboardEntry> = new Map();
  private nextGlobalId = 1;

  private leaderboards: Record<
    number,
    InMemoryLeaderboardEntry[]
  > = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  private nextLeaderboardId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const id = this.usersByUsername.get(username);
    return id ? this.users.get(id) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const id = this.usersByEmail.get(email);
    return id ? this.users.get(id) : undefined;
  }

  async createUser(insertUser: { username: string; email: string; password: string }): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: this.nextUserId++,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      solanaWallet: null,
      faction: null,
      totalPoints: 0,
      gamesPlayed: 0,
      achievements: 0,
      credits: 10,
      createdAt: now,
      updatedAt: now,
    } as unknown as User; // cast to satisfy type shape; matches fields used by client

    this.users.set(user.id, user);
    this.usersByEmail.set(user.email as string, user.id);
    this.usersByUsername.set(user.username, user.id);
    return user;
  }

  async updateUserProfile(userId: number, profileData: UpdateUserProfile): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, ...profileData, updatedAt: new Date().toISOString() } as User;
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserCredits(userId: number, credits: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, credits, updatedAt: new Date().toISOString() } as User;
    this.users.set(userId, updated);
    return updated;
  }

  async addUserCredits(userId: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    return this.updateUserCredits(userId, (user.credits || 0) + amount);
  }

  async spendUserCredits(userId: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user || (user.credits || 0) < amount) return undefined;
    return this.updateUserCredits(userId, (user.credits || 0) - amount);
  }

  async getGlobalLeaderboard(limit = 50): Promise<(GlobalLeaderboardEntry & { user: User })[]> {
    const entries = Array.from(this.global.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((g) => ({ ...g, user: this.users.get(g.userId)! }));
    return entries;
  }

  private recomputeRanks() {
    const ordered = Array.from(this.global.values()).sort((a, b) => b.totalPoints - a.totalPoints);
    ordered.forEach((entry, idx) => {
      entry.rank = idx + 1;
      entry.updatedAt = new Date();
      this.global.set(entry.id, entry);
    });
  }

  async updateGlobalLeaderboard(userId: number, points: number): Promise<void> {
    const now = new Date();
    
    // Calculate user's total by summing their BEST score from each game (1-6)
    let calculatedTotal = 0;
    let totalGamesPlayed = 0;
    
    for (let gameId = 1; gameId <= 6; gameId++) {
      // Get user's best score from this specific game
      const userGameScores = this.leaderboards[gameId]
        .filter((entry) => entry.userId === userId)
        .map((entry) => entry.score);
      
      if (userGameScores.length > 0) {
        const bestScore = Math.max(...userGameScores);
        calculatedTotal += bestScore;
        totalGamesPlayed += userGameScores.length;
      }
    }
    
    console.log(`Global leaderboard calculation for user ${userId}: Total = ${calculatedTotal} (from ${totalGamesPlayed} total game sessions across all games)`);
    
    // Update global leaderboard entry
    let existing = Array.from(this.global.values()).find((e) => e.userId === userId);
    if (!existing) {
      existing = {
        id: this.nextGlobalId++,
        userId,
        totalPoints: calculatedTotal,
        rank: 0,
        lastUpdated: now,
        createdAt: now,
        updatedAt: now,
      };
      this.global.set(existing.id, existing);
    } else {
      existing.totalPoints = calculatedTotal; // SET the calculated total, don't add
      existing.lastUpdated = now;
      existing.updatedAt = now;
    }

    // Update user's total points and games played count
    const user = this.users.get(userId);
    if (user) {
      user.totalPoints = calculatedTotal; // SET the calculated total, don't add
      user.gamesPlayed = totalGamesPlayed;
      user.updatedAt = now.toISOString() as any;
      this.users.set(userId, user);
    }

    this.recomputeRanks();
  }

  async getUserLeaderboardPosition(userId: number, gameId?: number, type: LeaderboardType = "monthly"): Promise<number> {
    if (gameId) {
      const list = this.leaderboards[gameId].filter((e) => e.leaderboardType === type);
      const ordered = list.sort((a, b) => b.score - a.score);
      const idx = ordered.findIndex((e) => e.userId === userId);
      return idx === -1 ? 0 : idx + 1;
    }
    const orderedGlobal = Array.from(this.global.values()).sort((a, b) => b.totalPoints - a.totalPoints);
    const idx = orderedGlobal.findIndex((e) => e.userId === userId);
    return idx === -1 ? 0 : idx + 1;
  }

  async resetMonthlyLeaderboards(): Promise<void> {
    for (let gameId = 1; gameId <= 6; gameId++) {
      this.leaderboards[gameId] = this.leaderboards[gameId].filter((e) => e.leaderboardType !== "monthly");
    }
  }

  async resetYearlyLeaderboards(): Promise<void> {
    for (let gameId = 1; gameId <= 6; gameId++) {
      this.leaderboards[gameId] = this.leaderboards[gameId].filter((e) => e.leaderboardType !== "yearly");
    }
  }

  async updateGameResult(userId: number, points: number): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    user.totalPoints = (user.totalPoints || 0) + points;
    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
    user.updatedAt = new Date().toISOString() as any;
    this.users.set(userId, user);
    return user;
  }

  async getAllUsersForLeaderboard(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }

  getCurrentPeriod(type: LeaderboardType): { start: Date; end: Date } {
    const now = new Date();
    if (type === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    } else {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }


  async addGameLeaderboardEntry(gameId: number, userId: number, score: number): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) throw new Error(`User ${userId} not found`);

    // No multiplier - score equals points
    const points = score;
    const monthly = this.createEntry(gameId, userId, user.username, score, points, "monthly");
    const yearly = this.createEntry(gameId, userId, user.username, score, points, "yearly");

    await this.updateGlobalLeaderboard(userId, points);
    return { monthly, yearly };
  }

  async getIndividualGameLeaderboard(gameId: number, type: LeaderboardType, limit: number): Promise<any[]> {
    return this.leaderboards[gameId]
      .filter((e) => e.leaderboardType === type)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => ({
        ...entry,
        user: this.users.get(entry.userId)
      }));
  }

  private createEntry(
    gameId: number,
    userId: number,
    username: string,
    score: number,
    points: number,
    type: LeaderboardType,
  ) {
    const period = this.getCurrentPeriod(type);
    const entry: InMemoryLeaderboardEntry = {
      id: this.nextLeaderboardId++,
      userId,
      username,
      score,
      points,
      leaderboardType: type,
      periodStart: period.start,
      periodEnd: period.end,
      playedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leaderboards[gameId].push(entry);
    return entry;
  }

  // Reset all game data for a specific user
  async resetUserGameData(userId: number): Promise<void> {
    // Remove user from global leaderboard
    this.globalLeaderboard = this.globalLeaderboard.filter(entry => entry.userId !== userId);
    
    // Remove user from all individual game leaderboards
    for (let gameId = 1; gameId <= 6; gameId++) {
      this.leaderboards[gameId] = this.leaderboards[gameId].filter(entry => entry.userId !== userId);
    }
    
    // Reset user's total points and games played
    const user = this.users.get(userId);
    if (user) {
      user.totalPoints = 0;
      user.gamesPlayed = 0;
      user.updatedAt = new Date();
    }
    
    console.log(`Reset all game data for user ${userId}`);
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
      const gameName = GAMES_CONFIG[gameId as keyof typeof GAMES_CONFIG]?.name || `Game ${gameId}`;
      const userGameSessions = this.leaderboards[gameId].filter((entry) => entry.userId === userId);

      if (userGameSessions.length > 0) {
        const bestScore = Math.max(...userGameSessions.map((s) => s.score));
        // Dashboard should show best score, not sum of all sessions
        breakdown[gameId] = {
          gameId,
          gameName,
          bestScore,
          totalPoints: bestScore, // Use best score instead of summing all points
          gamesPlayed: userGameSessions.length,
        };
      }
    }

    return Object.values(breakdown);
  }
}

export { GAMES_CONFIG };



