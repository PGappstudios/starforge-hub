
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coins, AlertTriangle } from 'lucide-react';
import PuzzleGame from '@/components/games/PuzzleGame';
import { PuzzleResult } from '@/types/puzzle';
import { useCredits } from '@/contexts/CreditsContext';
import { useGameResults } from '@/hooks/useGameResults';

const Game5 = () => {
  console.log('Game5 component rendering...');
  
  const [gameResult, setGameResult] = useState<PuzzleResult | null>(null);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { credits, canAfford, spendCredits } = useCredits();
  const { submitGameResult } = useGameResults();
  
  const GAME_COST = 1;

  const handleGameEnd = (result: PuzzleResult) => {
    console.log('Game ended with result:', result);
    setGameResult(result);
    
    // Submit score to leaderboard
    if (result.score > 0) {
      submitGameResult(result.score, 'game5');
    }
  };

  const handleGameStart = () => {
    if (!hasPlayedGame && canAfford(GAME_COST)) {
      setHasPlayedGame(true);
      setIsPlaying(true);
      spendCredits(GAME_COST, 'Star Seekers Puzzle - Game Started');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game Hub
            </Button>
          </Link>
          
          {/* Credit Status */}
          <div className="text-center mb-6">
            <Badge variant="outline" className="text-white border-white/50 bg-white/10">
              <Coins className="w-4 h-4 mr-2" />
              Credits: {credits}
            </Badge>
          </div>

          {/* Insufficient Credits Warning */}
          {!canAfford(GAME_COST) && (
            <Card className="max-w-md mx-auto mb-8 bg-red-900/20 border-red-500/50">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <h3 className="text-xl font-bold text-red-400 mb-2">Insufficient Credits</h3>
                <p className="text-red-300 mb-4">
                  You need {GAME_COST} credit to play this game. You currently have {credits} credits.
                </p>
                <p className="text-sm text-red-200">
                  Earn more credits by completing other games or challenges!
                </p>
              </CardContent>
            </Card>
          )}
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
              STAR SEEKERS PUZZLE
            </h1>
            <div className="flex justify-center gap-4 mb-4">
              <Badge variant="outline" className="text-orange-400 border-orange-400">
                <Coins className="w-4 h-4 mr-2" />
                Cost: {GAME_COST} Credit
              </Badge>
            </div>
          </div>
        </div>
        {canAfford(GAME_COST) ? (
          <PuzzleGame 
            onGameStart={handleGameStart}
            onGameEnd={handleGameEnd}
          />
        ) : (
          <Card className="max-w-md mx-auto bg-gray-800/50 border-gray-600">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-300">
                You need {GAME_COST} credit to play this puzzle game.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Game5;
