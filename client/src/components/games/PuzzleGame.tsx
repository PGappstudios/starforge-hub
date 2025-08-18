import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PuzzleResult } from '@/types/puzzle';
import { recordGameSession } from '@/utils/gameLeaderboard';
import { Timer, Trophy, RotateCcw, Play } from 'lucide-react';

interface PuzzleGameProps {
  onGameStart?: () => void;
  onGameEnd?: (result: PuzzleResult) => void;
}

const PuzzleGame: React.FC<PuzzleGameProps> = ({ onGameStart, onGameEnd }) => {

  const [gameStatus, setGameStatus] = useState<'instructions' | 'menu' | 'preview' | 'playing' | 'completed'>('instructions');
  const [previewTimeLeft, setPreviewTimeLeft] = useState(3);
  const [selectedImage, setSelectedImage] = useState('');
  const [lastImageIndex, setLastImageIndex] = useState(-1);

  // Available puzzle images from the actual assets folder
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
    '/assets/game5/Images/FBLEUN.jpg',
    '/assets/game5/Images/ARC-6bbaf9dc1208efc7.jpg',
    '/assets/game5/Images/CALCH-6d3fbf841174a957.jpeg',
    '/assets/game5/Images/CHI-ed66feaccf1de0f6.jpg',
    '/assets/game5/Images/FBLAIR-c1ed7b4d8fc0b198.jpg',
    '/assets/game5/Images/FBLBEA-e1aaa980e0d9c690.jpg',
    '/assets/game5/Images/FBLBPL-e88853c1706b62b3.jpg',
    '/assets/game5/Images/FBLEBO-2504e06c45e9b8dc.jpg',
    '/assets/game5/Images/FBLETR-613cad4903e95b62.jpg',
    '/assets/game5/Images/FBLEUN-a6fe58fa3eac3f84.jpg',
    '/assets/game5/Images/HEART-qgksh62rjGIvSNKi.jpg',
    '/assets/game5/Images/OGKATU-NKEmxNNeG7HSESFJ.jpg',
    '/assets/game5/Images/PC11-230846ddd5f2ad9d.jpg',
    '/assets/game5/Images/PC9-eff1c9178647d871.jpg',
    '/assets/game5/Images/PF4-272c7b400f4ad7b7.jpg',
    '/assets/game5/Images/PR8-dab0d8b61451c469.jpg',
    '/assets/game5/Images/PX6-b87a346396f699c9.jpg',
    '/assets/game5/Images/SUPER-ArVqz6KmaEKY3aCX.jpg',
    '/assets/game5/Images/SUPER-KRnR0idrdXF5U6SN.jpg',
    '/assets/game5/Images/SUPER-Zbml25xDVlMyD6FU.jpg',
    '/assets/game5/Images/SUPER-q2y8pVizRUpmiQ19.jpg',
    '/assets/game5/Images/SUPER-t22MnLHVACMpwePA.jpg',
    '/assets/game5/Images/THRILL-6af4675ee14a4338.jpg',
    '/assets/game5/Images/TUFAFE-40ce6735739c5246.jpg',
    '/assets/game5/Images/VZUSOP-3b6a9e58f3901f63.jpg',
    '/assets/game5/Images/VZUSSO-Wtz8vdRONHbv9HSb.jpg'
  ];

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [pieces, setPieces] = useState<number[]>(() => {
    // Create shuffled array of numbers 0-15 (all pieces have images)
    const shuffled = Array.from({ length: 16 }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  const [moves, setMoves] = useState(0);
  const [imagePieces, setImagePieces] = useState<string[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const correctPieceSound = useRef<HTMLAudioElement | null>(null);
  const gameOverSound = useRef<HTMLAudioElement | null>(null);

  // Game session recording state
  const [gameStartTime, setGameStartTime] = useState<number>(0);

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

  // Function to record game session to API
  const recordGameSessionToAPI = async (score: number) => {
    try {
      const success = await recordGameSession({
        gameId: 5,
        score: score,
        points: score
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
    correctPieceSound.current.volume = 0.3;
    gameOverSound.current = new Audio('/assets/sounds/game-over-deep-male-voice-clip-352695.mp3');

    let interval: NodeJS.Timeout;
    if (gameStatus === 'preview' && previewTimeLeft > 0) {
      interval = setInterval(() => {
        setPreviewTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameStatus === 'preview' && previewTimeLeft === 0) {
      setGameStatus('playing');
      setIsRunning(true);
      setGameStartTime(Date.now());
    }
    return () => clearInterval(interval);
  }, [gameStatus, previewTimeLeft]);

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
    setImagePieces([]);
    setMoves(0);
    setTimeElapsed(0);
    setGameStatus('preview');
    onGameStart?.();
  };

  const handleImageLoad = () => {
    console.log('Preview image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
    // Slice image when preview loads
    setTimeout(() => {
      sliceImageIntoPieces();
    }, 200);
  };

  const handleImageError = () => {
    console.log('Failed to load preview image');
    setImageError(true);
    setImageLoaded(false);
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

      const pieceSize = 125;
      canvas.width = pieceSize;
      canvas.height = pieceSize;

      const pieces: string[] = [];
      const sourceWidth = img.width;
      const sourceHeight = img.height;
      const pieceSourceWidth = sourceWidth / 4;
      const pieceSourceHeight = sourceHeight / 4;

      console.log('Slicing image - source:', sourceWidth, 'x', sourceHeight, 'piece source:', pieceSourceWidth, 'x', pieceSourceHeight);

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const pieceIndex = row * 4 + col;
          console.log(`Generated piece ${pieceIndex + 1}/16`);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            col * pieceSourceWidth,
            row * pieceSourceHeight,
            pieceSourceWidth,
            pieceSourceHeight,
            0,
            0,
            pieceSize,
            pieceSize
          );

          pieces.push(canvas.toDataURL());
        }
      }

      console.log('Generated', pieces.length, 'image pieces successfully');
      setImagePieces(pieces);
    };

    img.onerror = () => {
      console.error('Failed to load image for slicing');
      setImageError(true);
    };

    img.src = selectedImage;
  };

  const handlePieceClick = (clickedIndex: number) => {
    if (gameStatus !== 'playing') return;
    
    if (selectedPiece === null) {
      // First piece selection
      setSelectedPiece(clickedIndex);
    } else if (selectedPiece === clickedIndex) {
      // Clicking same piece deselects it
      setSelectedPiece(null);
    } else {
      // Second piece selection - swap them
      const newPieces = [...pieces];
      [newPieces[selectedPiece], newPieces[clickedIndex]] = [newPieces[clickedIndex], newPieces[selectedPiece]];
      setPieces(newPieces);
      setSelectedPiece(null);
      setMoves(prev => prev + 1);
      
      // Play sound
      if (correctPieceSound.current) {
        correctPieceSound.current.play().catch(e => console.log('Sound play failed:', e));
      }
      
      // Check if solved
      if (isPuzzleSolved(newPieces)) {
        setIsRunning(false);
        setGameStatus('completed');
        
        const score = calculateScore(moves + 1, timeElapsed);
        const result: PuzzleResult = {
          completed: true,
          moves: moves + 1,
          timeElapsed,
          score,
          perfectGame: moves + 1 <= 50 && timeElapsed <= 120
        };
        
        recordGameSessionToAPI(score);
        onGameEnd?.(result);
      }
    }
  };

  // Remove unused adjacent check function since we're allowing any two pieces to swap

  const isPuzzleSolved = (currentPieces: number[]): boolean => {
    // Check if pieces are in order 0,1,2,...,15
    for (let i = 0; i < 16; i++) {
      if (currentPieces[i] !== i) return false;
    }
    return true;
  };

  const calculateScore = (totalMoves: number, totalTime: number): number => {
    const baseScore = 1000;
    const movePenalty = Math.max(0, totalMoves - 30) * 10;
    const timePenalty = Math.max(0, totalTime - 120) * 5;
    return Math.max(100, baseScore - movePenalty - timePenalty);
  };

  const resetGame = () => {
    setGameStatus('instructions');
    setIsRunning(false);
    setMoves(0);
    setTimeElapsed(0);
    setImagePieces([]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render instructions
  if (gameStatus === 'instructions') {
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center space-y-4">
            <div className="text-6xl mb-4">🧩</div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Star Seekers Puzzle</h2>
            <p className="text-gray-300 text-lg mb-6">
              Solve beautiful Star Atlas artwork puzzles! Click two pieces to swap their positions and recreate the original image.
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-purple-900/30 p-4 rounded-lg">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <h3 className="font-bold text-purple-300">Goal</h3>
                <p className="text-sm text-gray-400">Click two pieces to swap their positions</p>
              </div>
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <Timer className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <h3 className="font-bold text-blue-300">Scoring</h3>
                <p className="text-sm text-gray-400">Fewer moves and faster time = higher score</p>
              </div>
            </div>

            <Button 
              onClick={handleStartGame}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Playing - 1 Credit
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // Render preview
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

  // Render playing state
  if (gameStatus === 'playing') {
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="space-y-6 max-w-4xl mx-auto">
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
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-4 gap-0 max-w-md mx-auto border-2 border-purple-400">
                {pieces.map((piece, index) => (
                  <div
                    key={index}
                    onClick={() => handlePieceClick(index)}
                    className={`
                      aspect-square border-0 transition-all duration-200 cursor-pointer hover:brightness-110
                      ${selectedPiece === index ? 'ring-4 ring-yellow-400 ring-inset' : ''}
                    `}
                  >
                    {imagePieces[piece] && (
                      <img
                        src={imagePieces[piece]}
                        alt={`Piece ${piece + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Render completed state
  if (gameStatus === 'completed') {
    const score = calculateScore(moves, timeElapsed);
    const isPerfect = moves <= 50 && timeElapsed <= 120;
    
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

  return null;
};

export default PuzzleGame;