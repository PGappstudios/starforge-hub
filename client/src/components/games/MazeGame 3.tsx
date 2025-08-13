import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useMazeImageLoader } from '@/hooks/useMazeImageLoader';
import { 
  CargoGameState, 
  CargoPlayer, 
  CargoItem, 
  CSSStation,
  CargoEnemy,
  CargoParticle,
  Position,
  Direction,
  CargoGameResult,
  CargoItemType,
  CARGO_CONFIG
} from '@/types/maze';

interface MazeGameProps {
  onGameEnd?: (result: CargoGameResult) => void;
  onGameStateChange?: (isPlaying: boolean) => void;
}

const MazeGame: React.FC<MazeGameProps> = ({ onGameEnd, onGameStateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { images, loading: imagesLoading, error: imageError } = useMazeImageLoader();

  const navigate = useNavigate();
  // Grid configuration for Pac-Man style maze
  const GRID_CONFIG = {
    CELL_SIZE: 40,
    GRID_WIDTH: Math.floor(CARGO_CONFIG.CANVAS_WIDTH / 40),  // 30 cells
    GRID_HEIGHT: Math.floor(CARGO_CONFIG.CANVAS_HEIGHT / 40), // 20 cells
    WALL_SIZE: 16  // Half-sized walls for more open space
  };

  const [gameState, setGameState] = useState<CargoGameState>(() => createInitialGameState());

  // Audio refs
  const collectSoundRef = useRef<HTMLAudioElement | null>(null);
  const deliverySoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  const respawnSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    collectSoundRef.current = new Audio('/assets/game2/enemies/Sounds/live.dataset/live.wav');
    collectSoundRef.current.volume = 0.4;

    deliverySoundRef.current = new Audio('/assets/game2/enemies/Sounds/powerup.dataset/powerup.wav');
    deliverySoundRef.current.volume = 0.5;

    gameOverSoundRef.current = new Audio('/assets/sounds/game-over-deep-male-voice-clip-352695.mp3');
    gameOverSoundRef.current.volume = 0.6;

    respawnSoundRef.current = new Audio('/assets/game6/sounds/shipexplosion.dataset/shipexplosion.wav');
    respawnSoundRef.current.volume = 0.5;

    return () => {
      [collectSoundRef, deliverySoundRef, gameOverSoundRef, respawnSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.src = '';
          ref.current = null;
        }
      });
    };
  }, []);

  function createInitialGameState(): CargoGameState {
    const availableItems = generateCargoItems();
    const enemies = generateEnemies();

    return {
      player: {
        id: 'player',
        position: { 
          x: GRID_CONFIG.CELL_SIZE * Math.floor(GRID_CONFIG.GRID_WIDTH / 2) + GRID_CONFIG.CELL_SIZE / 2, 
          y: GRID_CONFIG.CELL_SIZE * Math.floor(GRID_CONFIG.GRID_HEIGHT / 2) + GRID_CONFIG.CELL_SIZE / 2 
        },
        direction: 'up',
        rotation: 0,
        speed: CARGO_CONFIG.PLAYER_SPEED,
        isMoving: false,
        cargo: {
          items: [],
          totalWeight: 0,
          maxCapacity: CARGO_CONFIG.MAX_CARGO_WEIGHT
        },
        score: 0,
        deliveryCount: 0
      },
      availableItems,
      cssStation: {
        id: 'css_station',
        position: { 
          x: GRID_CONFIG.CELL_SIZE * Math.floor(GRID_CONFIG.GRID_WIDTH / 2) + GRID_CONFIG.CELL_SIZE / 2, 
          y: GRID_CONFIG.CELL_SIZE * Math.floor(GRID_CONFIG.GRID_HEIGHT / 2) + GRID_CONFIG.CELL_SIZE / 2
        },
        radius: CARGO_CONFIG.CSS_RADIUS,
        animationPhase: 0,
        deliveredItems: [],
        totalDeliveries: 0
      },
      enemies,
      particles: [],
      gameStatus: 'menu',
      score: 0,
      totalItems: availableItems.length,
      collectedItems: 0,
      deliveredItems: 0,
      gameTime: 0,
      levelStartTime: 0,
      killedEnemies: 0,
      timeRemaining: CARGO_CONFIG.GAME_DURATION,
      gameDuration: CARGO_CONFIG.GAME_DURATION,
      currentLevel: 1,
      totalLevels: CARGO_CONFIG.TOTAL_LEVELS
    };
  }

  function generateCargoItems(): CargoItem[] {
    const items: CargoItem[] = [];
    let id = 0;

    // Define open corner positions for heavy items (3kg) - accessible from all directions
    const corners = [
      { x: GRID_CONFIG.CELL_SIZE * 2 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 1 + GRID_CONFIG.CELL_SIZE / 2 },   // Top-left open area (ARCO)
      { x: GRID_CONFIG.CELL_SIZE * 27 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 1 + GRID_CONFIG.CELL_SIZE / 2 }, // Top-right open area (DIAMOND)
      { x: GRID_CONFIG.CELL_SIZE * 2 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 18 + GRID_CONFIG.CELL_SIZE / 2 }, // Bottom-left open area (ROCH)
      { x: GRID_CONFIG.CELL_SIZE * 27 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 18 + GRID_CONFIG.CELL_SIZE / 2 } // Bottom-right open area
    ];

    // Define pathway positions for light items (avoiding walls)
    const pathwayPositions = generatePathwayPositions();

    // Generate items for each type
    Object.entries(CARGO_CONFIG.ITEM_DEFINITIONS).forEach(([itemType, definition]) => {
      const type = itemType as CargoItemType;
      const isHeavyItem = definition.weight === 3;

      if (isHeavyItem) {
        // Place heavy items (ARCO, DIAMOND, ROCH) in corners with validation
        const heavyItems = ['ARCO', 'DIAMOND', 'ROCH'];
        const cornerIndex = heavyItems.indexOf(type);

        if (cornerIndex !== -1 && cornerIndex < corners.length) {
          let itemPosition = corners[cornerIndex];

          // Validate the corner position is safe
          if (!isPositionSafeForItem(itemPosition.x, itemPosition.y)) {
            // Find a safe alternative position near the corner
            const cornerGridX = Math.floor(itemPosition.x / GRID_CONFIG.CELL_SIZE);
            const cornerGridY = Math.floor(itemPosition.y / GRID_CONFIG.CELL_SIZE);

            // Search for safe position in expanding radius around the corner
            let found = false;
            for (let radius = 1; radius <= 3 && !found; radius++) {
              for (let offsetX = -radius; offsetX <= radius && !found; offsetX++) {
                for (let offsetY = -radius; offsetY <= radius && !found; offsetY++) {
                  const testX = (cornerGridX + offsetX) * GRID_CONFIG.CELL_SIZE + GRID_CONFIG.CELL_SIZE / 2;
                  const testY = (cornerGridY + offsetY) * GRID_CONFIG.CELL_SIZE + GRID_CONFIG.CELL_SIZE / 2;

                  if (isPositionSafeForItem(testX, testY)) {
                    itemPosition = { x: testX, y: testY };
                    found = true;
                    console.log(`Heavy item ${type} moved from unsafe corner to safe position (${Math.floor(testX/40)}, ${Math.floor(testY/40)})`);
                  }
                }
              }
            }
          }

          items.push({
            id: `cargo_${id++}`,
            type,
            position: itemPosition,
            weight: definition.weight,
            points: definition.points,
            collected: false,
            animationPhase: Math.random() * Math.PI * 2
          });
        }
      } else {
        // Place light items along pathways
        const count = Math.random() > 0.7 ? 2 : 1;

        for (let i = 0; i < count && pathwayPositions.length > 0; i++) {
          const positionIndex = Math.floor(Math.random() * pathwayPositions.length);
          const position = pathwayPositions.splice(positionIndex, 1)[0];

          items.push({
            id: `cargo_${id++}`,
            type,
            position,
            weight: definition.weight,
            points: definition.points,
            collected: false,
            animationPhase: Math.random() * Math.PI * 2
          });
        }
      }
    });

    return items;
  }

  function generateEnemies(): CargoEnemy[] {
    const enemies: CargoEnemy[] = [];
    const currentTime = Date.now();

    // Define strategic enemy spawn positions (in open areas away from CSS station)
    const enemySpawnPositions = [
      { x: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2 },   // Top-left area
      { x: GRID_CONFIG.CELL_SIZE * 24 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2 }, // Top-right area
      { x: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 14 + GRID_CONFIG.CELL_SIZE / 2 }, // Bottom-left area
      { x: GRID_CONFIG.CELL_SIZE * 24 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 14 + GRID_CONFIG.CELL_SIZE / 2 }, // Bottom-right area
      { x: GRID_CONFIG.CELL_SIZE * 2 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 9 + GRID_CONFIG.CELL_SIZE / 2 },   // Left middle
      { x: GRID_CONFIG.CELL_SIZE * 27 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 9 + GRID_CONFIG.CELL_SIZE / 2 }, // Right middle
      { x: GRID_CONFIG.CELL_SIZE * 10 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 2 + GRID_CONFIG.CELL_SIZE / 2 }, // Top middle
      { x: GRID_CONFIG.CELL_SIZE * 19 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 17 + GRID_CONFIG.CELL_SIZE / 2 } // Bottom middle
    ];

    for (let i = 0; i < CARGO_CONFIG.ENEMY_COUNT; i++) {
      let spawnPosition = enemySpawnPositions[i % enemySpawnPositions.length];

      // Validate spawn position is safe using enemy validation (not item validation)
      if (!isEnemyPositionValid(spawnPosition.x, spawnPosition.y)) {
        // Find alternative safe spawn position using proper enemy validation
        let found = false;
        for (let radius = 1; radius <= 8 && !found; radius++) {
          for (let offsetX = -radius; offsetX <= radius && !found; offsetX++) {
            for (let offsetY = -radius; offsetY <= radius && !found; offsetY++) {
              const testX = spawnPosition.x + (offsetX * GRID_CONFIG.CELL_SIZE);
              const testY = spawnPosition.y + (offsetY * GRID_CONFIG.CELL_SIZE);

              if (isEnemyPositionValid(testX, testY)) {
                spawnPosition = { x: testX, y: testY };
                found = true;
                console.log(`Enemy ${i} spawn adjusted to safe position (${Math.floor(testX/40)}, ${Math.floor(testY/40)})`);
              }
            }
          }
        }
      }

      // Generate patrol points for this enemy
      const patrolPoints = generatePatrolRoute(spawnPosition, i);

      enemies.push({
        id: `enemy_${i}`,
        position: spawnPosition,
        direction: 'up',
        speed: CARGO_CONFIG.ENEMY_SPEED,
        detectionRadius: CARGO_CONFIG.ENEMY_DETECTION_RADIUS,
        isChasing: false,
        animationPhase: Math.random() * Math.PI * 2,
        active: true,
        lastMoveTime: currentTime,
        patrolPoints,
        currentPatrolIndex: 0,
        stuckCounter: 0
      });
    }

    return enemies;
  }

  function generatePatrolRoute(startPosition: Position, enemyIndex: number): Position[] {
    const patrolPoints: Position[] = [];

    // Define major patrol areas across the entire map
    const mapPatrolAreas = [
      // Corner areas
      { x: GRID_CONFIG.CELL_SIZE * 3, y: GRID_CONFIG.CELL_SIZE * 3 },     // Top-left
      { x: GRID_CONFIG.CELL_SIZE * 26, y: GRID_CONFIG.CELL_SIZE * 3 },    // Top-right
      { x: GRID_CONFIG.CELL_SIZE * 3, y: GRID_CONFIG.CELL_SIZE * 16 },    // Bottom-left
      { x: GRID_CONFIG.CELL_SIZE * 26, y: GRID_CONFIG.CELL_SIZE * 16 },   // Bottom-right

      // Edge areas
      { x: GRID_CONFIG.CELL_SIZE * 14.5, y: GRID_CONFIG.CELL_SIZE * 2 },  // Top center
      { x: GRID_CONFIG.CELL_SIZE * 14.5, y: GRID_CONFIG.CELL_SIZE * 17 }, // Bottom center
      { x: GRID_CONFIG.CELL_SIZE * 2, y: GRID_CONFIG.CELL_SIZE * 9.5 },   // Left center
      { x: GRID_CONFIG.CELL_SIZE * 27, y: GRID_CONFIG.CELL_SIZE * 9.5 },  // Right center

      // Inner areas
      { x: GRID_CONFIG.CELL_SIZE * 8, y: GRID_CONFIG.CELL_SIZE * 6 },     // Inner top-left
      { x: GRID_CONFIG.CELL_SIZE * 21, y: GRID_CONFIG.CELL_SIZE * 6 },    // Inner top-right
      { x: GRID_CONFIG.CELL_SIZE * 8, y: GRID_CONFIG.CELL_SIZE * 13 },    // Inner bottom-left
      { x: GRID_CONFIG.CELL_SIZE * 21, y: GRID_CONFIG.CELL_SIZE * 13 },   // Inner bottom-right

      // Central corridor areas (avoiding CSS station)
      { x: GRID_CONFIG.CELL_SIZE * 11, y: GRID_CONFIG.CELL_SIZE * 9.5 },  // Left of center
      { x: GRID_CONFIG.CELL_SIZE * 18, y: GRID_CONFIG.CELL_SIZE * 9.5 },  // Right of center
      { x: GRID_CONFIG.CELL_SIZE * 14.5, y: GRID_CONFIG.CELL_SIZE * 6 },  // Above center
      { x: GRID_CONFIG.CELL_SIZE * 14.5, y: GRID_CONFIG.CELL_SIZE * 13 }, // Below center
    ];

    // Each enemy gets a unique patrol route covering different areas of the map
    const routeConfigs = [
      // Enemy 0: Full perimeter clockwise
      [0, 1, 3, 2],
      // Enemy 1: Cross pattern
      [4, 6, 5, 7],
      // Enemy 2: Inner square clockwise
      [8, 9, 11, 10],
      // Enemy 3: Diagonal pattern
      [0, 9, 3, 8],
      // Enemy 4: Outer edges
      [4, 7, 5, 6],
      // Enemy 5: Mixed inner/outer
      [1, 10, 2, 11],
      // Enemy 6: Central corridor patrol
      [12, 13, 14, 15],
      // Enemy 7: Random comprehensive route
      [0, 8, 5, 11]
    ];

    const routeConfig = routeConfigs[enemyIndex % routeConfigs.length];

    // Create patrol points based on the route configuration
    for (const areaIndex of routeConfig) {
      const baseArea = mapPatrolAreas[areaIndex];

      // Add some randomization around each area
      const randomOffsetX = (Math.random() - 0.5) * GRID_CONFIG.CELL_SIZE * 2;
      const randomOffsetY = (Math.random() - 0.5) * GRID_CONFIG.CELL_SIZE * 2;

      let patrolX = baseArea.x + randomOffsetX;
      let patrolY = baseArea.y + randomOffsetY;

      // Keep within bounds
      patrolX = Math.max(GRID_CONFIG.CELL_SIZE * 1.5, Math.min(CARGO_CONFIG.CANVAS_WIDTH - GRID_CONFIG.CELL_SIZE * 1.5, patrolX));
      patrolY = Math.max(GRID_CONFIG.CELL_SIZE * 1.5, Math.min(CARGO_CONFIG.CANVAS_HEIGHT - GRID_CONFIG.CELL_SIZE * 1.5, patrolY));

      // Find a safe position near the target
      let safePosition = findSafePatrolPosition(patrolX, patrolY);
      patrolPoints.push(safePosition);
    }

    return patrolPoints;
  }

  function findSafePatrolPosition(targetX: number, targetY: number): Position {
    // Use enemy position validation instead of item validation for better accuracy
    if (isEnemyPositionValid(targetX, targetY)) {
      return { x: targetX, y: targetY };
    }

    // Search in expanding rings for a safe position using enemy validation
    for (let radius = 1; radius <= 8; radius++) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const testX = targetX + Math.cos(angle) * radius * GRID_CONFIG.CELL_SIZE;
        const testY = targetY + Math.sin(angle) * radius * GRID_CONFIG.CELL_SIZE;

        if (isEnemyPositionValid(testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }

    // If still no safe position found, try well-known safe areas
    const knownSafeAreas = [
      { x: GRID_CONFIG.CELL_SIZE * 7 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 7 + GRID_CONFIG.CELL_SIZE / 2 },
      { x: GRID_CONFIG.CELL_SIZE * 22 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 7 + GRID_CONFIG.CELL_SIZE / 2 },
      { x: GRID_CONFIG.CELL_SIZE * 7 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 12 + GRID_CONFIG.CELL_SIZE / 2 },
      { x: GRID_CONFIG.CELL_SIZE * 22 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 12 + GRID_CONFIG.CELL_SIZE / 2 },
    ];

    for (const safeArea of knownSafeAreas) {
      if (isEnemyPositionValid(safeArea.x, safeArea.y)) {
        return safeArea;
      }
    }

    // Last resort: return center area with some offset (avoiding CSS station)
    return { 
      x: CARGO_CONFIG.CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200,
      y: CARGO_CONFIG.CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 200
    };
  }

  function generatePathwayPositions(): Position[] {
    const positions: Position[] = [];

    // Create pathway positions on grid, avoiding walls and center area
    for (let gridX = 2; gridX < GRID_CONFIG.GRID_WIDTH - 2; gridX++) {
      for (let gridY = 2; gridY < GRID_CONFIG.GRID_HEIGHT - 2; gridY++) {
        // Skip center area (CSS station)
        const centerX = Math.floor(GRID_CONFIG.GRID_WIDTH / 2);
        const centerY = Math.floor(GRID_CONFIG.GRID_HEIGHT / 2);

        if (Math.abs(gridX - centerX) > 2 || Math.abs(gridY - centerY) > 2) {
          const testX = gridX * GRID_CONFIG.CELL_SIZE + GRID_CONFIG.CELL_SIZE / 2;
          const testY = gridY * GRID_CONFIG.CELL_SIZE + GRID_CONFIG.CELL_SIZE / 2;

          // Use the safe position validation for better item placement
          if (isPositionSafeForItem(testX, testY, 0)) {
            positions.push({ x: testX, y: testY });
          }
        }
      }
    }

    return positions;
  }

  function isWallPosition(gridX: number, gridY: number): boolean {
    // Simple L/T/I maze design - NO enclosed boxes or chambers

    // 1. BORDER WALLS
    if (gridX === 0 || gridX === GRID_CONFIG.GRID_WIDTH - 1 || 
        gridY === 0 || gridY === GRID_CONFIG.GRID_HEIGHT - 1) {
      return true;
    }

    // 2. L-SHAPED WALLS (Corner navigation)
    // Top-left L-shape
    if ((gridX === 4 && gridY >= 3 && gridY <= 5) || 
        (gridY === 3 && gridX >= 4 && gridX <= 6)) return true;

    // Top-right L-shape  
    if ((gridX === 25 && gridY >= 3 && gridY <= 5) || 
        (gridY === 3 && gridX >= 23 && gridX <= 25)) return true;

    // Bottom-left L-shape
    if ((gridX === 4 && gridY >= 14 && gridY <= 16) || 
        (gridY === 16 && gridX >= 4 && gridX <= 6)) return true;

    // Bottom-right L-shape
    if ((gridX === 25 && gridY >= 14 && gridY <= 16) || 
        (gridY === 16 && gridX >= 23 && gridX <= 25)) return true;

    // 3. T-SHAPED WALLS (Junction points)
    // Top T-shapes
    if (gridY === 6 && gridX >= 11 && gridX <= 13) return true;
    if (gridX === 12 && gridY >= 5 && gridY <= 7) return true;

    if (gridY === 6 && gridX >= 16 && gridX <= 18) return true;
    if (gridX === 17 && gridY >= 5 && gridY <= 7) return true;

    // Middle T-shapes
    if (gridY === 9 && gridX >= 8 && gridX <= 10) return true;
    if (gridX === 9 && gridY >= 8 && gridY <= 10) return true;

    if (gridY === 9 && gridX >= 19 && gridX <= 21) return true;
    if (gridX === 20 && gridY >= 8 && gridY <= 10) return true;

    // Bottom T-shapes
    if (gridY === 12 && gridX >= 11 && gridX <= 13) return true;
    if (gridX === 12 && gridY >= 11 && gridY <= 13) return true;

    if (gridY === 12 && gridX >= 16 && gridX <= 18) return true;
    if (gridX === 17 && gridY >= 11 && gridY <= 13) return true;

    // 4. I-SHAPED WALLS (Straight obstacles)
    // Horizontal I-shapes
    if (gridY === 2 && gridX >= 9 && gridX <= 11) return true;
    if (gridY === 2 && gridX >= 18 && gridX <= 20) return true;

    if (gridY === 8 && gridX >= 2 && gridX <= 4) return true;
    if (gridY === 8 && gridX >= 25 && gridX <= 27) return true;

    if (gridY === 11 && gridX >= 2 && gridX <= 4) return true;
    if (gridY === 11 && gridX >= 25 && gridX <= 27) return true;

    if (gridY === 17 && gridX >= 9 && gridX <= 11) return true;
    if (gridY === 17 && gridX >= 18 && gridX <= 20) return true;

    // Vertical I-shapes
    if (gridX === 7 && gridY >= 4 && gridY <= 6) return true;
    if (gridX === 7 && gridY >= 13 && gridY <= 15) return true;

    if (gridX === 22 && gridY >= 4 && gridY <= 6) return true;
    if (gridX === 22 && gridY >= 13 && gridY <= 15) return true;

    if (gridX === 14 && gridY >= 2 && gridY <= 4) return true;
    if (gridX === 15 && gridY >= 15 && gridY <= 17) return true;

    return false;
  }

  function isPositionSafeForItem(x: number, y: number, bufferRadius: number = 1): boolean {
    // Convert pixel position to grid coordinates
    const gridX = Math.floor(x / GRID_CONFIG.CELL_SIZE);
    const gridY = Math.floor(y / GRID_CONFIG.CELL_SIZE);

    // Check the position itself and surrounding buffer area
    for (let offsetX = -bufferRadius; offsetX <= bufferRadius; offsetX++) {
      for (let offsetY = -bufferRadius; offsetY <= bufferRadius; offsetY++) {
        const checkX = gridX + offsetX;
        const checkY = gridY + offsetY;

        // Skip if outside grid bounds
        if (checkX < 0 || checkX >= GRID_CONFIG.GRID_WIDTH || 
            checkY < 0 || checkY >= GRID_CONFIG.GRID_HEIGHT) {
          continue;
        }

        // For the center position (item location), it must not be a wall
        if (offsetX === 0 && offsetY === 0) {
          if (isWallPosition(checkX, checkY)) {
            return false;
          }
        }

        // For buffer area, ensure there's adequate space (at least some non-wall positions)
        if (Math.abs(offsetX) <= 1 && Math.abs(offsetY) <= 1) {
          if (isWallPosition(checkX, checkY)) {
            // If there are walls immediately adjacent, that's still okay for collection
            continue;
          }
        }
      }
    }

    return true;
  }

  const startGame = useCallback(() => {
    const newGameState = createInitialGameState();
    setGameState({
      ...newGameState,
      gameStatus: 'playing',
      levelStartTime: Date.now()
    });
    onGameStateChange?.(true);
  }, [onGameStateChange]);

  // Get rotation angle for direction (assuming sprite faces up by default)
  const getRotationForDirection = (direction: Direction): number => {
    switch (direction) {
      case 'up': return 0;      // Ship naturally points up
      case 'down': return 180;  // Rotate 180° to point down
      case 'left': return -90;  // Rotate -90° to point left
      case 'right': return 90;  // Rotate 90° to point right
      default: return 0;
    }
  };

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    onGameStateChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onGameStateChange]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'paused' ? 'playing' : 'paused'
    }));
  }, []);

  // Game loop
  const updateGame = useCallback((deltaTime: number) => {
    if (gameState.gameStatus !== 'playing') return;

    setGameState(prev => {
      const newState = { ...prev };
      newState.gameTime += deltaTime;

      // Update countdown timer
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - newState.levelStartTime) / 1000);
      newState.timeRemaining = Math.max(0, newState.gameDuration - elapsedSeconds);

      // Check if time is up
      if (newState.timeRemaining <= 0) {
        newState.gameStatus = 'timeUp';
        onGameStateChange?.(false);

        if (onGameEnd) {
          // Calculate final score with time bonus
          const baseScore = newState.deliveredItems * CARGO_CONFIG.POINTS_PER_DELIVERY;
          const timeBonus = 0; // No time bonus when time runs out
          const finalScore = baseScore + timeBonus;

          // Calculate item breakdown
          const itemBreakdown: Record<CargoItemType, number> = {} as Record<CargoItemType, number>;
          let heavyItemsCollected = 0;
          let lightItemsCollected = 0;
          let totalWeight = 0;

          // Initialize all item types to 0
          Object.keys(CARGO_CONFIG.ITEM_DEFINITIONS).forEach(itemType => {
            itemBreakdown[itemType as CargoItemType] = 0;
          });

          // Count delivered items
          newState.cssStation.deliveredItems.forEach(item => {
            itemBreakdown[item.type]++;
            totalWeight += item.weight;
            if (item.weight === 3) {
              heavyItemsCollected++;
            } else {
              lightItemsCollected++;
            }
          });

          const result: CargoGameResult = {
            score: finalScore,
            timeElapsed: newState.gameDuration,
            itemsCollected: newState.collectedItems,
            totalItems: newState.totalItems,
            deliveryCount: newState.player.deliveryCount,
            perfectDelivery: newState.deliveredItems === newState.totalItems,
            efficiency: newState.collectedItems > 0 ? newState.deliveredItems / newState.collectedItems : 0,
            heavyItemsCollected,
            lightItemsCollected,
            totalWeight,
            itemBreakdown
          };
          onGameEnd(result);
        }
        return newState;
      }

      // Update player
      updatePlayer(newState, deltaTime);

      // Update CSS station animation
      newState.cssStation.animationPhase += deltaTime * 0.002;

      // Update item animations
      newState.availableItems.forEach(item => {
        if (!item.collected) {
          item.animationPhase += deltaTime * 0.003;
        }
      });

      // Update enemies
      updateEnemies(newState, deltaTime);

      // Update particles
      updateParticles(newState, deltaTime);

      // Check item pickups
      checkItemPickups(newState);

      // Check enemy collisions
      checkEnemyCollisions(newState, onGameStateChange);

      // Check CSS delivery
      checkCSSDelivery(newState);

      // Check win condition (all items delivered)
      if (newState.deliveredItems >= newState.totalItems) {
        newState.gameStatus = 'levelComplete';
        onGameStateChange?.(false);

        if (onGameEnd) {
          // Calculate final score with time bonus
          const baseScore = newState.deliveredItems * CARGO_CONFIG.POINTS_PER_DELIVERY;
          const timeBonus = newState.timeRemaining * CARGO_CONFIG.TIME_BONUS_MULTIPLIER;
          const finalScore = baseScore + timeBonus;

          // Calculate item breakdown
          const itemBreakdown: Record<CargoItemType, number> = {} as Record<CargoItemType, number>;
          let heavyItemsCollected = 0;
          let lightItemsCollected = 0;
          let totalWeight = 0;

          // Initialize all item types to 0
          Object.keys(CARGO_CONFIG.ITEM_DEFINITIONS).forEach(itemType => {
            itemBreakdown[itemType as CargoItemType] = 0;
          });

          // Count delivered items
          newState.cssStation.deliveredItems.forEach(item => {
            itemBreakdown[item.type]++;
            totalWeight += item.weight;
            if (item.weight === 3) {
              heavyItemsCollected++;
            } else {
              lightItemsCollected++;
            }
          });

          const result: CargoGameResult = {
            score: finalScore,
            timeElapsed: Math.floor((Date.now() - newState.levelStartTime) / 1000),
            itemsCollected: newState.collectedItems,
            totalItems: newState.totalItems,
            deliveryCount: newState.player.deliveryCount,
            perfectDelivery: newState.deliveredItems === newState.totalItems,
            efficiency: newState.collectedItems > 0 ? newState.deliveredItems / newState.collectedItems : 0,
            heavyItemsCollected,
            lightItemsCollected,
            totalWeight,
            itemBreakdown
          };
          onGameEnd(result);
        }
      }

      return newState;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameStatus, onGameEnd, onGameStateChange]);

  function updatePlayer(state: CargoGameState, deltaTime: number) {
    const player = state.player;

    // Handle input and movement
    const speed = player.speed * (deltaTime / 1000);
    let newX = player.position.x;
    let newY = player.position.y;
    let moved = false;

    if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) {
      player.direction = 'up';
      player.rotation = getRotationForDirection('up');
      newY -= speed;
      moved = true;
    } else if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) {
      player.direction = 'down';
      player.rotation = getRotationForDirection('down');
      newY += speed;
      moved = true;
    } else if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
      player.direction = 'left';
      player.rotation = getRotationForDirection('left');
      newX -= speed;
      moved = true;
    } else if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
      player.direction = 'right';
      player.rotation = getRotationForDirection('right');
      newX += speed;
      moved = true;
    }

    // Keep player within bounds
    newX = Math.max(25, Math.min(CARGO_CONFIG.CANVAS_WIDTH - 25, newX));
    newY = Math.max(25, Math.min(CARGO_CONFIG.CANVAS_HEIGHT - 25, newY));

    // Check collision with maze walls
    if (!isPositionBlocked(newX, newY)) {
      player.position.x = newX;
      player.position.y = newY;
      player.isMoving = moved;
    } else {
      // If blocked, don't move but allow rotation
      player.isMoving = false;
    }
  }

  function isPositionBlocked(x: number, y: number): boolean {
    const playerRadius = 18;

    // Convert player position to grid coordinates
    const playerGridX = Math.floor(x / GRID_CONFIG.CELL_SIZE);
    const playerGridY = Math.floor(y / GRID_CONFIG.CELL_SIZE);

    // Check all grid cells that the player might overlap
    const checkRadius = Math.ceil(playerRadius / GRID_CONFIG.CELL_SIZE);

    for (let offsetX = -checkRadius; offsetX <= checkRadius; offsetX++) {
      for (let offsetY = -checkRadius; offsetY <= checkRadius; offsetY++) {
        const gridX = playerGridX + offsetX;
        const gridY = playerGridY + offsetY;

        // Skip if outside grid bounds
        if (gridX < 0 || gridX >= GRID_CONFIG.GRID_WIDTH || 
            gridY < 0 || gridY >= GRID_CONFIG.GRID_HEIGHT) {
          continue;
        }

        // Skip center area (CSS station)
        const centerX = Math.floor(GRID_CONFIG.GRID_WIDTH / 2);
        const centerY = Math.floor(GRID_CONFIG.GRID_HEIGHT / 2);
        const distanceFromCenter = Math.abs(gridX - centerX) + Math.abs(gridY - centerY);

        if (distanceFromCenter <= 3) {
          continue; // Allow movement in CSS area
        }

        // Check if this grid position is a wall
        if (isWallPosition(gridX, gridY)) {
          const wallX = gridX * GRID_CONFIG.CELL_SIZE;
          const wallY = gridY * GRID_CONFIG.CELL_SIZE;

          // Check if player circle intersects with wall rectangle
          const wallLeft = wallX;
          const wallRight = wallX + GRID_CONFIG.WALL_SIZE;
          const wallTop = wallY;
          const wallBottom = wallY + GRID_CONFIG.WALL_SIZE;

          // Distance from player center to wall rectangle
          const closestX = Math.max(wallLeft, Math.min(x, wallRight));
          const closestY = Math.max(wallTop, Math.min(y, wallBottom));

          const distance = Math.sqrt(
            Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2)
          );

          if (distance < playerRadius) {
            return true; // Position is blocked
          }
        }
      }
    }

    return false; // Position is clear
  }

  function updateEnemies(state: CargoGameState, deltaTime: number) {
    const currentTime = Date.now();
    const playerPosition = state.player.position;

    state.enemies.forEach(enemy => {
      if (!enemy.active) return;

      // Update animation phase
      enemy.animationPhase += deltaTime * 0.004;

      // Calculate distance to player
      const distanceToPlayer = Math.sqrt(
        Math.pow(playerPosition.x - enemy.position.x, 2) +
        Math.pow(playerPosition.y - enemy.position.y, 2)
      );

      // Check if player is within detection radius
      const wasChasing = enemy.isChasing;
      enemy.isChasing = distanceToPlayer <= enemy.detectionRadius;

      // Once started chasing, continue until player is much farther away
      if (wasChasing && distanceToPlayer <= enemy.detectionRadius * 1.5) {
        enemy.isChasing = true;
      }

      if (enemy.isChasing) {
        // Continuously update target position for better following
        enemy.targetPosition = { ...playerPosition };

        // Consistent movement timing for both chasing and patrolling
        const moveInterval = 25; // Balanced movement speed
        if (currentTime - enemy.lastMoveTime > moveInterval) {
          moveEnemyTowardsTarget(enemy, state);
          enemy.lastMoveTime = currentTime;
        }
      } else {
        // Improved patrolling behavior using patrol points
        const currentTarget = enemy.patrolPoints[enemy.currentPatrolIndex];

        if (!enemy.targetPosition) {
          enemy.targetPosition = currentTarget;
        }

        // Check if reached current patrol point
        const distanceToTarget = Math.sqrt(
          Math.pow(enemy.position.x - currentTarget.x, 2) + 
          Math.pow(enemy.position.y - currentTarget.y, 2)
        );

        if (distanceToTarget < 35) {
          // Move to next patrol point
          enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length;
          const nextTarget = enemy.patrolPoints[enemy.currentPatrolIndex];

          // Validate next patrol point is reachable
          if (isEnemyPositionValid(nextTarget.x, nextTarget.y)) {
            enemy.targetPosition = nextTarget;
          } else {
            // Find alternative safe patrol point
            enemy.targetPosition = findSafePatrolPosition(nextTarget.x, nextTarget.y);
            console.log(`Enemy ${enemy.id} patrol point adjusted for safety`);
          }
        }

        // Use same movement interval as chasing for consistency
        const moveInterval = 25; 
        if (currentTime - enemy.lastMoveTime > moveInterval) {
          moveEnemyTowardsTarget(enemy, state);
          enemy.lastMoveTime = currentTime;
        }
      }
    });
  }

  function moveEnemyTowardsTarget(enemy: CargoEnemy, state: CargoGameState) {
    if (!enemy.targetPosition) return;

    const currentX = enemy.position.x;
    const currentY = enemy.position.y;
    const targetX = enemy.targetPosition.x;
    const targetY = enemy.targetPosition.y;

    const deltaX = targetX - currentX;
    const deltaY = targetY - currentY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < 5) return; // Don't move if very close

    // Smooth movement towards target (not grid-based)
    const moveDistance = Math.min(enemy.speed / 60, distance); // Speed per frame at 60fps
    const moveX = (deltaX / distance) * moveDistance;
    const moveY = (deltaY / distance) * moveDistance;

    const newX = currentX + moveX;
    const newY = currentY + moveY;

    // Update direction based on movement
    if (Math.abs(moveX) > Math.abs(moveY)) {
      enemy.direction = moveX > 0 ? 'right' : 'left';
    } else {
      enemy.direction = moveY > 0 ? 'down' : 'up';
    }

    // Check if new position is valid (not intersecting walls)
    if (isEnemyPositionValid(newX, newY)) {
      enemy.position.x = newX;
      enemy.position.y = newY;

      // Reset stuck counter if movement succeeded
      enemy.stuckCounter = 0;
    } else {
      // Enhanced wall sliding behavior with more alternatives
      const alternativeMoves = [
        { x: currentX + moveX, y: currentY }, // Horizontal only
        { x: currentX, y: currentY + moveY }, // Vertical only
        { x: currentX + moveY, y: currentY + moveX }, // Perpendicular 1
        { x: currentX - moveY, y: currentY + moveX }, // Perpendicular 2
        { x: currentX + moveX * 0.5, y: currentY }, // Half horizontal
        { x: currentX, y: currentY + moveY * 0.5 }, // Half vertical
        { x: currentX + moveX * 0.5, y: currentY + moveY * 0.5 }, // Half diagonal
        { x: currentX - moveX * 0.3, y: currentY - moveY * 0.3 }, // Slight retreat
      ];

      let moved = false;
      for (const altMove of alternativeMoves) {
        if (altMove.x >= 0 && altMove.x < CARGO_CONFIG.CANVAS_WIDTH &&
            altMove.y >= 0 && altMove.y < CARGO_CONFIG.CANVAS_HEIGHT &&
            isEnemyPositionValid(altMove.x, altMove.y)) {
          enemy.position.x = altMove.x;
          enemy.position.y = altMove.y;
          enemy.stuckCounter = 0;
          moved = true;
          break;
        }
      }

      // If still can't move, increment stuck counter
      if (!moved) {
        enemy.stuckCounter = (enemy.stuckCounter || 0) + 1;

        // If stuck for too long, try to unstuck
        if (enemy.stuckCounter > 30) {
          unstuckEnemy(enemy, state);
        }
      }
    }
  }

  function isEnemyPositionValid(x: number, y: number): boolean {
    // Check if enemy position would intersect with walls
    const enemyRadius = CARGO_CONFIG.ENEMY_SIZE / 2;
    const bufferZone = 2; // Add buffer to prevent getting too close to walls
    const effectiveRadius = enemyRadius + bufferZone;

    // Ensure enemy stays within canvas bounds with buffer
    if (x < effectiveRadius || x > CARGO_CONFIG.CANVAS_WIDTH - effectiveRadius ||
        y < effectiveRadius || y > CARGO_CONFIG.CANVAS_HEIGHT - effectiveRadius) {
      return false;
    }

    const gridX = Math.floor(x / GRID_CONFIG.CELL_SIZE);
    const gridY = Math.floor(y / GRID_CONFIG.CELL_SIZE);

    // Check larger area around enemy for walls (2 cell radius)
    const checkRadius = Math.ceil(effectiveRadius / GRID_CONFIG.CELL_SIZE) + 1;

    for (let offsetX = -checkRadius; offsetX <= checkRadius; offsetX++) {
      for (let offsetY = -checkRadius; offsetY <= checkRadius; offsetY++) {
        const checkX = gridX + offsetX;
        const checkY = gridY + offsetY;

        if (checkX >= 0 && checkX < GRID_CONFIG.GRID_WIDTH &&
            checkY >= 0 && checkY < GRID_CONFIG.GRID_HEIGHT &&
            isWallPosition(checkX, checkY)) {

          // Check if enemy circle intersects with this wall block
          const wallLeft = checkX * GRID_CONFIG.CELL_SIZE;
          const wallRight = wallLeft + GRID_CONFIG.WALL_SIZE;
          const wallTop = checkY * GRID_CONFIG.CELL_SIZE;
          const wallBottom = wallTop + GRID_CONFIG.WALL_SIZE;

          // Distance from enemy center to wall rectangle
          const closestX = Math.max(wallLeft, Math.min(x, wallRight));
          const closestY = Math.max(wallTop, Math.min(y, wallBottom));

          const distanceToWall = Math.sqrt(
            Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2)
          );

          if (distanceToWall < effectiveRadius) {
            return false; // Position is blocked by wall
          }
        }
      }
    }

    return true; // Position is valid
  }

  function unstuckEnemy(enemy: CargoEnemy, state: CargoGameState) {
    console.log(`Enemy ${enemy.id} is stuck, attempting to unstuck...`);

    // Try to find a safe position in expanding spiral
    const currentX = enemy.position.x;
    const currentY = enemy.position.y;

    for (let radius = 40; radius <= 200; radius += 20) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const testX = currentX + Math.cos(angle) * radius;
        const testY = currentY + Math.sin(angle) * radius;

        if (isEnemyPositionValid(testX, testY)) {
          enemy.position.x = testX;
          enemy.position.y = testY;
          enemy.stuckCounter = 0;

          // Find new patrol route from this position
          const enemyIndex = state.enemies.findIndex(e => e.id === enemy.id);
          if (enemyIndex !== -1) {
            enemy.patrolPoints = generatePatrolRoute(enemy.position, enemyIndex);
            enemy.currentPatrolIndex = 0;
            enemy.targetPosition = enemy.patrolPoints[0];
          }

          console.log(`Enemy ${enemy.id} unstuck and moved to (${Math.floor(testX/40)}, ${Math.floor(testY/40)})`);
          return;
        }
      }
    }

    // If still can't find position, teleport to a safe spawn area
    const safeSpawnAreas = [
      { x: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2 },
      { x: GRID_CONFIG.CELL_SIZE * 24 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2 },
      { x: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 14 + GRID_CONFIG.CELL_SIZE / 2 },
      { x: GRID_CONFIG.CELL_SIZE * 24 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 14 + GRID_CONFIG.CELL_SIZE / 2 }
    ];

    for (const spawnArea of safeSpawnAreas) {
      if (isEnemyPositionValid(spawnArea.x, spawnArea.y)) {
        enemy.position.x = spawnArea.x;
        enemy.position.y = spawnArea.y;
        enemy.stuckCounter = 0;

        // Regenerate patrol route
        const enemyIndex = state.enemies.findIndex(e => e.id === enemy.id);
        if (enemyIndex !== -1) {
          enemy.patrolPoints = generatePatrolRoute(enemy.position, enemyIndex);
          enemy.currentPatrolIndex = 0;
          enemy.targetPosition = enemy.patrolPoints[0];
        }

        console.log(`Enemy ${enemy.id} emergency teleported to safe spawn area`);
        return;
      }
    }
  }


  function respawnEnemies(state: CargoGameState) {
    // Only respawn if there are killed enemies
    if (state.killedEnemies === 0) return;

    const currentTime = Date.now();
    let respawnedCount = 0;

    // Define strategic enemy spawn positions (same as initial spawn)
    const enemySpawnPositions = [
      { x: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2 },   // Top-left area
      { x: GRID_CONFIG.CELL_SIZE * 24 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2 }, // Top-right area
      { x: GRID_CONFIG.CELL_SIZE * 5 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 14 + GRID_CONFIG.CELL_SIZE / 2 }, // Bottom-left area
      { x: GRID_CONFIG.CELL_SIZE * 24 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 14 + GRID_CONFIG.CELL_SIZE / 2 }, // Bottom-right area
      { x: GRID_CONFIG.CELL_SIZE * 2 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 9 + GRID_CONFIG.CELL_SIZE / 2 },   // Left middle
      { x: GRID_CONFIG.CELL_SIZE * 27 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 9 + GRID_CONFIG.CELL_SIZE / 2 }, // Right middle
      { x: GRID_CONFIG.CELL_SIZE * 10 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 2 + GRID_CONFIG.CELL_SIZE / 2 }, // Top middle
      { x: GRID_CONFIG.CELL_SIZE * 19 + GRID_CONFIG.CELL_SIZE / 2, y: GRID_CONFIG.CELL_SIZE * 17 + GRID_CONFIG.CELL_SIZE / 2 } // Bottom middle
    ];

    // Reactivate killed enemies
    state.enemies.forEach((enemy, index) => {
      if (!enemy.active && respawnedCount < state.killedEnemies) {
        // Determine spawn position (cycle through available positions)
        let spawnPosition = enemySpawnPositions[index % enemySpawnPositions.length];

        // Validate spawn position is safe (not on walls or too close to player)
        const playerDistance = Math.sqrt(
          Math.pow(state.player.position.x - spawnPosition.x, 2) +
          Math.pow(state.player.position.y - spawnPosition.y, 2)
        );

        // If too close to player or unsafe, find alternative position
        if (playerDistance < 100 || !isEnemyPositionValid(spawnPosition.x, spawnPosition.y)) {
          // Find alternative safe spawn position using enemy validation
          let found = false;
          for (let radius = 1; radius <= 8 && !found; radius++) {
            for (let offsetX = -radius; offsetX <= radius && !found; offsetX++) {
              for (let offsetY = -radius; offsetY <= radius && !found; offsetY++) {
                const testX = spawnPosition.x + (offsetX * GRID_CONFIG.CELL_SIZE);
                const testY = spawnPosition.y + (offsetY * GRID_CONFIG.CELL_SIZE);

                const testPlayerDistance = Math.sqrt(
                  Math.pow(state.player.position.x - testX, 2) +
                  Math.pow(state.player.position.y - testY, 2)
                );

                if (testPlayerDistance >= 100 && isEnemyPositionValid(testX, testY)) {
                  spawnPosition = { x: testX, y: testY };
                  found = true;
                }
              }
            }
          }
        }

        // Respawn the enemy
        enemy.active = true;
        enemy.position = spawnPosition;
        enemy.direction = 'up';
        enemy.isChasing = false;
        enemy.targetPosition = undefined;
        enemy.animationPhase = Math.random() * Math.PI * 2;
        enemy.lastMoveTime = currentTime;
        enemy.patrolPoints = generatePatrolRoute(spawnPosition, index);
        enemy.currentPatrolIndex = 0;
        enemy.stuckCounter = 0;

        respawnedCount++;

        // Create respawn particles
        createRespawnParticles(state, spawnPosition);
      }
    });

    // Reset killed enemies counter
    state.killedEnemies = 0;

    // Play respawn sound if any enemies were respawned
    if (respawnedCount > 0) {
      respawnSoundRef.current?.play();
    }

    console.log(`Respawned ${respawnedCount} enemies after cargo delivery`);
  }

  function createRespawnParticles(state: CargoGameState, position: Position) {
    for (let i = 0; i < 12; i++) {
      state.particles.push({
        id: `respawn_particle_${Date.now()}_${i}`,
        position: { ...position },
        velocity: {
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200
        },
        life: 1000,
        maxLife: 1000,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 30}, 100%, ${Math.random() * 30 + 50}%)`, // Red/orange particles
        alpha: 1
      });
    }
  }

  function checkEnemyCollisions(state: CargoGameState, onGameStateChange?: (isPlaying: boolean) => void) {
    const playerPosition = state.player.position;
    const playerRadius = 20;
    const isCargoFull = state.player.cargo.totalWeight >= CARGO_CONFIG.MAX_CARGO_WEIGHT;

    state.enemies.forEach(enemy => {
      if (!enemy.active) return;

      const distance = Math.sqrt(
        Math.pow(playerPosition.x - enemy.position.x, 2) +
        Math.pow(playerPosition.y - enemy.position.y, 2)
      );

      const collisionDistance = playerRadius + (CARGO_CONFIG.ENEMY_SIZE / 2);

      if (distance < collisionDistance) {
        // Enemy kills player
        state.gameStatus = 'gameOver';
        onGameStateChange?.(false);
        console.log('Game Over! Enemy caught the player');
      }
    });
  }

  function createEnemyDeathParticles(state: CargoGameState, position: Position) {
    for (let i = 0; i < 15; i++) {
      state.particles.push({
        id: `enemy_death_particle_${Date.now()}_${i}`,
        position: { ...position },
        velocity: {
          x: (Math.random() - 0.5) * 250,
          y: (Math.random() - 0.5) * 250
        },
        life: 1000,
        maxLife: 1000,
        size: Math.random() * 5 + 3,
        color: `hsl(${Math.random() * 30}, 100%, ${Math.random() * 30 + 50}%)`,
        alpha: 1
      });
    }
  }

  function updateParticles(state: CargoGameState, deltaTime: number) {
    state.particles = state.particles.filter(particle => {
      particle.life -= deltaTime;
      particle.position.x += particle.velocity.x * (deltaTime / 1000);
      particle.position.y += particle.velocity.y * (deltaTime / 1000);
      particle.alpha = particle.life / particle.maxLife;
      return particle.life > 0;
    });
  }

  function checkItemPickups(state: CargoGameState) {
    const player = state.player;

    state.availableItems.forEach(item => {
      if (item.collected) return;

      const distance = Math.sqrt(
        Math.pow(player.position.x - item.position.x, 2) +
        Math.pow(player.position.y - item.position.y, 2)
      );

      if (distance < CARGO_CONFIG.PICKUP_RADIUS) {
        // Check if player can carry this item
        const potentialWeight = player.cargo.totalWeight + item.weight;

        if (potentialWeight <= player.cargo.maxCapacity) {
          // Pick up the item
          item.collected = true;
          state.collectedItems++;

          // Add to cargo
          player.cargo.items.push({...item});
          player.cargo.totalWeight += item.weight;

          collectSoundRef.current?.play();
          createPickupParticles(state, item.position);

          console.log(`Picked up ${item.type} (weight: ${item.weight}). Cargo: ${player.cargo.totalWeight}/${player.cargo.maxCapacity}`);
        } else {
          console.log(`Cannot pick up ${item.type} - cargo full! Current: ${player.cargo.totalWeight}/${player.cargo.maxCapacity}, needed: ${potentialWeight}`);
        }
      }
    });
  }

  function checkCSSDelivery(state: CargoGameState) {
    const player = state.player;
    const cssStation = state.cssStation;

    const distance = Math.sqrt(
      Math.pow(player.position.x - cssStation.position.x, 2) +
      Math.pow(player.position.y - cssStation.position.y, 2)
    );

    if (distance < cssStation.radius && player.cargo.items.length > 0) {
      // Deliver all cargo items
      const deliveredItems = [...player.cargo.items];
      const totalPoints = deliveredItems.length * CARGO_CONFIG.POINTS_PER_DELIVERY; // 100 points per item

      // Add to delivered items
      cssStation.deliveredItems.push(...deliveredItems);
      cssStation.totalDeliveries++;

      // Update player stats
      player.score += totalPoints;
      player.deliveryCount++;
      state.score += totalPoints;
      state.deliveredItems += deliveredItems.length;

      // Clear cargo
      player.cargo.items = [];
      player.cargo.totalWeight = 0;

      deliverySoundRef.current?.play();
      createDeliveryParticles(state, cssStation.position);

      // Respawn enemies after cargo delivery
      respawnEnemies(state);

      console.log(`Delivered ${deliveredItems.length} items for ${totalPoints} points (${CARGO_CONFIG.POINTS_PER_DELIVERY} per item). Total delivered: ${state.deliveredItems}/${state.totalItems}`);
    }
  }

  function createPickupParticles(state: CargoGameState, position: Position) {
    for (let i = 0; i < 6; i++) {
      state.particles.push({
        id: `pickup_particle_${Date.now()}_${i}`,
        position: { ...position },
        velocity: {
          x: (Math.random() - 0.5) * 150,
          y: (Math.random() - 0.5) * 150
        },
        life: 800,
        maxLife: 800,
        size: Math.random() * 3 + 2,
        color: `hsl(${Math.random() * 60 + 60}, 70%, 60%)`,
        alpha: 1
      });
    }
  }

  function createDeliveryParticles(state: CargoGameState, position: Position) {
    for (let i = 0; i < 12; i++) {
      state.particles.push({
        id: `delivery_particle_${Date.now()}_${i}`,
        position: { ...position },
        velocity: {
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200
        },
        life: 1200,
        maxLife: 1200,
        size: Math.random() * 4 + 3,
        color: `hsl(${Math.random() * 60 + 180}, 80%, 70%)`,
        alpha: 1
      });
    }
  }

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !images) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with space background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CARGO_CONFIG.CANVAS_WIDTH, CARGO_CONFIG.CANVAS_HEIGHT);

    // Draw stars background
    drawStarField(ctx);

    // Draw maze pathways
    drawMazePathways(ctx);

    // Draw CSS station
    drawCSSStation(ctx);

    // Draw available cargo items
    drawCargoItems(ctx);

    // Draw enemies
    drawEnemies(ctx);

    // Draw player
    drawPlayer(ctx);

    // Draw particles
    drawParticles(ctx);

    // Draw UI
    drawUI(ctx);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, gameState]);

  function drawStarField(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#ffffff';
    // Simple star field
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % CARGO_CONFIG.CANVAS_WIDTH;
      const y = (i * 73) % CARGO_CONFIG.CANVAS_HEIGHT;
      const size = (i % 3) + 1;
      ctx.fillRect(x, y, size, size);
    }
  }

  function drawMazePathways(ctx: CanvasRenderingContext2D) {
    const time = Date.now() * 0.001;

    ctx.save();

    // Draw grid-based maze walls
    for (let gridX = 0; gridX < GRID_CONFIG.GRID_WIDTH; gridX++) {
      for (let gridY = 0; gridY < GRID_CONFIG.GRID_HEIGHT; gridY++) {
        const x = gridX * GRID_CONFIG.CELL_SIZE;
        const y = gridY * GRID_CONFIG.CELL_SIZE;

        // Skip center area (CSS station)
        const centerX = Math.floor(GRID_CONFIG.GRID_WIDTH / 2);
        const centerY = Math.floor(GRID_CONFIG.GRID_HEIGHT / 2);
        const distanceFromCenter = Math.abs(gridX - centerX) + Math.abs(gridY - centerY);

        if (distanceFromCenter > 3) {
          if (isWallPosition(gridX, gridY)) {
            // Draw wall block
            ctx.fillStyle = '#440000';
            ctx.fillRect(x, y, GRID_CONFIG.WALL_SIZE, GRID_CONFIG.WALL_SIZE);

            // Add red fire-like edges with flickering
            const flicker = Math.sin(time * 3 + gridX * 0.5 + gridY * 0.5) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(255, ${Math.floor(80 * flicker)}, 0, ${flicker})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, GRID_CONFIG.WALL_SIZE, GRID_CONFIG.WALL_SIZE);

            // Add inner fire glow
            ctx.strokeStyle = `rgba(255, ${Math.floor(180 * flicker)}, 20, ${flicker * 0.6})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, GRID_CONFIG.WALL_SIZE - 4, GRID_CONFIG.WALL_SIZE - 4);

            // Add corner highlights
            if (flicker > 0.8) {
              ctx.fillStyle = `rgba(255, 200, 0, ${(flicker - 0.8) * 2})`;
              ctx.fillRect(x + 4, y + 4, 4, 4);
              ctx.fillRect(x + GRID_CONFIG.WALL_SIZE - 8, y + 4, 4, 4);
              ctx.fillRect(x + 4, y + GRID_CONFIG.WALL_SIZE - 8, 4, 4);
              ctx.fillRect(x + GRID_CONFIG.WALL_SIZE - 8, y + GRID_CONFIG.WALL_SIZE - 8, 4, 4);
            }
          }
        }
      }
    }

    ctx.restore();
  }


  function drawCSSStation(ctx: CanvasRenderingContext2D) {
    const station = gameState.cssStation;
    const image = images!.cssStation;
    const size = station.radius * 2;
    const pulse = Math.sin(station.animationPhase) * 0.05 + 1;
    const rotation = station.animationPhase * 0.1;

    ctx.save();
    ctx.translate(station.position.x, station.position.y);
    ctx.scale(pulse, pulse);
    ctx.rotate(rotation);

    // Draw planetary station with enhanced glow
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 30;

    ctx.drawImage(image, -size / 2, -size / 2, size, size);

    // Draw orbital ring effect
    ctx.restore();
    ctx.save();
    ctx.translate(station.position.x, station.position.y);

    // Outer delivery zone indicator
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, station.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner orbital ring
    ctx.strokeStyle = '#88ccff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, station.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // CSS label with better styling
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText('CSS', station.position.x, station.position.y - station.radius - 15);
    ctx.fillText('CSS', station.position.x, station.position.y - station.radius - 15);
  }

  function drawCargoItems(ctx: CanvasRenderingContext2D) {
    gameState.availableItems.forEach(item => {
      if (item.collected) return;

      const image = images!.cargoItems[item.type];
      const size = 32;
      const oscillation = Math.sin(item.animationPhase) * 3;
      const heavyItem = item.weight === 3;

      ctx.save();
      ctx.globalAlpha = 0.9;

      // Heavy items have special glow
      if (heavyItem) {
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15;
      }

      ctx.drawImage(
        image,
        item.position.x - size / 2,
        item.position.y - size / 2 + oscillation,
        size,
        size
      );

      // Weight indicator
      ctx.restore();
      ctx.fillStyle = heavyItem ? '#ff6600' : '#66ff66';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${item.weight}kg`,
        item.position.x,
        item.position.y + size / 2 + 15
      );
    });
  }

  function drawEnemies(ctx: CanvasRenderingContext2D) {
    gameState.enemies.forEach(enemy => {
      if (!enemy.active) return;

      const size = CARGO_CONFIG.ENEMY_SIZE;
      const centerX = enemy.position.x;
      const centerY = enemy.position.y;
      const enemyImage = images!.enemy;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Animation effects
      const time = enemy.animationPhase;
      const pulseSize = Math.sin(time * 2) * 0.1 + 1;
      const rotation = time * 0.5; // Slow rotation for swirling effect

      ctx.scale(pulseSize, pulseSize);
      ctx.rotate(rotation);

      // Active state - normal red swirling energy with pulsing opacity
      ctx.globalAlpha = 0.8 + Math.sin(time * 3) * 0.2;

      // Draw the enemy image with red glow
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.drawImage(enemyImage, -size/2, -size/2, size, size);

      // Reset shadow for detection radius
      ctx.shadowBlur = 0;

      // Add detection radius indicator when chasing
      if (enemy.isChasing) {
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, enemy.detectionRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  }

  function drawPlayer(ctx: CanvasRenderingContext2D) {
    const player = gameState.player;
    const image = images!.player;
    const size = 40;

    ctx.save();

    // Translate to player position
    ctx.translate(player.position.x, player.position.y);

    // Apply rotation
    ctx.rotate((player.rotation * Math.PI) / 180);

    // Cargo overload effect
    if (player.cargo.totalWeight >= player.cargo.maxCapacity) {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
    }

    // Draw the rotated ship centered at origin
    ctx.drawImage(
      image,
      -size / 2,
      -size / 2,
      size,
      size
    );
    ctx.restore();
  }

  function drawParticles(ctx: CanvasRenderingContext2D) {
    gameState.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawUI(ctx: CanvasRenderingContext2D) {
    // Draw countdown timer
    if (gameState.gameStatus === 'playing') {
      ctx.save();

      // Format time as MM:SS
      const minutes = Math.floor(gameState.timeRemaining / 60);
      const seconds = gameState.timeRemaining % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Timer background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(CARGO_CONFIG.CANVAS_WIDTH - 120, 10, 110, 40);
      ctx.strokeStyle = gameState.timeRemaining <= 30 ? '#ff0000' : '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(CARGO_CONFIG.CANVAS_WIDTH - 120, 10, 110, 40);

      // Timer text
      ctx.fillStyle = gameState.timeRemaining <= 30 ? '#ff4444' : '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(timeString, CARGO_CONFIG.CANVAS_WIDTH - 65, 35);

      // Timer label
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px Arial';
      ctx.fillText('TIME', CARGO_CONFIG.CANVAS_WIDTH - 65, 47);

      // Score display
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 120, 40);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 120, 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Score: ${gameState.score}`, 70, 30);

      ctx.fillStyle = '#cccccc';
      ctx.font = '12px Arial';
      ctx.fillText(`Items: ${gameState.deliveredItems}/${gameState.totalItems}`, 70, 42);

      ctx.restore();
    }
  }

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState.gameStatus === 'menu') {
          startGame();
        } else if (gameState.gameStatus === 'playing' || gameState.gameStatus === 'paused') {
          pauseGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameStatus, startGame, pauseGame]);

  // Game loop
  useGameLoop(updateGame, gameState.gameStatus === 'playing');

  // Render loop
  useEffect(() => {
    let animationId: number;

    const renderLoop = () => {
      render();
      animationId = requestAnimationFrame(renderLoop);
    };

    if (!imagesLoading && images) {
      renderLoop();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [render, imagesLoading, images]);

  if (imagesLoading) {
    return (
      <Card className="bg-gray-800/50 border-purple-500/50">
        <CardContent className="p-8 text-center">
          <div className="text-purple-400">Loading cargo bay assets...</div>
        </CardContent>
      </Card>
    );
  }

  if (imageError) {
    return (
      <Card className="bg-gray-800/50 border-red-500/50">
        <CardContent className="p-8 text-center">
          <div className="text-red-400">Error loading cargo assets: {imageError}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-purple-500/50">
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CARGO_CONFIG.CANVAS_WIDTH}
              height={CARGO_CONFIG.CANVAS_HEIGHT}
              className="border border-purple-500/50 rounded-lg bg-black"
              style={{ maxWidth: '100%', height: 'auto' }}
            />

            {gameState.gameStatus === 'menu' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-3xl font-bold mb-4 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                    STAR SEEKERS CARGO RUNNER
                  </h2>
                  <p className="mb-6 text-lg text-gray-300">
                    Collect valuable cargo and deliver it to the CSS station!
                  </p>

                  <div className="mb-6 text-sm text-gray-400 space-y-1">
                    <p>🔶 Heavy items (ARCO, DIAMOND, ROCH): 3kg each</p>
                    <p>🔸 Light items (all others): 1kg each</p>
                    <p>📦 Cargo limit: 3kg total capacity</p>
                    <p>🎮 WASD/Arrow Keys to move • Space to start/pause</p>
                  </div>

                  <div className="mb-4 text-sm">
                    <p>Loading Status: {imagesLoading ? 'Loading...' : 'Complete'}</p>
                    <p>Images Available: {images ? 'Yes' : 'No'}</p>
                    {imageError && <p className="text-red-400">Error: {imageError}</p>}
                  </div>

                  <Button 
                    onClick={startGame} 
                    disabled={imagesLoading || !images}
                    className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3 disabled:opacity-50"
                  >
                    {imagesLoading ? 'LOADING...' : !images ? 'ASSETS ERROR' : 'START MISSION'}
                  </Button>
                </div>
              </div>
            )}

            {gameState.gameStatus === 'paused' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                <div className="text-center text-white">
                  <div className="text-3xl text-yellow-400 mb-4 font-bold">MISSION PAUSED</div>
                  <Button onClick={pauseGame} className="bg-yellow-600 hover:bg-yellow-700 text-lg px-8 py-3">
                    RESUME MISSION
                  </Button>
                </div>
              </div>
            )}

            {gameState.gameStatus === 'gameOver' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-5xl font-bold mb-6 text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse">
                    MISSION FAILED
                  </h2>
                  <div className="mb-6 space-y-2">
                    <p className="text-2xl font-bold text-yellow-400">
                      Final Score: {gameState.score.toLocaleString()}
                    </p>
                    <p className="text-lg text-gray-300">
                      Items Delivered: {gameState.deliveredItems}/{gameState.totalItems}
                    </p>
                  </div>
                  <div className="space-x-4">
                    <Button onClick={startGame} className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
                      RETRY MISSION
                    </Button>
                    <Button onClick={() => navigate('/dashboard')} variant="outline" className="text-lg px-8 py-3">
                      MAIN MENU
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {gameState.gameStatus === 'levelComplete' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-5xl font-bold mb-6 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                    MISSION COMPLETE!
                  </h2>
                  <div className="mb-6 space-y-2">
                    <p className="text-2xl font-bold text-yellow-400">
                      Final Score: {gameState.score.toLocaleString()}
                    </p>
                    <p className="text-lg text-gray-300">
                      All cargo delivered successfully to the CSS station
                    </p>
                    <p className="text-md text-blue-400">
                      Time Bonus: {gameState.timeRemaining * CARGO_CONFIG.TIME_BONUS_MULTIPLIER} points
                    </p>
                  </div>
                  <div className="space-x-4">
                    <Button onClick={resetGame} className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                      NEW MISSION
                    </Button>
                    <Button onClick={() => navigate('/dashboard')} variant="outline" className="text-lg px-8 py-3">
                      MAIN MENU
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {gameState.gameStatus === 'timeUp' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-5xl font-bold mb-6 text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)] animate-pulse">
                    TIME UP!
                  </h2>
                  <div className="mb-6 space-y-2">
                    <p className="text-2xl font-bold text-yellow-400">
                      Final Score: {gameState.score.toLocaleString()}
                    </p>
                    <p className="text-lg text-gray-300">
                      Items Delivered: {gameState.deliveredItems}/{gameState.totalItems}
                    </p>
                    <p className="text-md text-gray-400">
                      Mission duration: 5:00
                    </p>
                  </div>
                  <div className="space-x-4">
                    <Button onClick={startGame} className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3">
                      RETRY MISSION
                    </Button>
                    <Button onClick={() => navigate('/dashboard')} variant="outline" className="text-lg px-8 py-3">
                      MAIN MENU
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MazeGame;