import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PuzzleResult } from '@/types/puzzle';
import { Timer, Trophy, RotateCcw, Shuffle } from 'lucide-react';

interface PuzzleGameProps {
  onGameStart?: () => void;
  onGameEnd?: (result: PuzzleResult) => void;
}

const PuzzleGame: React.FC<PuzzleGameProps> = ({ onGameStart, onGameEnd }) => {
  const [gameStatus, setGameStatus] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [pieces, setPieces] = useState<number[]>([]);
  const [emptyIndex, setEmptyIndex] = useState(15);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Create solved puzzle (0-14 with 15 as empty)
  const solvedPuzzle = Array.from({ length: 15 }, (_, i) => i).concat([15]);

  // Initialize shuffled puzzle
  const initializePuzzle = useCallback(() => {
    let shuffled: number[];
    do {
      shuffled = [...solvedPuzzle];
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } while (JSON.stringify(shuffled) === JSON.stringify(solvedPuzzle) || !isSolvable(shuffled));
    
    setPieces(shuffled);
    setEmptyIndex(shuffled.indexOf(15));
  }, []);

  // Check if puzzle is solvable
  const isSolvable = (puzzle: number[]): boolean => {
    let inversions = 0;
    const puzzleWithoutEmpty = puzzle.filter(n => n !== 15);
    
    for (let i = 0; i < puzzleWithoutEmpty.length; i++) {
      for (let j = i + 1; j < puzzleWithoutEmpty.length; j++) {
        if (puzzleWithoutEmpty[i] > puzzleWithoutEmpty[j]) {
          inversions++;
        }
      }
    }
    
    const emptyRowFromBottom = 4 - Math.floor(puzzle.indexOf(15) / 4);
    return (inversions % 2 === 1) === (emptyRowFromBottom % 2 === 0);
  };

  // Check if puzzle is solved
  const isPuzzleSolved = useCallback((currentPieces: number[]): boolean => {
    return JSON.stringify(currentPieces) === JSON.stringify(solvedPuzzle);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle piece click
  const handlePieceClick = (clickedIndex: number) => {
    if (gameStatus !== 'playing') return;
    
    const canMove = isAdjacentToEmpty(clickedIndex, emptyIndex);
    if (!canMove) return;

    const newPieces = [...pieces];
    // Swap clicked piece with empty space
    [newPieces[clickedIndex], newPieces[emptyIndex]] = [newPieces[emptyIndex], newPieces[clickedIndex]];
    
    setPieces(newPieces);
    setEmptyIndex(clickedIndex);
    setMoves(prev => prev + 1);

    // Check if solved
    if (isPuzzleSolved(newPieces)) {
      setIsRunning(false);
      setGameStatus('completed');
      
      const result: PuzzleResult = {
        completed: true,
        moves: moves + 1,
        timeElapsed,
        score: calculateScore(moves + 1, timeElapsed),
        perfectGame: moves + 1 <= 50 && timeElapsed <= 60
      };
      
      onGameEnd?.(result);
    }
  };

  // Check if two positions are adjacent
  const isAdjacentToEmpty = (index: number, emptyIdx: number): boolean => {
    const row1 = Math.floor(index / 4);
    const col1 = index % 4;
    const row2 = Math.floor(emptyIdx / 4);
    const col2 = emptyIdx % 4;
    
    return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
           (Math.abs(col1 - col2) === 1 && row1 === row2);
  };

  // Calculate score based on moves and time
  const calculateScore = (totalMoves: number, totalTime: number): number => {
    const baseScore = 1000;
    const movePenalty = Math.max(0, totalMoves - 30) * 10;
    const timePenalty = Math.max(0, totalTime - 120) * 5;
    return Math.max(100, baseScore - movePenalty - timePenalty);
  };

  // Start game
  const startGame = () => {
    initializePuzzle();
    setMoves(0);
    setTimeElapsed(0);
    setIsRunning(true);
    setGameStatus('playing');
    onGameStart?.();
  };

  // Reset game
  const resetGame = () => {
    setGameStatus('instructions');
    setIsRunning(false);
    setMoves(0);
    setTimeElapsed(0);
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render instructions
  if (gameStatus === 'instructions') {
    return (
      <Card className="bg-gray-900/90 border-purple-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-purple-400">
            🧩 Star Seekers Puzzle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🌟</div>
            <p className="text-gray-300 text-lg mb-6">
              Arrange the numbered tiles in order from 1 to 15. Click tiles adjacent to the empty space to move them.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-purple-900/30 p-4 rounded-lg">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <h3 className="font-bold text-purple-300">Goal</h3>
              <p className="text-sm text-gray-400">Solve in under 50 moves for bonus points</p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg">
              <Timer className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <h3 className="font-bold text-blue-300">Time Bonus</h3>
              <p className="text-sm text-gray-400">Complete under 2 minutes for extra score</p>
            </div>
          </div>

          <Button 
            onClick={startGame}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 text-lg"
          >
            Start Puzzle
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render completed state
  if (gameStatus === 'completed') {
    const score = calculateScore(moves, timeElapsed);
    const isPerfect = moves <= 50 && timeElapsed <= 60;
    
    return (
      <Card className="bg-gray-900/90 border-green-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-green-400">
            🎉 Puzzle Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="text-6xl mb-4">
            {isPerfect ? '🏆' : '⭐'}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-900/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{moves}</div>
              <div className="text-sm text-gray-400">Moves</div>
            </div>
            <div className="bg-purple-900/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{formatTime(timeElapsed)}</div>
              <div className="text-sm text-gray-400">Time</div>
            </div>
            <div className="bg-green-900/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{score}</div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
          </div>

          {isPerfect && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
              Perfect Game! 🌟
            </Badge>
          )}

          <Button 
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render playing state
  return (
    <div className="space-y-4">
      {/* Game HUD */}
      <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            Moves: {moves}
          </Badge>
          <Badge variant="outline" className="text-purple-400 border-purple-400">
            Time: {formatTime(timeElapsed)}
          </Badge>
        </div>
        <Button 
          onClick={resetGame}
          variant="outline" 
          size="sm"
          className="border-gray-600 text-gray-400 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Puzzle Grid */}
      <Card className="bg-gray-900/90 border-purple-500/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            {pieces.map((piece, index) => (
              <div
                key={index}
                onClick={() => handlePieceClick(index)}
                className={`
                  aspect-square flex items-center justify-center text-xl font-bold rounded-lg border-2 transition-all duration-200
                  ${piece === 15 
                    ? 'bg-transparent border-dashed border-gray-600' 
                    : `bg-gradient-to-br from-purple-600 to-blue-600 border-purple-400 text-white cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 ${isAdjacentToEmpty(index, emptyIndex) ? 'hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-500' : 'cursor-not-allowed opacity-60'}`
                  }
                `}
              >
                {piece !== 15 && piece + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PuzzleGame;