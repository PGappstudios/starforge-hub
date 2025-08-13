import { LeaderboardData, Player, PlayerScore, GameScore, GameLeaderboard, GlobalLeaderboard } from "@/types/leaderboard";

const games = [
  { id: "game1", name: "Cosmic Battle Arena" },
  { id: "game2", name: "Stellar Mining" },
  { id: "game3", name: "Space Traders" },
  { id: "game4", name: "Lore Master" },
  { id: "game5", name: "Star Seekers Puzzle" },
  { id: "game6", name: "Cargo Runner" },
];

// Function to create leaderboard data from real users (to be called when we have real user data)
export const createLeaderboardFromUsers = (users: any[]): LeaderboardData => {
  const playerScores: PlayerScore[] = users.map(user => ({
    player: {
      id: user.id.toString(),
      username: user.username,
      faction: user.faction || "oni"
    },
    totalScore: user.totalPoints || 0,
    gamesWon: Math.floor((user.gamesPlayed || 0) * 0.6), // Assume 60% win rate
    gameScores: []
  }));

  playerScores.sort((a, b) => b.totalScore - a.totalScore);

  const global: GlobalLeaderboard = {
    players: playerScores,
    lastUpdated: new Date()
  };

  // Removed: gameLeaderboards mock data - now using individual game tables

  return {
    global,
    games: []  // Individual game leaderboards now handled by separate API endpoints
  };
};

// Export empty data as fallback (no mock data)
export const mockLeaderboardData: LeaderboardData = {
  global: {
    players: [],
    lastUpdated: new Date(),
  },
  games: games.map(game => ({
    gameId: game.id,
    gameName: game.name,
    monthly: [],
    yearly: [],
    allTime: [],
    lastMonthlyReset: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    lastYearlyReset: new Date(new Date().getFullYear(), 0, 1),
    nextMonthlyReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    nextYearlyReset: new Date(new Date().getFullYear() + 1, 0, 1),
  }))
};