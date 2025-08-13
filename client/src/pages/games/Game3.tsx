import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Star, Brain, Coins, AlertTriangle } from "lucide-react";
import MemoryCardGame from "@/components/games/MemoryCardGame";
import { useCredits } from "@/contexts/CreditsContext";
import { useGameResults } from "@/hooks/useGameResults";

const Game3 = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const { credits, canAfford, spendCredits } = useCredits();
  const { submitGameResult } = useGameResults();

  const GAME_COST = 1;

  return (
    <div className={`min-h-screen ${isPlaying ? 'bg-black' : 'cosmic-bg'}`}>
      {!isPlaying && <Navigation />}

      {!isPlaying && (
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="outline" className="nav-button">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Credit Status */}
          <div className="text-center mb-6">
            <Badge variant="outline" className="font-futuristic text-white border-white/50 bg-white/10">
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

          {/* Game Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-futuristic font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] mb-4">
              COSMIC MEMORY CHALLENGE
            </h1>
            <p className="text-xl text-white mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] font-medium">
              Test your memory with stunning cosmic imagery
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                <Brain className="w-4 h-4 mr-2" />
                Memory Game
              </Badge>
              <Badge variant="outline" className="font-futuristic text-white border-white/50 bg-white/10">
                <Trophy className="w-4 h-4 mr-2" />
                Max: 12000 Points
              </Badge>
              <Badge variant="secondary" className="font-futuristic text-white bg-white/20">
                <Star className="w-4 h-4 mr-2" />
                Your Best: --
              </Badge>
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
                <Coins className="w-4 h-4 mr-2" />
                Cost: {GAME_COST} Credit
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className={`${isPlaying ? 'min-h-screen p-8' : 'container mx-auto px-4'}`}>
        {canAfford(GAME_COST) ? (
          isPlaying ? (
            <div className="space-y-4">
              {/* In-game back button */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setIsPlaying(false)}
                  className="nav-button"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Menu
                </Button>
                <h2 className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                  COSMIC MEMORY CHALLENGE
                </h2>
              </div>
              <MemoryCardGame
                onGameStateChange={(playing) => {
                  setIsPlaying(playing);
                  if (playing && !hasPlayedGame) {
                    setHasPlayedGame(true);
                    spendCredits(GAME_COST, 'Cosmic Memory Challenge - Game Started');
                  }
                }}
                onGameEnd={(score) => {
                  if (!gameEnded) {
                    setGameEnded(true);
                    // MemoryCardGame handles score submission internally via recordGameSessionToAPI
                  }
                }}
              />
            </div>
          ) : (
            <Card className="game-card max-w-6xl mx-auto mb-8">
              <CardHeader>
                <CardTitle className="font-futuristic text-2xl text-center text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                  Memory Challenge Arena
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MemoryCardGame
                  onGameStateChange={(playing) => {
                    setIsPlaying(playing);
                    if (playing && !hasPlayedGame) {
                      setHasPlayedGame(true);
                      spendCredits(GAME_COST, 'Cosmic Memory Challenge - Game Started');
                    }
                  }}
                  onGameEnd={(score) => {
                    if (!gameEnded) {
                      setGameEnded(true);
                      // MemoryCardGame handles score submission internally via recordGameSessionToAPI
                    }
                  }}
                />
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="max-w-md mx-auto bg-gray-800/50 border-gray-600">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-300">
                You need {GAME_COST} credit to play this memory game.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Game Stats - Only show when not playing */}
        {!isPlaying && (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="faction-card text-center">
              <CardContent className="pt-6">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">5420</div>
                <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">Personal Best</div>
              </CardContent>
            </Card>

            <Card className="faction-card text-center">
              <CardContent className="pt-6">
                <Brain className="w-8 h-8 mx-auto mb-2 text-secondary" />
                <div className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">47</div>
                <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">Games Played</div>
              </CardContent>
            </Card>

            <Card className="faction-card text-center">
              <CardContent className="pt-6">
                <Star className="w-8 h-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">12000</div>
                <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">Max Possible</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game3;