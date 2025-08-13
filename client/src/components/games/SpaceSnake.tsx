import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useSnakeImageLoader } from '@/hooks/useSnakeImageLoader';
import { SnakeGameState, Snake, Direction, Resource, ResourceType, SnakeEnemy, SnakeEnemyType, Position, SnakeSegment } from '@/types/snake';
import { recordGameSession } from '@/utils/gameLeaderboard';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 640;
const GRID_SIZE = 43; // Size of each grid cell (24 * 1.8 = 43.2, rounded down)
const INITIAL_SPEED = 150; // ms between moves

interface SpaceSnakeProps {
  onGameStateChange?: (isPlaying: boolean) => void;
  onGameEnd?: (score: number) => void;
}

const SpaceSnake: React.FC<SpaceSnakeProps> = ({ onGameStateChange, onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { images, loading: imagesLoading, error: imageError } = useSnakeImageLoader();

  // Audio refs
  const collectSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);

  const [gameState, setGameState] = useState<SnakeGameState>({
    snake: {
      segments: [
        {
          id: 'head',
          position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
          rotation: 0
        }
      ],
      direction: 'right',
      nextDirection: 'right'
    },
    resources: [],
    enemies: [],
    score: 0,
    gameStatus: 'menu',
    gameSpeed: INITIAL_SPEED,
    lastMoveTime: 0,
    collectedResources: new Set()
  });

  const [starField, setStarField] = useState<Array<{ x: number; y: number; speed: number; brightness: number }>>([]);
  const [lastResourceSpawn, setLastResourceSpawn] = useState(0);
  const [lastEnemySpawn, setLastEnemySpawn] = useState(0);

  // Initialize audio
  useEffect(() => {
    // Load collection sound (pointing to actual audio file)
    collectSoundRef.current = new Audio('/assets/game2/enemies/Sounds/live.dataset/live.wav');
    collectSoundRef.current.preload = 'auto';
    collectSoundRef.current.volume = 0.5;

    // Load unified game over sound
    gameOverSoundRef.current = new Audio('/assets/sounds/game-over-deep-male-voice-clip-352695.mp3');
    gameOverSoundRef.current.preload = 'auto';
    gameOverSoundRef.current.volume = 0.7;

    return () => {
      // Cleanup
      if (collectSoundRef.current) {
        collectSoundRef.current.src = '';
        collectSoundRef.current = null;
      }
      if (gameOverSoundRef.current) {
        gameOverSoundRef.current.src = '';
        gameOverSoundRef.current = null;
      }
    };
  }, []);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Play collection sound
  const playCollectSound = () => {
    console.log('🔊 Attempting to play collection sound...');
    if (collectSoundRef.current) {
      collectSoundRef.current.currentTime = 0; // Reset to start
      collectSoundRef.current.play()
        .then(() => console.log('✅ Collection sound played successfully'))
        .catch(e => console.log('❌ Could not play collect sound:', e));
    } else {
      console.log('❌ Collection sound ref is null');
    }
  };

  // Play game over sound
  const playGameOverSound = () => {
    console.log('🔊 Attempting to play game over sound...');
    if (gameOverSoundRef.current) {
      gameOverSoundRef.current.currentTime = 0; // Reset to start
      gameOverSoundRef.current.play()
        .then(() => console.log('✅ Game over sound played successfully'))
        .catch(e => console.log('❌ Could not play game over sound:', e));
    } else {
      console.log('❌ Game over sound ref is null');
    }
  };

  // Function to record game session to API
  const recordGameSessionToAPI = async (score: number) => {
    try {
      const success = await recordGameSession({
        gameId: 2,
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

  // Create initial snake
  const createInitialSnake = (): Snake => {
    const centerX = Math.floor(CANVAS_WIDTH / 2 / GRID_SIZE) * GRID_SIZE;
    const centerY = Math.floor(CANVAS_HEIGHT / 2 / GRID_SIZE) * GRID_SIZE;

    return {
      segments: [
        {
          id: 'head',
          position: { x: centerX, y: centerY },
          rotation: 0
        }
      ],
      direction: 'right',
      nextDirection: 'right'
    };
  };

  // Get direction vector
  const getDirectionVector = (direction: Direction): Position => {
    switch (direction) {
      case 'up': return { x: 0, y: -GRID_SIZE };
      case 'down': return { x: 0, y: GRID_SIZE };
      case 'left': return { x: -GRID_SIZE, y: 0 };
      case 'right': return { x: GRID_SIZE, y: 0 };
    }
  };

  // Get rotation angle for direction (assuming sprite faces up by default)
  const getRotationForDirection = (direction: Direction): number => {
    switch (direction) {
      case 'up': return 0;      // Default sprite orientation
      case 'right': return 90;  // Rotate 90° clockwise
      case 'down': return 180;  // Rotate 180°
      case 'left': return 270;  // Rotate 270° clockwise (or -90°)
    }
  };

  // Check if two directions are opposite
  const areOppositeDirections = (dir1: Direction, dir2: Direction): boolean => {
    return (
      (dir1 === 'up' && dir2 === 'down') ||
      (dir1 === 'down' && dir2 === 'up') ||
      (dir1 === 'left' && dir2 === 'right') ||
      (dir1 === 'right' && dir2 === 'left')
    );
  };

  // Check if position is safe (away from snake and enemies)
  const isPositionSafe = (position: Position, snake: Snake, enemies: SnakeEnemy[]): boolean => {
    // Check snake collision
    const snakeCollision = snake.segments.some(segment => 
      segment.position.x === position.x && segment.position.y === position.y
    );
    if (snakeCollision) return false;

    // Check enemy collision (accounting for larger enemy sizes)
    const enemyCollision = enemies.some(enemy => {
      if (!enemy.active) return false;

      // Calculate enemy bounds based on type
      let enemySize = GRID_SIZE;
      let offsetX = 0;
      let offsetY = 0;

      if (enemy.type === 'c8' || enemy.type === 'c9') {
        enemySize = GRID_SIZE * 1.9; // Updated size (150% + 40%)
        offsetX = -(enemySize - GRID_SIZE) / 2;
        offsetY = -(enemySize - GRID_SIZE) / 2;
      } else if (enemy.type === 'c11') {
        enemySize = GRID_SIZE * 3.2; // Updated size (250% + 70%)
        offsetX = -(enemySize - GRID_SIZE) / 2;
        offsetY = -(enemySize - GRID_SIZE) / 2;
      }

      const enemyLeft = enemy.position.x + offsetX;
      const enemyRight = enemyLeft + enemySize;
      const enemyTop = enemy.position.y + offsetY;
      const enemyBottom = enemy.position.y + offsetY + enemySize;

      const resourceLeft = position.x;
      const resourceRight = resourceLeft + GRID_SIZE;
      const resourceTop = position.y;
      const resourceBottom = resourceTop + GRID_SIZE;

      // Check if rectangles overlap
      return !(resourceRight <= enemyLeft || 
               resourceLeft >= enemyRight || 
               resourceBottom <= enemyTop || 
               resourceTop >= enemyBottom);
    });
    if (enemyCollision) return false;

    return true;
  };

  // Spawn all 4 R4 resources simultaneously
  const spawnAllResources = (snake: Snake, enemies: SnakeEnemy[]): Resource[] => {
    const types: ResourceType[] = ['ammo', 'food', 'fuel', 'tool'];
    const points = { ammo: 10, food: 15, fuel: 20, tool: 25 };
    const resources: Resource[] = [];
    const currentTime = Date.now();

    for (const type of types) {
      let position: Position;
      let attempts = 0;

      do {
        position = {
          x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE,
          y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE
        };
        attempts++;
      } while (!isPositionSafe(position, snake, enemies) && attempts < 100);

      resources.push({
        id: generateId(),
        position,
        type,
        points: points[type],
        collected: false,
        spawnTime: currentTime,
        lifespan: 5000 // 5 seconds
      });
    }

    return resources;
  };

  // Spawn enemy at random position
  const spawnEnemy = (snake: Snake, existingEnemies: SnakeEnemy[]): SnakeEnemy => {
    const types: SnakeEnemyType[] = ['e1', 'e2', 'e4', 'e6', 'c8', 'c9', 'c11'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Find safe position
    let position: Position;
    let attempts = 0;
    do {
      position = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE,
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE
      };
      attempts++;
    } while (!isPositionSafe(position, snake, existingEnemies) && attempts < 100);

    return {
      id: generateId(),
      position,
      type,
      spawnTime: Date.now(),
      lifespan: 5000, // Match R4 resource lifespan for synchronized waves
      active: true
    };
  };

  // Spawn multiple enemies for wave system
  const spawnEnemyWave = (count: number, snake: Snake, existingEnemies: SnakeEnemy[]): SnakeEnemy[] => {
    const newEnemies: SnakeEnemy[] = [];
    const allEnemies = [...existingEnemies];

    for (let i = 0; i < count; i++) {
      const newEnemy = spawnEnemy(snake, allEnemies);
      newEnemies.push(newEnemy);
      allEnemies.push(newEnemy); // Add to list for next spawn position calculation
    }

    console.log(`Spawned enemy wave: ${count} enemies`);
    return newEnemies;
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (gameState.gameStatus === 'playing') {
        let nextDirection: Direction | null = null;

        if (key === 'w' || key === 'arrowup') nextDirection = 'up';
        else if (key === 's' || key === 'arrowdown') nextDirection = 'down';
        else if (key === 'a' || key === 'arrowleft') nextDirection = 'left';
        else if (key === 'd' || key === 'arrowright') nextDirection = 'right';

        if (nextDirection && !areOppositeDirections(gameState.snake.direction, nextDirection)) {
          setGameState(prev => ({
            ...prev,
            snake: {
              ...prev.snake,
              nextDirection
            }
          }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameStatus, gameState.snake.direction]);

  // Game logic update
  const updateGame = useCallback((deltaTime: number) => {
    if (gameState.gameStatus !== 'playing') return;

    const currentTime = Date.now();

    setGameState(prevState => {
      const newState = { ...prevState };

      // Move snake based on game speed
      if (currentTime - newState.lastMoveTime > newState.gameSpeed) {
        const { snake } = newState;
        const head = snake.segments[0];
        const newDirection = snake.nextDirection;
        const directionVector = getDirectionVector(newDirection);

        // Calculate new head position with wall wrapping
        let newHeadPosition = {
          x: head.position.x + directionVector.x,
          y: head.position.y + directionVector.y
        };

        // Wrap around walls (teleport to opposite side) - ensure grid alignment
        let wallWrapped = false;
        if (newHeadPosition.x < 0) {
          // Make sure we land on a grid-aligned position
          newHeadPosition.x = Math.floor((CANVAS_WIDTH - GRID_SIZE) / GRID_SIZE) * GRID_SIZE;
          wallWrapped = true;
          console.log('Wall wrap: Left → Right');
        } else if (newHeadPosition.x >= CANVAS_WIDTH) {
          newHeadPosition.x = 0;
          wallWrapped = true;
          console.log('Wall wrap: Right → Left');
        }

        if (newHeadPosition.y < 0) {
          // Make sure we land on a grid-aligned position
          newHeadPosition.y = Math.floor((CANVAS_HEIGHT - GRID_SIZE) / GRID_SIZE) * GRID_SIZE;
          wallWrapped = true;
          console.log('Wall wrap: Top → Bottom');
        } else if (newHeadPosition.y >= CANVAS_HEIGHT) {
          newHeadPosition.y = 0;
          wallWrapped = true;
          console.log('Wall wrap: Bottom → Top');
        }

        if (wallWrapped) {
          console.log(`After wall wrap: Snake head at (${newHeadPosition.x}, ${newHeadPosition.y})`);
        }

        // Check self collision
        const selfCollision = snake.segments.some(segment => 
          segment.position.x === newHeadPosition.x && segment.position.y === newHeadPosition.y
        );
        if (selfCollision) {
          newState.gameStatus = 'gameOver';
          playGameOverSound();
          recordGameSessionToAPI(newState.score);
          onGameStateChange?.(false);
          onGameEnd?.(newState.score);
          return newState;
        }

        // Check enemy collision with precise hitboxes (not full PNG area)
        const enemyCollision = newState.enemies.some(enemy => {
          if (!enemy.active) return false;

          // Calculate enemy hitbox (smaller than full sprite to avoid transparent areas)
          let enemyHitboxSize = GRID_SIZE * 0.7; // 70% of sprite size for more precise collision
          let enemyRenderSize = GRID_SIZE;
          let renderOffsetX = 0;
          let renderOffsetY = 0;

          if (enemy.type === 'c8' || enemy.type === 'c9') {
            enemyRenderSize = GRID_SIZE * 1.9; // Updated size (150% + 40%)
            enemyHitboxSize = enemyRenderSize * 0.6; // 60% of render size for larger ships  
            renderOffsetX = -(enemyRenderSize - GRID_SIZE) / 2;
            renderOffsetY = -(enemyRenderSize - GRID_SIZE) / 2;
          } else if (enemy.type === 'c11') {
            enemyRenderSize = GRID_SIZE * 3.2; // Updated size (250% + 70%)
            enemyHitboxSize = enemyRenderSize * 0.5; // 50% of render size for boss ship
            renderOffsetX = -(enemyRenderSize - GRID_SIZE) / 2;
            renderOffsetY = -(enemyRenderSize - GRID_SIZE) / 2;
          }

          // Center the hitbox within the rendered sprite
          const hitboxOffsetX = renderOffsetX + (enemyRenderSize - enemyHitboxSize) / 2;
          const hitboxOffsetY = renderOffsetY + (enemyRenderSize - enemyHitboxSize) / 2;

          const enemyLeft = enemy.position.x + hitboxOffsetX;
          const enemyRight = enemyLeft + enemyHitboxSize;
          const enemyTop = enemy.position.y + hitboxOffsetY;
          const enemyBottom = enemyTop + enemyHitboxSize;

          // Snake hitbox (also slightly smaller for fairer gameplay)
          const snakeHitboxSize = GRID_SIZE * 0.8; // 80% of snake size
          const snakeHitboxOffset = (GRID_SIZE - snakeHitboxSize) / 2;
          const snakeLeft = newHeadPosition.x + snakeHitboxOffset;
          const snakeRight = snakeLeft + snakeHitboxSize;
          const snakeTop = newHeadPosition.y + snakeHitboxOffset;
          const snakeBottom = snakeTop + snakeHitboxSize;

          // Check if hitboxes overlap
          return !(snakeRight <= enemyLeft || 
                   snakeLeft >= enemyRight || 
                   snakeBottom <= enemyTop || 
                   snakeTop >= enemyBottom);
        });
        if (enemyCollision) {
          console.log(`Enemy collision detected! Snake at (${newHeadPosition.x}, ${newHeadPosition.y}), Wall wrapped: ${wallWrapped}`);
          newState.gameStatus = 'gameOver';
          playGameOverSound();
          recordGameSessionToAPI(newState.score);
          onGameStateChange?.(false);
          onGameEnd?.(newState.score);
          return newState;
        }

        // Create new head
        const newHead: SnakeSegment = {
          id: generateId(),
          position: newHeadPosition,
          rotation: getRotationForDirection(newDirection)
        };

        // Snake head debug logging removed to reduce console spam

        // Check resource collection
        let resourceCollected = false;
        let shouldGrowSnake = false;

        newState.resources = newState.resources.map(resource => {
          if (!resource.collected && 
              resource.position.x === newHeadPosition.x && 
              resource.position.y === newHeadPosition.y) {
            resourceCollected = true;
            newState.score += resource.points;
            console.log(`Collected ${resource.type}! Score: ${newState.score}`);

            // Play collection sound
            playCollectSound();

            // Add to collected resources
            newState.collectedResources.add(resource.type);
            console.log(`Collected resources:`, Array.from(newState.collectedResources));

            // Check if we have all 4 resource types
            if (newState.collectedResources.size === 4) {
              shouldGrowSnake = true;
              newState.collectedResources.clear(); // Reset for next cycle
              console.log('Snake should grow! All 4 resources collected.');
              // Enemy count will be updated in the next synchronized wave
            }

            return { ...resource, collected: true };
          }
          return resource;
        });

        // Update snake
        const newSegments = [newHead, ...snake.segments];
        if (!shouldGrowSnake) {
          newSegments.pop(); // Remove tail unless we should grow
        }

        newState.snake = {
          ...snake,
          segments: newSegments,
          direction: newDirection
        };

        newState.lastMoveTime = currentTime;
      }

      // Remove collected and expired resources
      newState.resources = newState.resources.filter(resource => 
        !resource.collected && (currentTime - resource.spawnTime < resource.lifespan)
      );

      // Spawn synchronized wave of resources and enemies when current set is gone
      if (newState.resources.length === 0) {
        // Calculate enemy count based on snake length: 3 base + (length - 1)
        const enemyCount = 3 + (newState.snake.segments.length - 1);

        // Clear existing enemies and spawn new wave
        newState.enemies = [];
        const newEnemies = spawnEnemyWave(enemyCount, newState.snake, []);
        newState.enemies = newEnemies;

        // Spawn resources after enemies are placed
        newState.resources = spawnAllResources(newState.snake, newState.enemies);

        console.log(`Spawned synchronized wave: ${enemyCount} enemies + 4 resources (Snake length: ${newState.snake.segments.length})`);
        setLastResourceSpawn(currentTime);
      }

      // Enemies are now managed by synchronized wave system with resources

      return newState;
    });
  }, [gameState.gameStatus, lastResourceSpawn, lastEnemySpawn]);

  // Initialize static starfield
  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      if (starField.length === 0) {
        const newStars = [];
        for (let i = 0; i < 100; i++) {
          newStars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            speed: 0, // Make stars static
            brightness: Math.random() * 0.8 + 0.2
          });
        }
        setStarField(newStars);
      }
    }
  }, [gameState.gameStatus, starField.length]);

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000014';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw starfield
    starField.forEach(star => {
      const alpha = star.brightness;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), 1, 1);
    });

    if (gameState.gameStatus === 'playing') {
      // Draw resources
      gameState.resources.forEach(resource => {
        const resourceSprite = images && images.resources[resource.type];
        if (resourceSprite) {
          ctx.drawImage(
            resourceSprite,
            resource.position.x,
            resource.position.y,
            GRID_SIZE,
            GRID_SIZE
          );
        } else {
          // Fallback
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(resource.position.x, resource.position.y, GRID_SIZE, GRID_SIZE);
        }
      });

      // Draw enemies with different sizes
      gameState.enemies.forEach(enemy => {
        if (enemy.active) {
          const enemySprite = images && images.enemies[enemy.type];
          if (enemySprite) {
            // Calculate enemy size based on type
            let enemySize = GRID_SIZE;
            let offsetX = 0;
            let offsetY = 0;

            if (enemy.type === 'c8' || enemy.type === 'c9') {
              // C8 and C9 are 190% bigger (150% + 40% increase)
              enemySize = GRID_SIZE * 1.9;
              offsetX = -(enemySize - GRID_SIZE) / 2;
              offsetY = -(enemySize - GRID_SIZE) / 2;
            } else if (enemy.type === 'c11') {
              // C11 is 320% bigger (250% + 70% increase)
              enemySize = GRID_SIZE * 3.2;
              offsetX = -(enemySize - GRID_SIZE) / 2;
              offsetY = -(enemySize - GRID_SIZE) / 2;
            }

            ctx.drawImage(
              enemySprite,
              enemy.position.x + offsetX,
              enemy.position.y + offsetY,
              enemySize,
              enemySize
            );
          } else {
            // Fallback with size scaling
            let enemySize = GRID_SIZE;
            let offsetX = 0;
            let offsetY = 0;

            if (enemy.type === 'c8' || enemy.type === 'c9') {
              enemySize = GRID_SIZE * 1.9;
              offsetX = -(enemySize - GRID_SIZE) / 2;
              offsetY = -(enemySize - GRID_SIZE) / 2;
            } else if (enemy.type === 'c11') {
              enemySize = GRID_SIZE * 3.2;
              offsetX = -(enemySize - GRID_SIZE) / 2;
              offsetY = -(enemySize - GRID_SIZE) / 2;
            }

            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.position.x + offsetX, enemy.position.y + offsetY, enemySize, enemySize);
          }
        }
      });

      // Draw snake - all segments as player ships
      gameState.snake.segments.forEach((segment, index) => {
        if (images && images.player) {
          // Draw all segments with player ship sprite
          ctx.save();
          ctx.translate(segment.position.x + GRID_SIZE / 2, segment.position.y + GRID_SIZE / 2);
          ctx.rotate((segment.rotation * Math.PI) / 180);

          // Add slight transparency to body segments to distinguish from head
          if (index > 0) {
            ctx.globalAlpha = 0.8;
          }

          ctx.drawImage(
            images.player,
            -GRID_SIZE / 2,
            -GRID_SIZE / 2,
            GRID_SIZE,
            GRID_SIZE
          );
          ctx.restore();
        } else {
          // Fallback: Draw colored rectangles
          ctx.fillStyle = index === 0 ? '#00aaff' : '#0088dd';
          ctx.fillRect(segment.position.x, segment.position.y, GRID_SIZE, GRID_SIZE);

          // Add border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(segment.position.x, segment.position.y, GRID_SIZE, GRID_SIZE);
        }
      });

      // Canvas now only shows the game - no UI text
    }
  }, [gameState, images, starField]);

  // Game loop
  useGameLoop((deltaTime) => {
    updateGame(deltaTime);
    render();
  }, gameState.gameStatus === 'playing');

  // Render loop for non-playing states
  useEffect(() => {
    render();
  }, [render, gameState.gameStatus]);

  // Notify parent of game state changes
  useEffect(() => {
    if (gameState.gameStatus === 'gameOver') {
      onGameStateChange?.(false);
      onGameEnd?.(gameState.score);
    }
  }, [gameState.gameStatus, onGameStateChange, onGameEnd, gameState.score]);

  const startGame = () => {
    const initialSnake = createInitialSnake();
    const initialEnemies = spawnEnemyWave(3, initialSnake, []); // Spawn 3 initial enemies

    setGameState({
      snake: initialSnake,
      resources: spawnAllResources(initialSnake, initialEnemies),
      enemies: initialEnemies,
      score: 0,
      gameStatus: 'playing',
      gameSpeed: INITIAL_SPEED,
      lastMoveTime: Date.now(),
      collectedResources: new Set()
    });
    setStarField([]);
    setLastResourceSpawn(Date.now());
    setLastEnemySpawn(Date.now());
    onGameStateChange?.(true);
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'menu',
      collectedResources: new Set()
    }));
    onGameStateChange?.(false);
  };

  const goToMainMenu = () => {
    window.location.href = '/dashboard';
  };

  // Calculate remaining time for resources
  const getResourceTimeLeft = (): number => {
    if (gameState.resources.length > 0) {
      const firstResource = gameState.resources[0];
      const timeLeft = Math.max(0, firstResource.lifespan - (Date.now() - firstResource.spawnTime));
      return Math.ceil(timeLeft / 1000);
    }
    return 0;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="game-card">
        <CardContent className="p-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border border-primary/30 rounded bg-black"
            />

            {gameState.gameStatus === 'menu' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded">
                <div className="text-center text-white">
                  <h2 className="text-3xl font-futuristic font-bold mb-4 neon-text">SPACE SNAKE</h2>
                  <p className="mb-6 text-lg">Use WASD or Arrow Keys to move<br />Collect resources to grow your snake</p>

                  {/* Debug Information */}
                  <div className="mb-4 text-sm">
                    <p>Loading Status: {imagesLoading ? 'Loading...' : 'Complete'}</p>
                    <p>Images Available: {images ? 'Yes' : 'No'}</p>
                    {imageError && <p className="text-red-400">Error: {imageError}</p>}
                  </div>

                  <Button 
                    onClick={startGame} 
                    disabled={imagesLoading || !images}
                    className="neon-glow bg-primary hover:bg-primary/90 disabled:opacity-50"
                  >
                    {imagesLoading ? 'LOADING...' : !images ? 'ASSETS ERROR' : 'START GAME - 1 Credit'}
                  </Button>
                </div>
              </div>
            )}

            {gameState.gameStatus === 'gameOver' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded">
                <div className="text-center text-white">
                  <h2 className="text-5xl font-futuristic font-bold mb-6 text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse">
                    GAME OVER
                  </h2>
                  <div className="mb-6 space-y-2">
                    <p className="text-2xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                      Final Score: {gameState.score.toLocaleString()}
                    </p>
                    <p className="text-lg text-gray-300">
                      Snake Length: {gameState.snake.segments.length}
                    </p>
                  </div>
                  <div className="space-x-4 mt-8">
                    <Button onClick={startGame} className="neon-glow bg-primary hover:bg-primary/90 text-lg px-8 py-3">
                      PLAY AGAIN - 1 Credit
                    </Button>
                    <Button onClick={goToMainMenu} variant="outline" className="text-lg px-8 py-3">
                      MAIN MENU
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Information Panel - Only visible during gameplay */}
      {gameState.gameStatus === 'playing' && (
        <Card className="game-card w-full max-w-4xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">

              {/* Score and Stats */}
              <div className="text-center">
                <h3 className="text-lg font-futuristic font-bold mb-2 text-primary">Game Stats</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-yellow-400">Score: {gameState.score.toLocaleString()}</p>
                  <p className="text-lg">Length: {gameState.snake.segments.length}</p>
                </div>
              </div>

              {/* Resource Collection Progress */}
              <div className="text-center">
                <h3 className="text-lg font-futuristic font-bold mb-2 text-primary">Resources</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {(['ammo', 'food', 'fuel', 'tool'] as ResourceType[]).map((type) => {
                    const isCollected = gameState.collectedResources.has(type);
                    const resourceNames = { ammo: 'AMMO', food: 'FOOD', fuel: 'FUEL', tool: 'TOOL' };
                    return (
                      <div
                        key={type}
                        className={`px-2 py-1 rounded text-sm font-bold ${
                          isCollected 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                        }`}
                      >
                        {resourceNames[type]}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-300">Collect all 4 to grow!</p>
              </div>

              {/* Timer */}
              <div className="text-center">
                <h3 className="text-lg font-futuristic font-bold mb-2 text-primary">Timer</h3>
                {gameState.resources.length > 0 ? (
                  <div className="space-y-1">
                    <p className={`text-3xl font-bold ${
                      getResourceTimeLeft() <= 2 ? 'text-red-400 animate-pulse' : 'text-yellow-400'
                    }`}>
                      {getResourceTimeLeft()}s
                    </p>
                    <p className="text-sm text-gray-300">Time remaining</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-400">--</p>
                    <p className="text-sm text-gray-300">Spawning resources...</p>
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpaceSnake;