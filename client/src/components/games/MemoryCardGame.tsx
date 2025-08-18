import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Pause, Trophy, Clock, MousePointer, Star } from 'lucide-react';
import { useMemoryImageLoader } from '@/hooks/useMemoryImageLoader';
import { useMemoryGameSounds } from '@/hooks/useMemoryGameSounds';
import { MemoryCard, MemoryGameState } from '@/types/memory';
import { recordGameSession } from '@/utils/gameLeaderboard';

interface MemoryCardGameProps {
  onGameStateChange?: (isPlaying: boolean) => void;
  onGameEnd?: (score: number) => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const MemoryCardGame = ({ onGameStateChange, onGameEnd }: MemoryCardGameProps) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<MemoryGameState>({
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timeRemaining: 180,
    gameStatus: 'ready',
    score: 0,
    level: 1,
    maxTimeForLevel: 120
  });

  // Function to record game session to API
  const recordGameSessionToAPI = async (score: number) => {
    try {
      const success = await recordGameSession({
        gameId: 3,
        score: score,
        points: score // No multiplier, score = points
      });

      if (success) {
        console.log(`Game session recorded successfully: Score ${score}`);
      } else {
        console.error('Failed to record game session to database');
      }
    } catch (error) {
      console.error('Error recording game session:', error);
    }
  };

  const { images, loading, error, reloadImages } = useMemoryImageLoader(12);
  const { playFlipSound, playGameStartSound, playGameOverSound, playLevelCompleteSound } = useMemoryGameSounds();

  const createCards = useCallback(() => {
    if (images.length === 0) return [];

    const cardPairs: MemoryCard[] = [];
    images.forEach((image, index) => {
      const pairId = `pair-${index}`;

      // Create two cards for each image
      cardPairs.push({
        id: `${pairId}-1`,
        imageUrl: image.url,
        imageName: image.name,
        isFlipped: false,
        isMatched: false,
        pairId
      });

      cardPairs.push({
        id: `${pairId}-2`,
        imageUrl: image.url,
        imageName: image.name,
        isFlipped: false,
        isMatched: false,
        pairId
      });
    });

    return shuffleArray(cardPairs);
  }, [images]);

  const startNewGame = useCallback(() => {
    const newCards = createCards();
    playGameStartSound();
    const initialTime = 180;
    setGameState({
      cards: newCards,
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      timeRemaining: initialTime,
      gameStatus: 'playing',
      score: 0,
      level: 1,
      maxTimeForLevel: initialTime
    });
    onGameStateChange?.(true);
  }, [createCards, onGameStateChange, playGameStartSound]);

