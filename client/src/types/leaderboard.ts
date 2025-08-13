export interface Player {
  id: string;
  username: string;
  faction: "oni" | "mud" | "ustur";
}

export interface GameScore {
  gameId: string;
  gameName: string;
  score: number;
  timestamp: Date;
}

export interface PlayerScore {
  player: Player;
  totalScore: number;
  gamesWon: number;
  gameScores: GameScore[];
}

export interface GameLeaderboard {
  gameId: string;
  gameName: string;
  monthly: PlayerScore[];
  yearly: PlayerScore[];
  allTime: PlayerScore[];
  lastMonthlyReset: Date;
  lastYearlyReset: Date;
  nextMonthlyReset: Date;
  nextYearlyReset: Date;
}

export interface GlobalLeaderboard {
  players: PlayerScore[];
  lastUpdated: Date;
}

export interface LeaderboardData {
  global: GlobalLeaderboard;
  games: GameLeaderboard[];
}

export type LeaderboardPeriod = "monthly" | "yearly" | "allTime";

export interface LeaderboardEntry {
  rank: number;
  player: Player;
  score: number;
  gamesWon: number;
  isCurrentUser?: boolean;
}