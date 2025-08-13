
/**
 * Game Leaderboard Integration Utilities
 * 
 * This utility provides easy integration for games to record scores
 * and interact with the comprehensive leaderboard system.
 */

export interface GameSessionData {
  gameId: number;           // 1-6 for the 6 games
  score: number;           // Player's score in this session
  points: number;          // Points earned (can be calculated from score)
  duration?: number;       // Optional: game duration in seconds
}

export interface UserGameBreakdown {
  gameId: number;
  gameName: string;
  bestScore: number;
  totalPoints: number;
  gamesPlayed: number;
}

export interface LeaderboardEntry {
  id: number;
  userId: number;
  gameId?: number;
  gameName?: string;
  score?: number;
  points?: number;
  totalPoints?: number;
  user: {
    id: number;
    username: string;
    faction?: string;
  };
}

/**
 * Game configuration mapping
 */
export const GAMES_CONFIG = {
  1: { name: "Space Shooter", description: "Defend against waves of enemies in space" },
  2: { name: "Space Snake", description: "Classic snake game in space" },
  3: { name: "Memory Match", description: "Match pairs of Star Atlas cards" },
  4: { name: "Star Atlas Quiz", description: "Test your knowledge of the Star Atlas universe" },
  5: { name: "Puzzle Master", description: "Solve challenging Star Atlas puzzles" },
  6: { name: "Resource Runner", description: "Collect resources while avoiding obstacles" }
} as const;

// Note: Previously calculated points with multipliers, now removed entirely.
// All games now use a 1:1 score-to-points ratio.

/**
 * Record a game session and update all leaderboards
 * This will:
 * - Save the individual game session to the appropriate game table
 * - Update monthly leaderboard (resets each month)
 * - Update yearly leaderboard (resets each year) 
 * - Update global Hall of Fame (never resets)
 */
export async function recordGameSession(sessionData: GameSessionData): Promise<boolean> {
  try {
    // Add game name based on gameId
    const gameName = GAMES_CONFIG[sessionData.gameId as keyof typeof GAMES_CONFIG]?.name || `Game ${sessionData.gameId}`;
    
    console.log('Sending game session data:', {
      gameId: sessionData.gameId,
      score: sessionData.score,
      points: sessionData.points,
      gameName,
      duration: sessionData.duration
    });

    const response = await fetch('/api/games/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({
        gameId: sessionData.gameId,
        score: sessionData.score,
        points: sessionData.points
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to record game session: ${response.status} ${response.statusText}`, errorText);
      return false;
    }

    const result = await response.json();
    console.log('Game session recorded successfully:', result);
    
    // Also update global leaderboard
    try {
      const globalResponse = await fetch('/api/user/game-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          points: sessionData.points,
          gameId: sessionData.gameId
        }),
      });
      
      if (globalResponse.ok) {
        console.log('Global leaderboard updated successfully');
      }
    } catch (globalError) {
      console.warn('Failed to update global leaderboard:', globalError);
    }
    
    return true;
  } catch (error) {
    console.error('Error recording game session:', error);
    return false;
  }
}

/**
 * Get individual game leaderboard
 */
export async function getGameLeaderboard(gameId: number, type: 'monthly' | 'yearly' = 'monthly', limit: number = 50): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`/api/leaderboard/game/${gameId}?individual=true&type=${type}&limit=${limit}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Failed to fetch game leaderboard: ${response.statusText}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching game leaderboard:', error);
    return [];
  }
}

/**
 * Get global leaderboard
 */
export async function getGlobalLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`/api/leaderboard/global?limit=${limit}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Failed to fetch global leaderboard: ${response.statusText}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return [];
  }
}

/**
 * Get user's game breakdown
 */
export async function getUserGameBreakdown(userId: number): Promise<UserGameBreakdown[]> {
  try {
    const response = await fetch(`/api/user/${userId}/game-breakdown`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Failed to fetch user game breakdown: ${response.statusText}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user game breakdown:', error);
    return [];
  }
}