  const pauseGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing'
    }));
  };

  const resetGame = () => {
    reloadImages();
    setGameState({
      cards: [],
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      timeRemaining: 180,
      gameStatus: 'ready',
      score: 0,
      level: 1,
      maxTimeForLevel: 180
    });
    onGameStateChange?.(false);
  };

  const startNextLevel = useCallback(() => {
    const newLevel = gameState.level + 1;
    const newMaxTime = Math.max(30, 180 - (newLevel - 1) * 5); // Minimum 30 seconds
    const newCards = createCards();

    setGameState(prev => ({
      ...prev,
      cards: newCards,
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      timeRemaining: newMaxTime,
      gameStatus: 'playing',
      level: newLevel,
      maxTimeForLevel: newMaxTime
    }));
  }, [gameState.level, createCards]);

  // Timer effect - countdown from 60 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (gameState.gameStatus === 'playing') {
      interval = setInterval(() => {
        setGameState(prev => {
          // Don't continue if game is no longer playing
          if (prev.gameStatus !== 'playing') {
            return prev;
          }

          const newTimeRemaining = prev.timeRemaining - 1;

          console.log('Timer tick:', newTimeRemaining); // Debug log

          // Check for timeout
          if (newTimeRemaining <= 0) {
            console.log('Game timeout - setting to lost'); // Debug log
            setTimeout(() => {
              playGameOverSound();
              recordGameSessionToAPI(prev.score);
              onGameEnd?.(prev.score);
              onGameStateChange?.(false);
            }, 100);

            return {
              ...prev,
              timeRemaining: 0,
              gameStatus: 'lost'
            };
          }

          return {
            ...prev,
            timeRemaining: newTimeRemaining
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.gameStatus]);

  // Initialize cards when images load
  useEffect(() => {
    if (images.length > 0 && gameState.cards.length === 0 && gameState.gameStatus === 'ready') {
      const newCards = createCards();
      setGameState(prev => ({
        ...prev,
        cards: newCards
      }));
    }
  }, [images, gameState.cards.length, gameState.gameStatus, createCards]);

  const handleCardClick = (cardId: string) => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.flippedCards.length >= 2) return;

    const card = gameState.cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    playFlipSound();
    const newFlippedCards = [...gameState.flippedCards, cardId];

    setGameState(prev => ({
      ...prev,
      cards: prev.cards.map(c => 
        c.id === cardId ? { ...c, isFlipped: true } : c
      ),
      flippedCards: newFlippedCards
    }));

    // Check for match after second card is flipped
    if (newFlippedCards.length === 2) {
      setTimeout(() => {
        const [firstCardId, secondCardId] = newFlippedCards;
        const firstCard = gameState.cards.find(c => c.id === firstCardId);
        const secondCard = gameState.cards.find(c => c.id === secondCardId);

        const isMatch = firstCard?.pairId === secondCard?.pairId;
        const newMoves = gameState.moves + 1;
        const newMatchedPairs = isMatch ? gameState.matchedPairs + 1 : gameState.matchedPairs;

        setGameState(prev => ({
          ...prev,
          cards: prev.cards.map(c => {
            if (c.id === firstCardId || c.id === secondCardId) {
              return {
                ...c,
                isFlipped: isMatch,
                isMatched: isMatch
              };
            }
            return c;
          }),
          flippedCards: [],
          moves: newMoves,
          matchedPairs: newMatchedPairs,
          score: prev.score
        }));

        // Check for level complete condition
        if (newMatchedPairs === 12) {
          setTimeout(() => {
            playLevelCompleteSound();
            setGameState(prev => {
              const finalScore = prev.score + 100 + prev.timeRemaining;
              recordGameSessionToAPI(finalScore);
              onGameEnd?.(finalScore);
              return {
                ...prev,
                gameStatus: 'levelComplete',
                score: finalScore
              };
            });
          }, 500);
        }
      }, 300);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Loading cosmic images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-400 text-xl">Error loading images</div>
        <Button onClick={reloadImages} className="neon-glow">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-4">
          {gameState.gameStatus === 'ready' && (
            <Button onClick={startNewGame} className="neon-glow">
              <Play className="w-4 h-4 mr-2" />
              Start Game - 1 Credit
            </Button>
          )}

          {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'paused') && (
            <Button onClick={pauseGame} variant="outline">
              {gameState.gameStatus === 'playing' ? (
                <><Pause className="w-4 h-4 mr-2" />Pause</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Resume</>
              )}
            </Button>
          )}

          <Button onClick={resetGame} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            New Game - 1 Credit
          </Button>
        </div>

        {/* Game Stats */}
        <div className="flex gap-4 flex-wrap">
          <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/50">
            <Star className="w-4 h-4 mr-1" />
            Level: {gameState.level}
          </Badge>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            <MousePointer className="w-4 h-4 mr-1" />
            Moves: {gameState.moves}
          </Badge>
          <Badge variant="outline" className={`${
            gameState.timeRemaining <= 10 
              ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' 
              : 'bg-green-500/20 text-green-400 border-green-500/50'
          }`}>
            <Clock className="w-4 h-4 mr-1" />
            Time: {formatTime(gameState.timeRemaining)}
          </Badge>
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            <Trophy className="w-4 h-4 mr-1" />
            Score: {gameState.score}
          </Badge>
        </div>
      </div>

      {/* Game Status Messages */}
      {gameState.gameStatus === 'paused' && (
        <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/50">
          <div className="text-yellow-400 text-xl font-bold">Game Paused</div>
        </div>
      )}

      {gameState.gameStatus === 'levelComplete' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[100]">
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-800/30 rounded-xl border-2 border-blue-500/60 p-10 max-w-lg mx-4 text-center animate-fade-in shadow-2xl">
            <div className="mb-8">
              <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 shadow-lg animate-pulse">
                <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center text-6xl">
                  🎯
                </div>
              </div>
            </div>
            <div className="text-blue-400 text-4xl font-bold mb-4 font-futuristic drop-shadow-lg">LEVEL {gameState.level} COMPLETE!</div>
            <div className="text-white text-xl mb-3 font-semibold">
              🌟 All Pairs Matched!
            </div>
            <div className="text-blue-400 text-3xl font-bold mb-3 font-futuristic">
              +{100 + gameState.timeRemaining} Points
            </div>
            <div className="text-white/90 text-base mb-4">
              Total Score: <span className="text-yellow-400 font-bold">{gameState.score}</span>
            </div>
            <div className="text-white/90 text-sm mb-8">
              Next Level: <span className="text-green-400 font-bold">{Math.max(30, 180 - gameState.level * 5)}s</span> timer
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={startNextLevel} className="neon-glow px-6 py-3 text-lg font-semibold">
                🚀 Level {gameState.level + 1}
              </Button>
              <Button 
                onClick={() => {
                  setGameState(prev => {
                    recordGameSessionToAPI(prev.score);
                    onGameEnd?.(prev.score);
                    return { ...prev, gameStatus: 'won' };
                  });
                }} 
                variant="outline"
                className="nav-button px-6 py-3 text-lg font-semibold"
              >
                🏆 Finish Game
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState.gameStatus === 'won' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[100]">
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 rounded-xl border-2 border-green-500/60 p-10 max-w-lg mx-4 text-center animate-fade-in shadow-2xl">
            <div className="mb-8">
              <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 shadow-lg animate-bounce">
                <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center text-6xl">
                  🤖
                </div>
              </div>
            </div>
            <div className="text-green-400 text-4xl font-bold mb-4 font-futuristic drop-shadow-lg">VICTORY!</div>
            <div className="text-white text-xl mb-3 font-semibold">
              🎉 All Pairs Matched!
            </div>
            <div className="text-green-400 text-3xl font-bold mb-3 font-futuristic">
              {gameState.score}
            </div>
            <div className="text-white/90 text-base mb-8">
              Base: <span className="text-yellow-400 font-bold">100</span> + Time Bonus: <span className="text-yellow-400 font-bold">{gameState.timeRemaining}s</span>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={resetGame} className="neon-glow px-6 py-3 text-lg font-semibold">
                🎮 Play Again - 1 Credit
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="outline"
                className="nav-button px-6 py-3 text-lg font-semibold"
              >
                🏠 Games Hub
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState.gameStatus === 'lost' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[100]">
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 rounded-xl border-2 border-red-500/60 p-10 max-w-lg mx-4 text-center animate-fade-in shadow-2xl">
            <div className="mb-8">
              <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center text-6xl">
                  🤖
                </div>
              </div>
            </div>
            <div className="text-red-400 text-4xl font-bold mb-4 font-futuristic drop-shadow-lg">GAME OVER</div>
            <div className="text-white text-xl mb-3 font-semibold">
              ⏰ Time's Up!
            </div>
            <div className="text-white/90 text-lg mb-4">
              You matched <span className="text-yellow-400 font-bold">{gameState.matchedPairs}</span> out of <span className="text-yellow-400 font-bold">12</span> pairs
            </div>
            <div className="text-red-400 text-2xl font-bold mb-8 font-futuristic">
              Final Score: <span className="text-white">0</span>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={resetGame} className="neon-glow px-6 py-3 text-lg font-semibold">
                🎮 Play Again - 1 Credit
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="outline"
                className="nav-button px-6 py-3 text-lg font-semibold"
              >
                🏠 Games Hub
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Card Grid */}
      {gameState.cards.length > 0 && (
        <div className="grid grid-cols-6 gap-3 max-w-6xl mx-auto">
          {gameState.cards.map((card) => (
            <div
              key={card.id}
              className={`aspect-square cursor-pointer perspective-1000 ${
                gameState.gameStatus !== 'playing' ? 'pointer-events-none' : ''
              }`}
              onClick={() => handleCardClick(card.id)}
            >
              <div
                className={`relative w-full h-full transition-transform duration-75 ease-out transform-style-preserve-3d ${
                  card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                }`}
              >
                {/* Card Back */}
                <Card className="absolute inset-0 w-full h-full backface-hidden bg-card/30 border-border/50">
                  <CardContent className="p-1 h-full flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-md flex items-center justify-center">
                      <img
                        src="/assets/game3/SA-PBTP-White.svg"
                        alt="Card back"
                        className="w-20 h-20 opacity-95"
                        draggable={false}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Card Front */}
                <Card className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 ${
                  card.isMatched 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : 'bg-blue-500/20 border-blue-500/50'
                }`}>
                  <CardContent className="p-1 h-full flex items-center justify-center">
                    <img
                      src={card.imageUrl}
                      alt={`Memory card ${card.imageName}`}
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Game Instructions */}
      {gameState.gameStatus === 'ready' && (
        <div className="text-center p-4 bg-card/20 rounded-lg border border-border/50">
          <div className="text-white text-lg font-bold mb-2">How to Play</div>
          <div className="text-white/80">
            Click cards to flip them. Find matching pairs to score points. 
            Complete all 12 pairs to win!
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryCardGame;