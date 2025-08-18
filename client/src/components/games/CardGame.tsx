import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Card as PlayingCard, CardGameState, CardGameResult, CardGameProps } from '@/types/cardgame';

const CardGame: React.FC<CardGameProps> = ({ onGameEnd }) => {
  console.log('CardGame component rendering...');
  
  const [gameState, setGameState] = useState<CardGameState>({
    deck: [],
    playerHand: [],
    dealerHand: [],
    gameField: [],
    score: 0,
    level: 1,
    lives: 3,
    gameStatus: 'instructions',
    timeRemaining: 180, // 3 minutes
    moves: 0,
    combo: 0
  });

  const [gameTimer, setGameTimer] = useState<NodeJS.Timeout | null>(null);
  const gameSound = useRef<HTMLAudioElement | null>(null);
  const gameOverSound = useRef<HTMLAudioElement | null>(null);

  // Card suits and ranks for deck generation
  const suits: PlayingCard['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: PlayingCard['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Initialize sounds
  useEffect(() => {
    gameSound.current = new Audio('/assets/game1/Sounds/live.wav'); // Using existing sound
    gameSound.current.volume = 0.3;
    
    gameOverSound.current = new Audio('/assets/sounds/game-over-deep-male-voice-clip-352695.mp3');
    gameOverSound.current.volume = 0.7;
  }, []);

  // Game timer effect
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
      setGameTimer(timer);
      return () => clearTimeout(timer);
    } else if (gameState.gameStatus === 'playing' && gameState.timeRemaining === 0) {
      handleTimeUp();
    }
    return () => {
      if (gameTimer) clearTimeout(gameTimer);
    };
  }, [gameState.gameStatus, gameState.timeRemaining]);

  const createDeck = (): PlayingCard[] => {
    const deck: PlayingCard[] = [];
    suits.forEach(suit => {
      ranks.forEach((rank, index) => {
        const card: PlayingCard = {
          id: `${suit}-${rank}`,
          suit,
          rank,
          value: rank === 'A' ? 1 : rank === 'J' ? 11 : rank === 'Q' ? 12 : rank === 'K' ? 13 : parseInt(rank),
          isVisible: false,
          isSelected: false,
          position: { x: 0, y: 0 }
        };
        deck.push(card);
      });
    });
    return shuffleDeck(deck);
  };

  const shuffleDeck = (deck: PlayingCard[]): PlayingCard[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startNewGame = () => {
    const newDeck = createDeck();
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      playerHand: [],
      dealerHand: [],
      gameField: [],
      moves: 0,
      combo: 0,
      timeRemaining: 180,
      gameStatus: 'playing'
    }));
  };

  const handleNextLevel = () => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      moves: 0,
      combo: 0,
      timeRemaining: 180,
      gameStatus: 'menu'
    }));
  };

  const handleTimeUp = () => {
    console.log('Time is up!');
    // Play game over sound
    if (gameOverSound.current) {
      gameOverSound.current.currentTime = 0;
      gameOverSound.current.play().catch(e => console.log('Game over sound failed:', e));
    }
    setGameState(prev => ({ ...prev, gameStatus: 'gameOver' }));
    const result: CardGameResult = {
      completed: false,
      score: gameState.score,
      level: gameState.level,
      timeElapsed: 180,
      moves: gameState.moves,
      perfectGame: false
    };
    onGameEnd?.(result);
  };

  const handleLevelComplete = () => {
    const levelScore = 100 + gameState.timeRemaining + (gameState.combo * 10);
    const newTotalScore = gameState.score + levelScore;
    
    setGameState(prev => ({ 
      ...prev, 
      score: newTotalScore,
      gameStatus: 'levelComplete'
    }));
    
    const result: CardGameResult = {
      completed: true,
      score: newTotalScore,
      level: gameState.level,
      timeElapsed: 180 - gameState.timeRemaining,
      moves: gameState.moves,
      perfectGame: gameState.timeRemaining > 120 // Perfect if completed in under 1 minute
    };
    
    onGameEnd?.(result);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetGame = () => {
    setGameState({
      deck: [],
      playerHand: [],
      dealerHand: [],
      gameField: [],
      score: 0,
      level: 1,
      lives: 3,
      gameStatus: 'instructions',
      timeRemaining: 180,
      moves: 0,
      combo: 0
    });
  };

  // Instructions Screen
  if (gameState.gameStatus === 'instructions') {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-blue-400">
            🃏 STAR SEEKERS CARD GAME
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-4 bg-card/20 rounded-lg border border-border/50">
            <div className="text-white text-lg font-bold mb-4">How to Play</div>
            <div className="text-white/80 space-y-2 text-left">
              <p>• 🎯 <strong>Objective:</strong> [Game rules will be explained here]</p>
              <p>• ⏱️ <strong>Time Limit:</strong> You have 3 minutes to complete each level</p>
              <p>• 🎮 <strong>Controls:</strong> Click on cards to interact with them</p>
              <p>• 🎵 <strong>Feedback:</strong> Hear sounds for successful moves</p>
              <p>• 🏆 <strong>Scoring:</strong> Earn points based on performance and time</p>
              <p>• 📈 <strong>Progression:</strong> Complete levels to advance and increase difficulty</p>
              <p>• ❤️ <strong>Lives:</strong> You have 3 lives - don't make too many mistakes!</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => setGameState(prev => ({ ...prev, gameStatus: 'menu' }))}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              Start Playing
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Menu Screen
  if (gameState.gameStatus === 'menu') {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="text-center space-y-4">
          <div className="text-6xl mb-4">🃏</div>
          
          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{gameState.level}</div>
              <div className="text-sm text-gray-400">Level</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{gameState.score}</div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{gameState.lives}</div>
              <div className="text-sm text-gray-400">Lives</div>
            </div>
          </div>
          
          <Button 
            onClick={startNewGame}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            Start Level {gameState.level}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Playing Screen
  if (gameState.gameStatus === 'playing') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Game HUD */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Level: <span className="text-blue-400 font-bold">{gameState.level}</span>
          </div>
          <div className="text-sm text-gray-400">
            Time: <span className={`font-bold ${gameState.timeRemaining <= 30 ? 'text-red-400' : 'text-yellow-400'}`}>
              {formatTime(gameState.timeRemaining)}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Score: <span className="text-green-400 font-bold">{gameState.score}</span>
          </div>
          <div className="text-sm text-gray-400">
            Lives: <span className="text-red-400 font-bold">{gameState.lives}</span>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="text-sm text-gray-400 space-x-4">
            <span>Moves: <span className="text-blue-400 font-bold">{gameState.moves}</span></span>
            <span>Combo: <span className="text-purple-400 font-bold">{gameState.combo}x</span></span>
          </div>
        </div>

        {/* Game Area */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-white text-lg mb-4">Game area will be implemented here</div>
              <div className="text-gray-400">Waiting for game rules...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Level Complete Screen
  if (gameState.gameStatus === 'levelComplete') {
    const levelScore = 100 + gameState.timeRemaining + (gameState.combo * 10);
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="text-center space-y-4">
          <div className="text-4xl mb-4">🎉</div>
          <div className="text-2xl font-bold text-green-400 mb-4">
            Level {gameState.level} Complete!
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{gameState.moves}</div>
              <div className="text-sm text-gray-400">Moves</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{gameState.timeRemaining}s</div>
              <div className="text-sm text-gray-400">Time Left</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{gameState.combo}x</div>
              <div className="text-sm text-gray-400">Max Combo</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">+{levelScore}</div>
              <div className="text-sm text-gray-400">Points</div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
            <div className="text-3xl font-bold text-green-400">{gameState.score}</div>
            <div className="text-sm text-gray-400">Total Score</div>
          </div>
          
          {gameState.timeRemaining > 120 && (
            <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-3 mb-4">
              <div className="text-yellow-400 font-bold">🌟 Perfect! Completed in under 1 minute!</div>
            </div>
          )}
          
          <Button 
            onClick={handleNextLevel}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            Next Level ({gameState.level + 1})
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Game Over Screen
  if (gameState.gameStatus === 'gameOver') {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="text-center space-y-4">
          <div className="text-4xl mb-4">💀</div>
          <div className="text-2xl font-bold text-red-400 mb-4">
            Game Over!
          </div>
          <div className="text-lg text-gray-300 mb-4">
            You reached Level {gameState.level} with {gameState.score} points
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{gameState.level}</div>
              <div className="text-sm text-gray-400">Level Reached</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{gameState.score}</div>
              <div className="text-sm text-gray-400">Final Score</div>
            </div>
          </div>
          
          <Button 
            onClick={resetGame}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>Unexpected game state</div>
  );
};

export default CardGame;