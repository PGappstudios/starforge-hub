import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coins, AlertTriangle } from 'lucide-react';
import QuizGame from '@/components/games/QuizGame';
import { QuizResult } from '@/types/quiz';
import { useCredits } from '@/contexts/CreditsContext';
import { useGameResults } from '@/hooks/useGameResults';
import { useAudioManager } from '@/contexts/AudioManagerContext';
import { playGameSound } from '@/utils/audioFallback';

const Game4 = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameResult, setGameResult] = useState<QuizResult | null>(null);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const { credits, canAfford, spendCredits } = useCredits();
  const { submitGameResult } = useGameResults();
  const { audioSettings } = useAudioManager();

  const GAME_COST = 1;

  const handleGameEnd = (result: QuizResult) => {
    setGameResult(result);
    setGameStarted(false);

    if (result.points > 0) {
      playCorrectSound(); // Play sound for correct answers
    } else {
      playGameOverSound(); // Play game over sound if no points
    }

    if (hasPlayedGame) {
      // Submit score to leaderboard
      if (result.points > 0) {
        submitGameResult(result.points, 'game4');
      }
    }
  };

  const startGame = () => {
    if (!canAfford(GAME_COST)) {
      return; // Don't start if can't afford
    }
    setGameStarted(true);
    setGameResult(null);
    setHasPlayedGame(true);
    spendCredits(GAME_COST, 'Lore Master - Game Started');
  };

  // Sound effects with improved deployment handling
  const playCorrectSound = useCallback(async () => {
    if (audioSettings.muteAll) return;
    const volume = (audioSettings.sfxVolume / 100) * 0.5;
    await playGameSound('/assets/game6/correct-6033.mp3', volume);
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

  const playGameOverSound = useCallback(async () => {
    if (audioSettings.muteAll) return;
    const volume = (audioSettings.sfxVolume / 100) * 0.6;
    await playGameSound('/assets/game4/game-over-deep-male-voice-clip-352695.mp3', volume);
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);


  if (gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Game Hub
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                LORE MASTER
              </h1>
              <p className="text-gray-300">Test your knowledge of the Star Atlas universe</p>
            </div>
          </div>
          <QuizGame onGameEnd={handleGameEnd} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white">
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
        <Card className="bg-gray-900/30 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mb-6">
              <div className="text-6xl mb-4">🌌</div>
              <CardTitle className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                STAR ATLAS KNOWLEDGE TEST
              </CardTitle>
              <p className="text-xl text-gray-300 mb-4">
                Test your knowledge of the Star Atlas universe
              </p>
              <div className="flex justify-center gap-4 mb-6">
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  100 Questions
                </Badge>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  15s per question
                </Badge>
                <Badge variant="outline" className="text-red-400 border-red-400">
                  3 Strikes = Game Over
                </Badge>
                <Badge variant="outline" className="text-orange-400 border-orange-400">
                  <Coins className="w-4 h-4 mr-2" />
                  Cost: {GAME_COST} Credit
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold text-white mb-4">Game Rules</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="bg-gray-800/20 p-4 rounded-lg">
                  <h4 className="text-blue-400 font-semibold mb-2">🎯 Scoring</h4>
                  <p className="text-gray-300">100 points + remaining seconds bonus per correct answer</p>
                </div>
                <div className="bg-gray-800/20 p-4 rounded-lg">
                  <h4 className="text-yellow-400 font-semibold mb-2">⏰ Time Limit</h4>
                  <p className="text-gray-300">15 seconds per question - think fast!</p>
                </div>
                <div className="bg-gray-800/20 p-4 rounded-lg">
                  <h4 className="text-red-400 font-semibold mb-2">💀 Game Over</h4>
                  <p className="text-gray-300">Miss 3 questions and the game ends immediately</p>
                </div>
                <div className="bg-gray-800/20 p-4 rounded-lg">
                  <h4 className="text-purple-400 font-semibold mb-2">🎲 Challenge</h4>
                  <p className="text-gray-300">100 questions in random order - how far can you go?</p>
                </div>
              </div>
            </div>

            {gameResult && (
              <div className="text-center p-6 bg-gray-800/20 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Last Result</h3>
                <div className="text-4xl font-bold mb-2 text-blue-400">
                  {gameResult.points.toLocaleString()}
                </div>
                <div className="text-lg text-gray-300 mb-2">
                  <span className="text-white">{gameResult.score}</span>
                  <span className="text-gray-400">/{gameResult.totalQuestions} correct</span>
                  <span className="text-gray-400 ml-2">({gameResult.percentage.toFixed(1)}%)</span>
                </div>
                <div className="text-gray-300">
                  {gameResult.totalQuestions === 100 
                    ? "Perfect Score! All 100 questions completed!" 
                    : `Stopped at question ${gameResult.totalQuestions}`
                  }
                </div>
              </div>
            )}

            <div className="text-center">
              <Button 
                onClick={startGame}
                size="lg"
                disabled={!canAfford(GAME_COST)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canAfford(GAME_COST) ? 'Start Challenge - 1 Credit' : 'Insufficient Credits'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Game4;