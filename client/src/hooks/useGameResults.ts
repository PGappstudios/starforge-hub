
import { useAuth } from '@/contexts/AuthContext';
import { recordGameSession } from '@/utils/gameLeaderboard';

export const useGameResults = () => {
  const { checkAuthStatus } = useAuth();

  const submitGameResult = async (score: number, gameId: string): Promise<boolean> => {
    try {
      // Convert gameId string to number
      const gameIdNum = parseInt(gameId.replace('game', ''), 10);
      
      // Record to leaderboard
      const success = await recordGameSession({
        gameId: gameIdNum,
        score: score,
        points: score // No multiplier, score = points
      });

      if (success) {
        // Refresh auth to get updated user data
        await checkAuthStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error submitting game result:', error);
      return false;
    }
  };

  return { submitGameResult };
};
