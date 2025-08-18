import { useState, useCallback } from "react"; // Added useCallback import
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Star, Coins, AlertTriangle } from "lucide-react";
import SpaceSnake from "@/components/games/SpaceSnake";
import { useCredits } from "@/contexts/CreditsContext";
import { useGameResults } from "@/hooks/useGameResults";

const Game2 = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const { credits, canAfford, spendCredits } = useCredits();
  const { submitGameResult } = useGameResults();

  // Assume audioSettings is available and has muteAll and sfxVolume properties
  // For demonstration, let's define a dummy audioSettings if it's not provided
  const audioSettings = {
    muteAll: false,
    sfxVolume: 100,
    musicVolume: 100,
  };

  const GAME_COST = 1;

  // Sound effects
  const playLaserSound = useCallback(() => {
    if (audioSettings.muteAll) return;
    const audio = new Audio('/assets/game2/enemies/Sounds/laser1.dataset/laser1.mp3');
    audio.volume = (audioSettings.sfxVolume / 100) * 0.3;
    audio.play().catch(e => console.log('Laser sound failed:', e));
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

  const playExplosionSound = useCallback(() => {
    if (audioSettings.muteAll) return;
    const audio = new Audio('/assets/game2/enemies/Sounds/shipexplosion.dataset/shipexplosion.wav');
    audio.volume = (audioSettings.sfxVolume / 100) * 0.5;
    audio.play().catch(e => console.log('Explosion sound failed:', e));
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

  const playGameOverSound = useCallback(() => {
    if (audioSettings.muteAll) return;
    const audio = new Audio('/assets/game2/enemies/Sounds/gameover.dataset/gameover.wav');
    audio.volume = (audioSettings.sfxVolume / 100) * 0.6;
    audio.play().catch(e => console.log('Game over sound failed:', e));
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

  const playPowerUpSound = useCallback(() => {
    if (audioSettings.muteAll) return;
    const audio = new Audio('/assets/game2/enemies/Sounds/powerup.dataset/powerup.wav');
    audio.volume = (audioSettings.sfxVolume / 100) * 0.4;
    audio.play().catch(e => console.log('PowerUp sound failed:', e));
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

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
              SPACE SNAKE
            </h1>
            <p className="text-xl text-white mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] font-medium">
              Navigate the cosmos, collect resources, and avoid enemies
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                Easy
              </Badge>
              <Badge variant="outline" className="font-futuristic text-white border-white/50 bg-white/10">
                <Trophy className="w-4 h-4 mr-2" />
                Max: 2000 Points
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
      <div className={`flex justify-center ${isPlaying ? 'min-h-screen items-center' : ''}`}>
        {canAfford(GAME_COST) ? (
          <>
            {isPlaying && (
              <div className="absolute inset-0 bg-black">
                {/* Full-screen starfield */}
                <div className="absolute inset-0 overflow-hidden">
                  {Array.from({ length: 200 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute w-px h-px bg-white opacity-60"
                      style={{
                        left: `${(i * 73) % 100}%`,
                        top: `${(i * 37) % 100}%`,
                        animationDelay: `${(i * 0.1) % 3}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <SpaceSnake
              onGameStateChange={(isPlaying) => {
                setIsPlaying(isPlaying);
                if (isPlaying && !hasPlayedGame) {
                  setHasPlayedGame(true);
                  spendCredits(GAME_COST, 'Stellar Mining - Game Started');
                }
              }}
              onGameEnd={(score) => {
                if (!gameEnded) {
                  setGameEnded(true);
                  playGameOverSound(); // Re-enabled game over sound
                  // SpaceSnake handles score submission internally via recordGameSessionToAPI
                }
              }}
              onLaserFire={playLaserSound} // Added laser sound call
              onEnemyExplosion={playExplosionSound} // Added explosion sound call
              onPowerUp={playPowerUpSound} // Added power-up sound call
            />
          </>
        ) : (
          !isPlaying && (
            <Card className="max-w-md mx-auto bg-gray-800/50 border-gray-600">
              <CardContent className="pt-6 text-center">
                <p className="text-gray-300">
                  You need {GAME_COST} credit to play this space snake game.
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

export default Game2;