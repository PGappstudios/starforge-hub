import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PuzzleResult } from '@/types/puzzle';
import { recordGameSession } from '@/utils/gameLeaderboard';

interface PuzzleGameProps {
  onGameStart?: () => void;
  onGameEnd?: (result: PuzzleResult) => void;
}

const PuzzleGame: React.FC<PuzzleGameProps> = ({ onGameStart, onGameEnd }) => {
  console.log('PuzzleGame component rendering...');

  const [gameStatus, setGameStatus] = useState<'instructions' | 'menu' | 'preview' | 'playing' | 'completed' | 'levelComplete'>('instructions');
  const [previewTimeLeft, setPreviewTimeLeft] = useState(3);
  const [selectedImage, setSelectedImage] = useState('');

  // Available puzzle images
  const puzzleImages = [
    '/assets/game5/Images/STAND.png',
    '/assets/game5/Images/ahr-visits-earth.jpg',
    '/assets/game5/Images/assassination-of-paizul.jpg',
    '/assets/game5/Images/CSSLO2.jpg',
    '/assets/game5/Images/CSSLU3.jpg',
    '/assets/game5/Images/CSSLU4.jpg',
    '/assets/game5/Images/CSSLU5.jpg',
    '/assets/game5/Images/ESCVP.jpg',
    '/assets/game5/Images/F1CT.jpg',
    '/assets/game5/Images/SOLPK1.jpg',
    '/assets/game5/Images/SOLPK2.jpg',
    '/assets/game5/Images/SOLPK3.jpg',
    '/assets/game5/Images/SOLPK4.jpg',
    '/assets/game5/Images/STAKE4.jpg',
    '/assets/game5/Images/the-convergence-war.jpg',
    '/assets/game5/Images/the-heart-of-star-atlas.jpg',
    '/assets/game5/Images/the-last-stand.jpg',
    '/assets/game5/Images/the-peacebringers-archive.png',
    '/assets/game5/Images/love-story.jpg',
    '/assets/game5/Images/discovery-of-iris (1).jpg',
    '/assets/game5/Images/CALMAX-9MTgMVrnU20hI6N0.jpg',
    '/assets/game5/Images/CALMED.jpg',
    '/assets/game5/Images/PD9.jpg',
    '/assets/game5/Images/PX4.jpg',
    '/assets/game5/Images/FBLEUN.jpg'
  ];
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [pieces, setPieces] = useState<number[]>(() => {
    // Create shuffled array of numbers 0-15
    const shuffled = Array.from({ length: 16 }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  const [moves, setMoves] = useState(0);
  const [imagePieces, setImagePieces] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const correctPieceSound = useRef<HTMLAudioElement | null>(null);
  const gameOverSound = useRef<HTMLAudioElement | null>(null);

  // Game session recording state
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [gameEndTime, setGameEndTime] = useState<number>(0);

  // Function to record game session to API
  const recordGameSessionToAPI = async (score: number) => {
    try {
      const success = await recordGameSession({
        gameId: 5,
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

  useEffect(() => {
    // Initialize sounds
    correctPieceSound.current = new Audio('/assets/game5/Sounds/live.wav');
    correctPieceSound.current.volume = 0.3; // Set volume to 30%
    gameOverSound.current = new Audio('/assets/sounds/game-over-deep-male-voice-clip-352695.mp3');


    let interval: NodeJS.Timeout;
    if (gameStatus === 'preview' && previewTimeLeft > 0) {
      interval = setInterval(() => {
        setPreviewTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameStatus === 'preview' && previewTimeLeft === 0) {
      setGameStatus('playing');
      // Start game timer when playing begins
      startGameTimer();
      setGameStartTime(Date.now()); // Set game start time
    }
    return () => clearInterval(interval);
  }, [gameStatus, previewTimeLeft]);

  // Game timer effect
  useEffect(() => {
    if (gameStatus === 'playing' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      setGameTimer(timer);
      return () => clearTimeout(timer);
    } else if (gameStatus === 'playing' && timeRemaining === 0) {
      // Time's up - end game
      handleTimeUp();
    }
    return () => {
      if (gameTimer) clearTimeout(gameTimer);
    };
  }, [gameStatus, timeRemaining]);

  const startGameTimer = () => {
    setTimeRemaining(120); // Reset to 2 minutes
  };

  const handleTimeUp = () => {
    console.log('Time is up!');
    setGameStatus('completed');
    const result: PuzzleResult = {
      completed: false,
      moves,
      timeElapsed: 120,
      score,
      perfectGame: false
    };
    recordGameSessionToAPI(score); // Record score even if time runs out
    onGameEnd?.(result);
    // Play game over sound
    if (gameOverSound.current) {
      gameOverSound.current.play().catch(e => console.log('Game over sound play failed:', e));
    }
  };

  const handleStartGame = () => {
    console.log('Starting puzzle game preview...');
    console.log('Available images:', puzzleImages.length);
    console.log('Last image index:', lastImageIndex);

    // Select a random image (avoiding the last one if possible)
    let randomIndex;
    if (puzzleImages.length > 1) {
      do {
        randomIndex = Math.floor(Math.random() * puzzleImages.length);
      } while (randomIndex === lastImageIndex);
    } else {
      randomIndex = 0;
    }

    const randomImage = puzzleImages[randomIndex];

    console.log('New random index:', randomIndex);
    console.log('Selected random image:', randomImage);

    setLastImageIndex(randomIndex);
    setSelectedImage(randomImage);
    setImageLoaded(false);
    setImageError(false);
    setPreviewTimeLeft(3);
    setImagePieces([]); // Clear any existing pieces
    setGameStatus('preview');
  };

  const handleImageLoad = () => {
    console.log('Preview image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
    // Slice image when preview loads - give it a moment for DOM to update
    setTimeout(() => {
      sliceImageIntoPieces();
    }, 200);
  };

  const sliceImageIntoPieces = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context not available');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('Image loaded for slicing:', img.width, 'x', img.height);

      // Set canvas size to match piece size (increased by 30%)
      const pieceSize = 125; // 96 * 1.3 ≈ 125
      canvas.width = pieceSize;
      canvas.height = pieceSize;

      const pieces: string[] = [];

      // Use the actual image dimensions for source calculations
      const sourceWidth = img.width;
      const sourceHeight = img.height;
      const pieceSourceWidth = sourceWidth / 4;
      const pieceSourceHeight = sourceHeight / 4;

      console.log('Slicing image - source:', sourceWidth, 'x', sourceHeight, 'piece source:', pieceSourceWidth, 'x', pieceSourceHeight);

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          // Clear the canvas
          ctx.clearRect(0, 0, pieceSize, pieceSize);

          // Draw the piece from the source image
          ctx.drawImage(
            img,
            col * pieceSourceWidth,    // source x
            row * pieceSourceHeight,   // source y
            pieceSourceWidth,          // source width
            pieceSourceHeight,         // source height
            0,                         // dest x
            0,                         // dest y
            pieceSize,                 // dest width
            pieceSize                  // dest height
          );

          const dataURL = canvas.toDataURL('image/png', 1.0);
          pieces.push(dataURL);
          console.log(`Generated piece ${row * 4 + col + 1}/16`);
        }
      }

      console.log('Generated', pieces.length, 'image pieces successfully');
      setImagePieces(pieces);
    };

    img.onerror = (e) => {
      console.error('Failed to load image for slicing:', selectedImage, e);
      // Fallback: keep numbers visible if image fails
      setImagePieces([]);
    };

    console.log('Loading image for slicing:', selectedImage);
    img.src = selectedImage;
  };

  const handleImageError = () => {
    console.log('Failed to load image:', selectedImage);
    setImageError(true);
    setImageLoaded(false);
  };

  const handlePieceClick = (position: number) => {
    if (gameStatus !== 'playing') return;

    console.log('Clicked piece at position:', position);

    // If no piece is selected, select this one
    if (selectedPiece === null) {
      setSelectedPiece(position);
      return;
    }

    // If clicking the same piece, deselect it
    if (selectedPiece === position) {
      setSelectedPiece(null);
      return;
    }

    // Swap the pieces
    const newPieces = [...pieces];
    [newPieces[selectedPiece], newPieces[position]] = [newPieces[position], newPieces[selectedPiece]];

    // Check if either piece is now in the correct position and play sound
    const piece1Correct = newPieces[selectedPiece] === selectedPiece;
    const piece2Correct = newPieces[position] === position;

    if (piece1Correct || piece2Correct) {
      // Play correct piece sound
      if (correctPieceSound.current) {
        correctPieceSound.current.currentTime = 0; // Reset to start
        correctPieceSound.current.play().catch(e => console.log('Sound play failed:', e));
      }
    }

    setPieces(newPieces);
    setMoves(prev => prev + 1);
    setSelectedPiece(null);

    // Check if puzzle is solved
    const isSolved = newPieces.every((piece, index) => piece === index);
    if (isSolved) {
      console.log('Puzzle solved!');
      setTimeout(() => handleEndGame(), 500);
    }
  };

  const handleEndGame = () => {
    console.log('Ending puzzle game with', moves, 'moves');
    // New scoring: 100 points + remaining seconds
    const levelScore = 100 + timeRemaining;
    const newTotalScore = score + levelScore;

    setScore(newTotalScore);

    const result: PuzzleResult = {
      completed: true,
      moves,
      timeElapsed: 120 - timeRemaining,
      score: newTotalScore,
      perfectGame: timeRemaining > 60 // Perfect if completed in under 1 minute
    };

    setGameStatus('levelComplete');
    recordGameSessionToAPI(newTotalScore); // Record the final score for the completed level
    onGameEnd?.(result);
  };

  const handleNextLevel = () => {
    setLevel(prev => prev + 1);
    setMoves(0);
    setSelectedPiece(null);
    setImagePieces([]);
    setSelectedImage(''); // Clear selected image so a new one will be chosen
    // Re-shuffle pieces for next level
    const shuffled = Array.from({ length: 16 }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setPieces(shuffled);
    setGameStatus('menu');
  };

  if (gameStatus === 'instructions') {
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-blue-400">
              🧩 STAR ATLAS PUZZLE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-card/20 rounded-lg border border-border/50">
              <div className="text-white text-lg font-bold mb-4">How to Play</div>
              <div className="text-white/80 space-y-2 text-left">
                <p>• 🎯 <strong>Objective:</strong> Solve the 16-piece Star Atlas puzzle by arranging pieces in correct order</p>
                <p>• ⏱️ <strong>Time Limit:</strong> You have 2 minutes to complete each puzzle</p>
                <p>• 🎮 <strong>Controls:</strong> Click two pieces to swap their positions</p>
                <p>• 🎵 <strong>Feedback:</strong> Hear a sound when you place a piece correctly</p>
                <p>• 🏆 <strong>Scoring:</strong> Earn 100 points + remaining seconds for each completed level</p>
                <p>• 📈 <strong>Progression:</strong> Complete puzzles to advance to the next level</p>
                <p>• 🌟 <strong>Perfect Game:</strong> Complete puzzle in under 1 minute for bonus recognition</p>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setGameStatus('menu');
                  onGameStart?.();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Start Playing - 1 Credit
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (gameStatus === 'menu') {
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center space-y-4">
            <div className="text-6xl mb-4">🧩</div>

            {/* Game Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{level}</div>
                <div className="text-sm text-gray-400">Level</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{score}</div>
                <div className="text-sm text-gray-400">Score</div>
              </div>
            </div>

            <Button
              onClick={handleStartGame}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              Start Level {level}{level === 1 ? ' - 1 Credit' : ' - FREE'}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (gameStatus === 'preview') {
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-4">
              {previewTimeLeft}
            </div>
            {imageError ? (
              <div className="text-center">
                <div className="text-4xl mb-4 text-red-400">❌</div>
                <p className="text-red-300">Failed to load image</p>
                <p className="text-gray-400 text-sm">{selectedImage}</p>
              </div>
            ) : (
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Puzzle Preview"
                  className="w-80 h-80 object-cover rounded-lg border-2 border-blue-400"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                      <p className="text-gray-300 text-sm">Loading...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  if (gameStatus === 'playing') {
    console.log('Playing state - imagePieces count:', imagePieces.length);
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Game HUD */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Level: <span className="text-blue-400 font-bold">{level}</span>
            </div>
            <div className="text-sm text-gray-400">
              Time: <span className={`font-bold ${timeRemaining <= 30 ? 'text-red-400' : 'text-yellow-400'}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Score: <span className="text-green-400 font-bold">{score}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="text-sm text-gray-400">
              Moves: <span className="text-blue-400 font-bold">{moves}</span>
            </div>
          </div>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="flex justify-center p-6">
              <div className="grid grid-cols-4 gap-0.5 w-fit">
                {pieces.map((piece, index) => {
                  const isSelected = selectedPiece === index;
                  const isCorrect = piece === index;
                  const pieceImage = imagePieces[piece];

                  return (
                    <div
                      key={index}
                      className={`
                        w-[125px] h-[125px] border-2 cursor-pointer transition-all duration-200 rounded overflow-hidden
                        ${isSelected
                          ? 'border-yellow-400 scale-105'
                          : isCorrect
                          ? 'border-green-400'
                          : 'border-gray-600 hover:border-blue-400 hover:scale-105'
                        }
                      `}
                      onClick={() => handlePieceClick(index)}
                    >
                      {pieceImage ? (
                        <img
                          src={pieceImage}
                          alt={`Piece ${piece + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                          onError={() => console.log('Failed to display piece', piece)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white font-bold">
                          {piece + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (gameStatus === 'levelComplete') {
    const levelScore = 100 + timeRemaining;
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center space-y-4">
            <div className="text-4xl mb-4">🎉</div>
            <div className="text-2xl font-bold text-green-400 mb-4">
              Level {level} Complete!
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{moves}</div>
                <div className="text-sm text-gray-400">Moves</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{timeRemaining}s</div>
                <div className="text-sm text-gray-400">Time Left</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">+{levelScore}</div>
                <div className="text-sm text-gray-400">Points</div>
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
              <div className="text-3xl font-bold text-green-400">{score}</div>
              <div className="text-sm text-gray-400">Total Score</div>
            </div>

            {timeRemaining > 60 && (
              <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-3 mb-4">
                <div className="text-yellow-400 font-bold">🌟 Perfect! Completed in under 1 minute!</div>
              </div>
            )}

            <Button
              onClick={handleNextLevel}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              Next Level ({level + 1}) - FREE
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (gameStatus === 'completed') {
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center space-y-4">
            <div className="text-4xl mb-4">⏰</div>
            <div className="text-2xl font-bold text-red-400 mb-4">
              Time's Up!
            </div>
            <div className="text-lg text-gray-300 mb-4">
              You reached Level {level} with {score} points
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{level}</div>
                <div className="text-sm text-gray-400">Level Reached</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{score}</div>
                <div className="text-sm text-gray-400">Final Score</div>
              </div>
            </div>

            <Button
              onClick={() => {
                // Reset everything for new game
                setGameStatus('instructions');
                setLevel(1);
                setScore(0);
                setMoves(0);
                setSelectedPiece(null);
                setImagePieces([]);
                setSelectedImage('');
                setTimeRemaining(120);
                // Re-shuffle pieces
                const shuffled = Array.from({ length: 16 }, (_, i) => i);
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                setPieces(shuffled);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              New Game - 1 Credit
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <div>Unexpected game state</div>
  );
};

export default PuzzleGame;