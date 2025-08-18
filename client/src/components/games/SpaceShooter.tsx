import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useImageLoader } from '@/hooks/useImageLoader';
import { GameState, Player, Bullet, Enemy, EnemyType, Asteroid, AsteroidType, Planet, PlanetType, Explosion, ExplosionParticle, PowerUp, PowerUpType } from '@/types/game';
import { recordGameSession } from '@/utils/gameLeaderboard';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 640;
const PLAYER_SPEED = 300;
const BULLET_SPEED = 500;
const ENEMY_SPEED = 100;

interface SpaceShooterProps {
  onGameStateChange?: (isPlaying: boolean) => void;
  onGameEnd?: (score: number) => void;
}

const SpaceShooter: React.FC<SpaceShooterProps> = ({ onGameStateChange, onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { images, loading: imagesLoading, error: imageError } = useImageLoader();

  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: 'player',
      position: { x: CANVAS_WIDTH / 2 - 28.125, y: CANVAS_HEIGHT - 112.5 },
      velocity: { x: 0, y: 0 },
      width: 56.25, // 45 * 1.25
      height: 75,   // 60 * 1.25
      health: 100,
      score: 0
    },
    bullets: [],
    enemies: [],
    asteroids: [],
    planets: [],
    explosions: [],
    powerUps: [],
    gameStatus: 'menu',
    score: 0,
    lives: 3,
    level: 1
  });

  const [lastShotTime, setLastShotTime] = useState(0);
  const [lastEnemySpawn, setLastEnemySpawn] = useState(0);
  const [maxEnemiesOnScreen, setMaxEnemiesOnScreen] = useState(3);
  const [currentWave, setCurrentWave] = useState(1);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [spawnInterval, setSpawnInterval] = useState(3000);
  const [starField, setStarField] = useState<Array<{ x: number; y: number; speed: number; brightness: number }>>([]);
  const [spaceKeyPressed, setSpaceKeyPressed] = useState(false);
  const [lastBossSpawn, setLastBossSpawn] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [c11Active, setC11Active] = useState(false);
  const [gameLevel, setGameLevel] = useState(1);
  const [c11Count, setC11Count] = useState(0);
  const [levelCompleted, setLevelCompleted] = useState<Record<number, boolean>>({});
  const [lastEnemyShoot, setLastEnemyShoot] = useState<Record<string, number>>({});
  const [lastAsteroidSpawn, setLastAsteroidSpawn] = useState(0);
  const [lastPlanetSpawn, setLastPlanetSpawn] = useState(0);
  const [explosionSound, setExplosionSound] = useState<HTMLAudioElement | null>(null);
  const [gameOverSound, setGameOverSound] = useState<HTMLAudioElement | null>(null);
  const [laserSound, setLaserSound] = useState<HTMLAudioElement | null>(null);
  const [liveSound, setLiveSound] = useState<HTMLAudioElement | null>(null);
  const [powerUpSound, setPowerUpSound] = useState<HTMLAudioElement | null>(null);
  const [lastExtraLifeScore, setLastExtraLifeScore] = useState(0);
  const [lastMissileSpawn, setLastMissileSpawn] = useState(0);
  const [missileMode, setMissileMode] = useState(false);
  const [missileModeEndTime, setMissileModeEndTime] = useState(0);
  const [doubleShotMode, setDoubleShotMode] = useState(false);
  const [doubleShotModeEndTime, setDoubleShotModeEndTime] = useState(0);
  const [lastDoubleShotSpawn, setLastDoubleShotSpawn] = useState(0);
  const [audioSettings, setAudioSettings] = useState({ muteAll: false, sfxVolume: 50, musicVolume: 50 }); // Placeholder for audio settings

  // Function to record game session to API
  const recordGameSessionToAPI = async (score: number) => {
    try {
      const success = await recordGameSession({
        gameId: 1,
        score: score,
        points: score // No multiplier, score = points
      });

      if (success) {
        console.log(`Game session recorded successfully: Score ${score}`);
      } else {
        console.error('Failed to record game session');
      }
    } catch (error) {
      console.error('Error recording game session:', error);
    }
  };

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Load sound effects
  useEffect(() => {
    const explosionAudio = new Audio('/assets/game1/Sounds/shipexplosion.dataset/shipexplosion.wav');
    explosionAudio.preload = 'auto';
    explosionAudio.volume = 0.5; // Set reasonable volume
    setExplosionSound(explosionAudio);

    const gameOverAudio = new Audio('/assets/game1/Sounds/gameover.dataset/gameover.wav');
    gameOverAudio.preload = 'auto';
    gameOverAudio.volume = 0.6; // Slightly louder for game over
    setGameOverSound(gameOverAudio);

    const laserAudio = new Audio('/assets/game1/Sounds/laser1.dataset/laser1.mp3');
    laserAudio.preload = 'auto';
    laserAudio.volume = 0.3; // Quieter since it plays frequently
    setLaserSound(laserAudio);

    const liveAudio = new Audio('/assets/game1/Sounds/live.dataset/live.wav');
    liveAudio.preload = 'auto';
    liveAudio.volume = 0.3;
    setLiveSound(liveAudio);

    const powerUpAudio = new Audio('/assets/game1/Sounds/powerup.dataset/powerup.wav');
    powerUpAudio.preload = 'auto';
    powerUpAudio.volume = 0.4;
    setPowerUpSound(powerUpAudio);
  }, []);

  // Sound effects
  const playLaserSound = useCallback(() => {
    if (audioSettings.muteAll) return;
    const audio = new Audio('/assets/game1/Sounds/laser1.dataset/laser1.mp3');
    audio.volume = (audioSettings.sfxVolume / 100) * 0.3;
    audio.play().catch(e => console.log('Laser sound failed:', e));
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

  const playExplosionSound = useCallback(() => {
    if (audioSettings.muteAll) return;
    const audio = new Audio('/assets/game1/Sounds/shipexplosion.dataset/shipexplosion.wav');
    audio.volume = (audioSettings.sfxVolume / 100) * 0.5;
    audio.play().catch(e => console.log('Explosion sound failed:', e));
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

  const playGameOverSound = useCallback(() => {
    if (audioSettings.muteAll) return;
    const audio = new Audio('/assets/game1/Sounds/gameover.dataset/gameover.wav');
    audio.volume = (audioSettings.sfxVolume / 100) * 0.6;
    audio.play().catch(e => console.log('Game over sound failed:', e));
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

  const playPowerUpSound = useCallback(() => {
    if (audioSettings.muteAll) return;
    const audio = new Audio('/assets/game1/Sounds/powerup.dataset/powerup.wav');
    audio.volume = (audioSettings.sfxVolume / 100) * 0.4;
    audio.play().catch(e => console.log('PowerUp sound failed:', e));
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);


  // Create explosion effect
  const createExplosion = (x: number, y: number, size: 'small' | 'medium' | 'large' = 'medium'): Explosion => {
    const particleCount = size === 'small' ? 8 : size === 'medium' ? 15 : 25;
    const maxSpeed = size === 'small' ? 100 : size === 'medium' ? 150 : 200;
    const maxLife = size === 'small' ? 0.5 : size === 'medium' ? 0.8 : 1.2;

    const particles: ExplosionParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = Math.random() * maxSpeed + 50;
      const life = Math.random() * maxLife + 0.3;

      particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: Math.random() * 3 + 2,
        color: Math.random() < 0.7 ? '#ff6600' : '#ffff00' // Orange or yellow
      });
    }

    return {
      id: generateId(),
      position: { x, y },
      particles,
      life: maxLife,
      maxLife: maxLife
    };
  };

  // Create power-up
  const createPowerUp = (type: PowerUpType): PowerUp => {
    const width = 30;
    const height = 30;

    return {
      id: generateId(),
      position: {
        x: Math.random() * (CANVAS_WIDTH - width),
        y: -height
      },
      velocity: { x: 0, y: 80 }, // Slow fall speed
      width,
      height,
      type,
      life: 12, // 12 seconds to collect
      maxLife: 12
    };
  };

  // Check if a position overlaps with existing enemies
  const isPositionOccupied = (x: number, y: number, width: number, height: number, existingEnemies: Enemy[]): boolean => {
    const buffer = 20; // Minimum distance between enemies
    return existingEnemies.some(enemy => {
      return (
        x < enemy.position.x + enemy.width + buffer &&
        x + width + buffer > enemy.position.x &&
        y < enemy.position.y + enemy.height + buffer &&
        y + height + buffer > enemy.position.y
      );
    });
  };

  // Find a safe spawn position for an enemy
  const findSafeSpawnPosition = (enemyWidth: number, enemyHeight: number, existingEnemies: Enemy[]): { x: number; y: number } => {
    const maxAttempts = 20;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const x = Math.random() * (CANVAS_WIDTH - enemyWidth);
      const y = -enemyHeight;

      if (!isPositionOccupied(x, y, enemyWidth, enemyHeight, existingEnemies)) {
        return { x, y };
      }
      attempts++;
    }

    // If we can't find a safe position after many attempts, use a fallback
    return { 
      x: Math.random() * (CANVAS_WIDTH - enemyWidth), 
      y: -enemyHeight - (Math.random() * 100) // Spawn further up to avoid collisions
    };
  };

  // Get random enemy type based on score - small enemies first, big enemies after 500 points, boss at 10,000
  const getRandomEnemyType = (score: number): { type: EnemyType; points: number; width: number; height: number } => {
    const smallEnemies: Array<{ type: EnemyType; points: number; width: number; height: number }> = [
      { type: 'e1', points: 10, width: 50, height: 50 }, // 40 * 1.25 = 50
      { type: 'e2', points: 15, width: 50, height: 50 },
      { type: 'e3', points: 12, width: 50, height: 50 },
      { type: 'e4', points: 18, width: 50, height: 50 },
      { type: 'e5', points: 20, width: 50, height: 50 },
      { type: 'e6', points: 25, width: 50, height: 50 },
    ];

    const bigEnemies: Array<{ type: EnemyType; points: number; width: number; height: number }> = [
      { type: 'c8', points: 50, width: 100, height: 100 }, // 80 * 1.25 = 100
      { type: 'c9', points: 65, width: 100, height: 100 },
      { type: 'c10', points: 80, width: 100, height: 100 },
      // C11 is handled by level system, not random spawning
    ];

    // Use small enemies before 500 points, mix of both after 500 points
    if (score < 500) {
      return smallEnemies[Math.floor(Math.random() * smallEnemies.length)];
    } else {
      // After 500 points, 70% chance for big enemies, 30% for small enemies
      const useBigEnemy = Math.random() < 0.7;
      const enemyPool = useBigEnemy ? bigEnemies : smallEnemies;
      return enemyPool[Math.floor(Math.random() * enemyPool.length)];
    }
  };

  // Boss enemy configuration
  const getBossEnemy = (): { type: EnemyType; points: number; width: number; height: number; health: number } => {
    return { type: 'boss', points: 500, width: 187.5, height: 187.5, health: 250 }; // 150 * 1.25 = 187.5
  };

  // Get random asteroid type
  const getRandomAsteroidType = (): AsteroidType => {
    const types: AsteroidType[] = ['a1', 'a2', 'a3'];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Get random planet type
  const getRandomPlanetType = (): PlanetType => {
    const types: PlanetType[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', 'w1', 'w2', 'w3', 'w4', 'w5'];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Spawn decorative planet from top of screen moving downward
  const spawnPlanet = (): Planet => {
    const planetType = getRandomPlanetType();
    const scale = Math.random() * 2.5 + 1.5; // Much bigger: Scale between 1.5x and 4x
    const baseSize = 200; // Larger base planet size
    const width = baseSize * scale;
    const height = baseSize * scale;

    // Always spawn from top edge, moving downward like enemy ships
    const position = { 
      x: Math.random() * (CANVAS_WIDTH + 400) - 200, // Can spawn partially off-screen horizontally
      y: -height - 50 // Spawn above visible area
    };

    const velocity = { 
      x: 0, // No horizontal movement, straight down like enemy ships
      y: Math.random() * 20 + 15 // Slow downward movement (15-35)
    };

    return {
      id: generateId(),
      position,
      velocity,
      width,
      height,
      type: planetType,
      scale,
      opacity: Math.random() * 0.4 + 0.3, // Opacity between 0.3 and 0.7 for background effect
      rotation: 0, // No rotation
      rotationSpeed: 0 // No rotation
    };
  };

  // Spawn asteroid from random edge with multi-directional movement
  const spawnAsteroidFromEdge = (): Asteroid => {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    const asteroidType = getRandomAsteroidType();
    const width = 56.25; // Same as player ship
    const height = 75;   // Same as player ship

    let position: { x: number; y: number };
    let velocity: { x: number; y: number };

    switch (edge) {
      case 0: // Top edge
        position = { x: Math.random() * (CANVAS_WIDTH - width), y: -height };
        velocity = { 
          x: (Math.random() - 0.5) * 100, // Random horizontal movement
          y: Math.random() * 80 + 40 // Downward movement (40-120)
        };
        break;
      case 1: // Right edge  
        position = { x: CANVAS_WIDTH, y: Math.random() * (CANVAS_HEIGHT - height) };
        velocity = { 
          x: -(Math.random() * 80 + 40), // Leftward movement (40-120)
          y: (Math.random() - 0.5) * 100 // Random vertical movement
        };
        break;
      case 2: // Bottom edge
        position = { x: Math.random() * (CANVAS_WIDTH - width), y: CANVAS_HEIGHT };
        velocity = { 
          x: (Math.random() - 0.5) * 100, // Random horizontal movement
          y: -(Math.random() * 80 + 40) // Upward movement (40-120)
        };
        break;
      default: // Left edge
        position = { x: -width, y: Math.random() * (CANVAS_HEIGHT - height) };
        velocity = { 
          x: Math.random() * 80 + 40, // Rightward movement (40-120)
          y: (Math.random() - 0.5) * 100 // Random vertical movement
        };
        break;
    }

    return {
      id: generateId(),
      position,
      velocity,
      width,
      height,
      health: 30, // Asteroids are tougher than regular enemies
      points: 75,
      type: asteroidType,
      rotation: Math.random() * 360, // Random starting rotation
      rotationSpeed: (Math.random() - 0.5) * 180 // Random rotation speed (-90 to +90 degrees/sec)
    };
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      // Handle spacebar press for single-shot mechanics
      if (key === ' ' || key === 'spacebar') {
        if (!spaceKeyPressed) {
          setSpaceKeyPressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);

      // Handle spacebar release
      if (key === ' ' || key === 'spacebar') {
        setSpaceKeyPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spaceKeyPressed]);

  // Game logic update
  const updateGame = useCallback((deltaTime: number) => {
    if (gameState.gameStatus !== 'playing') return;
    const dt = deltaTime / 1000; // Convert to seconds
    const currentTime = Date.now();
    let shotFired = false;
    let enemySpawned = false;
    let newShotTime = lastShotTime;
    let newEnemySpawn = lastEnemySpawn;
    setGameState(prevState => {
      const newState = { ...prevState };
      // Update player movement
      const keys = keysRef.current;
      let playerVelX = 0;
      let playerVelY = 0;
      if (keys.has('a') || keys.has('arrowleft')) playerVelX = -PLAYER_SPEED;
      if (keys.has('d') || keys.has('arrowright')) playerVelX = PLAYER_SPEED;
      if (keys.has('w') || keys.has('arrowup')) playerVelY = -PLAYER_SPEED;
      if (keys.has('s') || keys.has('arrowdown')) playerVelY = PLAYER_SPEED;
      // Update player position
      newState.player.position.x += playerVelX * dt;
      newState.player.position.y += playerVelY * dt;
      // Keep player in bounds
      newState.player.position.x = Math.max(0, Math.min(CANVAS_WIDTH - newState.player.width, newState.player.position.x));
      newState.player.position.y = Math.max(0, Math.min(CANVAS_HEIGHT - newState.player.height, newState.player.position.y));
      // Handle shooting - single, double, or triple shot based on active modes
      if (spaceKeyPressed && currentTime - lastShotTime > 300) { // 300ms cooldown, only on key press
        if (missileMode && currentTime < missileModeEndTime) {
          // Triple shot mode - center, left, right (angled)
          const centerBullet: Bullet = {
            id: generateId(),
            position: {
              x: newState.player.position.x + newState.player.width / 2 - 3,
              y: newState.player.position.y
            },
            velocity: { x: 0, y: -BULLET_SPEED },
            width: 6,
            height: 15,
            damage: 10,
            type: 'player',
            color: 'blue'
          };

          const leftBullet: Bullet = {
            id: generateId(),
            position: {
              x: newState.player.position.x + newState.player.width / 2 - 3,
              y: newState.player.position.y
            },
            velocity: { x: -150, y: -BULLET_SPEED }, // 30 degree angle left
            width: 6,
            height: 15,
            damage: 10,
            type: 'player',
            color: 'blue'
          };

          const rightBullet: Bullet = {
            id: generateId(),
            position: {
              x: newState.player.position.x + newState.player.width / 2 - 3,
              y: newState.player.position.y
            },
            velocity: { x: 150, y: -BULLET_SPEED }, // 30 degree angle right
            width: 6,
            height: 15,
            damage: 10,
            type: 'player',
            color: 'blue'
          };

          newState.bullets.push(centerBullet, leftBullet, rightBullet);
        } else if (doubleShotMode && currentTime < doubleShotModeEndTime) {
          // Double shot mode - two parallel bullets
          const leftBullet: Bullet = {
            id: generateId(),
            position: {
              x: newState.player.position.x + newState.player.width / 2 - 15,
              y: newState.player.position.y
            },
            velocity: { x: 0, y: -BULLET_SPEED },
            width: 6,
            height: 15,
            damage: 10,
            type: 'player',
            color: 'blue'
          };

          const rightBullet: Bullet = {
            id: generateId(),
            position: {
              x: newState.player.position.x + newState.player.width / 2 + 15,
              y: newState.player.position.y
            },
            velocity: { x: 0, y: -BULLET_SPEED },
            width: 6,
            height: 15,
            damage: 10,
            type: 'player',
            color: 'blue'
          };

          newState.bullets.push(leftBullet, rightBullet);
        } else {
          // Single shot mode
          const bullet: Bullet = {
            id: generateId(),
            position: {
              x: newState.player.position.x + newState.player.width / 2 - 3,
              y: newState.player.position.y
            },
            velocity: { x: 0, y: -BULLET_SPEED },
            width: 6,
            height: 15,
            damage: 10,
            type: 'player',
            color: 'blue'
          };
          newState.bullets.push(bullet);
        }

        shotFired = true;
        newShotTime = currentTime;

        // Play laser sound when player shoots
        playLaserSound();

        setSpaceKeyPressed(false); // Reset to prevent rapid fire
      }
      // Update bullets
      newState.bullets = newState.bullets
        .map(bullet => ({
          ...bullet,
          position: {
            x: bullet.position.x + bullet.velocity.x * dt,
            y: bullet.position.y + bullet.velocity.y * dt
          }
        }))
        .filter(bullet => {
          // Filter out bullets that go off screen (up or down)
          return bullet.position.y > -bullet.height && bullet.position.y < CANVAS_HEIGHT + bullet.height;
        });
      // C11 Level System Spawning
      const shouldSpawnC11Level = () => {
        // Level 1: 10,000+ points, 1 C11
        if (newState.score >= 10000 && gameLevel === 1 && !levelCompleted[1] && c11Count === 0) {
          return { level: 1, count: 1 };
        }
        // Level 2: 20,000+ points, 2 C11s
        if (newState.score >= 20000 && gameLevel === 2 && !levelCompleted[2] && c11Count === 0) {
          return { level: 2, count: 2 };
        }
        // Level 3: 30,000+ points, 3 C11s
        if (newState.score >= 30000 && gameLevel === 3 && !levelCompleted[3] && c11Count === 0) {
          return { level: 3, count: 3 };
        }
        return null;
      };

      const c11SpawnInfo = shouldSpawnC11Level();
      if (c11SpawnInfo && !c11Active) {
        // Spawn the required number of C11s for this level
        for (let i = 0; i < c11SpawnInfo.count; i++) {
          const c11Width = 150;
          const c11Height = 150;
          const spacing = 200; // Space between multiple C11s
          const startX = CANVAS_WIDTH / 2 - ((c11SpawnInfo.count - 1) * spacing) / 2;

          const c11Enemy: Enemy = {
            id: generateId(),
            position: {
              x: startX + (i * spacing) - c11Width / 2,
              y: -c11Height - (i * 50) // Stagger spawn times slightly
            },
            velocity: { x: 0, y: 50 }, // Slower movement than regular enemies
            width: c11Width,
            height: c11Height,
            health: 100,
            points: 100,
            type: 'c11'
          };
          newState.enemies.push(c11Enemy);
        }

        setC11Active(true);
        setC11Count(c11SpawnInfo.count);

        // Clear other enemies when C11s appear for dramatic effect
        newState.enemies = newState.enemies.filter(enemy => enemy.type === 'c11');
      }
      // Spawn regular enemies (but not when boss or C11s are active)
      else if (!bossActive && !c11Active && currentTime - lastEnemySpawn > spawnInterval && newState.enemies.length < maxEnemiesOnScreen) {
        const { type, points, width, height } = getRandomEnemyType(newState.score);

        const safePosition = findSafeSpawnPosition(width, height, newState.enemies);

        // Set health based on enemy type (C11 not handled here anymore)
        let enemyHealth = 10; // Default for small enemies
        if (type.startsWith('c')) {
          enemyHealth = 30; // Big enemies: 30 (3 shots)
        }

        const enemy: Enemy = {
          id: generateId(),
          position: safePosition,
          velocity: { x: 0, y: ENEMY_SPEED },
          width,
          height,
          health: enemyHealth,
          points,
          type
        };
        newState.enemies.push(enemy);
        enemySpawned = true;
        newEnemySpawn = currentTime;
      }

      // Spawn asteroids from random edges every 4-6 seconds
      if (currentTime - lastAsteroidSpawn > 4000 + Math.random() * 2000) {
        const asteroid = spawnAsteroidFromEdge();
        newState.asteroids.push(asteroid);
        setLastAsteroidSpawn(currentTime);
      }

      // Spawn decorative planets every 8-15 seconds, but only one at a time
      if (newState.planets.length === 0 && currentTime - lastPlanetSpawn > 8000 + Math.random() * 7000) {
        const planet = spawnPlanet();
        newState.planets.push(planet);
        setLastPlanetSpawn(currentTime);
      }

      // Check if missile mode expired
      if (missileMode && currentTime >= missileModeEndTime) {
        setMissileMode(false);
        setMissileModeEndTime(0);
      }

      // Check if double shot mode expired
      if (doubleShotMode && currentTime >= doubleShotModeEndTime) {
        setDoubleShotMode(false);
        setDoubleShotModeEndTime(0);
      }

      // Spawn extra life power-up every 250 points
      if (newState.score >= lastExtraLifeScore + 250) {
        const extraLife = createPowerUp('extraLife');
        newState.powerUps.push(extraLife);
        setLastExtraLifeScore(Math.floor(newState.score / 250) * 250);
      }

      // Spawn missile power-up every 500-750 points (random timing)
      if (newState.score >= 500 && currentTime - lastMissileSpawn > 15000 + Math.random() * 10000) {
        const missile = createPowerUp('missiles');
        newState.powerUps.push(missile);
        setLastMissileSpawn(currentTime);
      }

      // Spawn double shot power-up every 300-450 points (random timing)
      if (newState.score >= 300 && currentTime - lastDoubleShotSpawn > 12000 + Math.random() * 8000) {
        const doubleShot = createPowerUp('doubleShot');
        newState.powerUps.push(doubleShot);
        setLastDoubleShotSpawn(currentTime);
      }

      // Update asteroids with rotation
      newState.asteroids = newState.asteroids
        .map(asteroid => ({
          ...asteroid,
          position: {
            x: asteroid.position.x + asteroid.velocity.x * dt,
            y: asteroid.position.y + asteroid.velocity.y * dt
          },
          rotation: asteroid.rotation + asteroid.rotationSpeed * dt
        }))
        .filter(asteroid => {
          // Remove asteroids that are completely off screen
          return (
            asteroid.position.x + asteroid.width > -50 &&
            asteroid.position.x < CANVAS_WIDTH + 50 &&
            asteroid.position.y + asteroid.height > -50 &&
            asteroid.position.y < CANVAS_HEIGHT + 50
          );
        });

      // Update planets (moving straight down from top)
      newState.planets = newState.planets
        .map(planet => ({
          ...planet,
          position: {
            x: planet.position.x + planet.velocity.x * dt,
            y: planet.position.y + planet.velocity.y * dt
          }
        }))
        .filter(planet => {
          // Remove planets that have moved completely off the bottom of the screen
          return planet.position.y < CANVAS_HEIGHT + 100;
        });

      // Update explosions
      newState.explosions = newState.explosions
        .map(explosion => ({
          ...explosion,
          life: explosion.life - dt,
          particles: explosion.particles
            .map(particle => ({
              ...particle,
              x: particle.x + particle.velocityX * dt,
              y: particle.y + particle.velocityY * dt,
              life: particle.life - dt,
              velocityX: particle.velocityX * 0.98, // Slight friction
              velocityY: particle.velocityY * 0.98 + 20 * dt // Slight gravity
            }))
            .filter(particle => particle.life > 0)
        }))
        .filter(explosion => explosion.life > 0 && explosion.particles.length > 0);

      // Update power-ups
      newState.powerUps = newState.powerUps
        .map(powerUp => ({
          ...powerUp,
          position: {
            x: powerUp.position.x + powerUp.velocity.x * dt,
            y: powerUp.position.y + powerUp.velocity.y * dt
          },
          life: powerUp.life - dt
        }))
        .filter(powerUp => {
          // Remove power-ups that expired or went off screen
          return powerUp.life > 0 && powerUp.position.y < CANVAS_HEIGHT + 50;
        });

      // Update enemies with special boss movement
      newState.enemies = newState.enemies
        .map(enemy => {
          if (enemy.type === 'boss') {
            // Boss side-to-side movement
            let newX = enemy.position.x + enemy.velocity.x * dt;
            let newVelX = enemy.velocity.x;

            // Bounce off screen edges
            if (newX <= 0 || newX >= CANVAS_WIDTH - enemy.width) {
              newVelX = -newVelX;
              newX = Math.max(0, Math.min(CANVAS_WIDTH - enemy.width, newX));
            }

            return {
              ...enemy,
              position: {
                x: newX,
                y: enemy.position.y + enemy.velocity.y * dt
              },
              velocity: { x: newVelX, y: enemy.velocity.y }
            };
          } else {
            // Regular enemy movement
            return {
              ...enemy,
              position: {
                x: enemy.position.x + enemy.velocity.x * dt,
                y: enemy.position.y + enemy.velocity.y * dt
              }
            };
          }
        })
        .filter(enemy => {
          const offScreen = enemy.position.y > CANVAS_HEIGHT + 50;
          if (offScreen && enemy.type === 'boss') {
            setBossActive(false); // Boss went off screen
          }
          if (offScreen && enemy.type === 'c11') {
            setC11Count(prev => {
              const newCount = prev - 1;
              if (newCount === 0) {
                setC11Active(false); // All C11s off screen
              }
              return newCount;
            });
          }
          return !offScreen;
        });

      // Enemy shooting logic
      newState.enemies.forEach(enemy => {
        const enemyShootCooldown = enemy.type === 'boss' ? 800 : enemy.type.startsWith('c') ? 1500 : 2000; // Boss shoots faster
        const lastShot = lastEnemyShoot[enemy.id] || 0;

        if (currentTime - lastShot > enemyShootCooldown) {
          // Random chance to shoot (30% for small, 50% for big, 70% for boss)
          const shootChance = enemy.type === 'boss' ? 0.7 : enemy.type.startsWith('c') ? 0.5 : 0.3;

          if (Math.random() < shootChance) {
            // C9 - Red Triple Shot
            if (enemy.type === 'c9') {
              const centerBullet: Bullet = {
                id: generateId(),
                position: {
                  x: enemy.position.x + enemy.width / 2 - 2,
                  y: enemy.position.y + enemy.height
                },
                velocity: { x: 0, y: BULLET_SPEED * 0.6 },
                width: 4,
                height: 12,
                damage: 20,
                type: 'enemy',
                color: 'red'
              };

              const leftBullet: Bullet = {
                id: generateId(),
                position: {
                  x: enemy.position.x + enemy.width / 2 - 2,
                  y: enemy.position.y + enemy.height
                },
                velocity: { x: -100, y: BULLET_SPEED * 0.6 },
                width: 4,
                height: 12,
                damage: 20,
                type: 'enemy',
                color: 'red'
              };

              const rightBullet: Bullet = {
                id: generateId(),
                position: {
                  x: enemy.position.x + enemy.width / 2 - 2,
                  y: enemy.position.y + enemy.height
                },
                velocity: { x: 100, y: BULLET_SPEED * 0.6 },
                width: 4,
                height: 12,
                damage: 20,
                type: 'enemy',
                color: 'red'
              };

              newState.bullets.push(centerBullet, leftBullet, rightBullet);
            }
            // C10 - Green Double Shot
            else if (enemy.type === 'c10') {
              const leftBullet: Bullet = {
                id: generateId(),
                position: {
                  x: enemy.position.x + enemy.width / 2 - 15,
                  y: enemy.position.y + enemy.height
                },
                velocity: { x: 0, y: BULLET_SPEED * 0.6 },
                width: 4,
                height: 12,
                damage: 20,
                type: 'enemy',
                color: 'green'
              };

              const rightBullet: Bullet = {
                id: generateId(),
                position: {
                  x: enemy.position.x + enemy.width / 2 + 15,
                  y: enemy.position.y + enemy.height
                },
                velocity: { x: 0, y: BULLET_SPEED * 0.6 },
                width: 4,
                height: 12,
                damage: 20,
                type: 'enemy',
                color: 'green'
              };

              newState.bullets.push(leftBullet, rightBullet);
            }
            // C11 - Alternating Double/Triple Shot
            else if (enemy.type === 'c11') {
              const useTripleShot = Math.random() < 0.5; // 50% chance for triple vs double

              if (useTripleShot) {
                // Triple shot pattern
                const centerBullet: Bullet = {
                  id: generateId(),
                  position: {
                    x: enemy.position.x + enemy.width / 2 - 2,
                    y: enemy.position.y + enemy.height
                  },
                  velocity: { x: 0, y: BULLET_SPEED * 0.6 },
                  width: 4,
                  height: 12,
                  damage: 25,
                  type: 'enemy',
                  color: 'green'
                };

                const leftBullet: Bullet = {
                  id: generateId(),
                  position: {
                    x: enemy.position.x + enemy.width / 2 - 2,
                    y: enemy.position.y + enemy.height
                  },
                  velocity: { x: -80, y: BULLET_SPEED * 0.6 },
                  width: 4,
                  height: 12,
                  damage: 25,
                  type: 'enemy',
                  color: 'green'
                };

                const rightBullet: Bullet = {
                  id: generateId(),
                  position: {
                    x: enemy.position.x + enemy.width / 2 - 2,
                    y: enemy.position.y + enemy.height
                  },
                  velocity: { x: 80, y: BULLET_SPEED * 0.6 },
                  width: 4,
                  height: 12,
                  damage: 25,
                  type: 'enemy',
                  color: 'green'
                };

                newState.bullets.push(centerBullet, leftBullet, rightBullet);
              } else {
                // Double shot pattern
                const leftBullet: Bullet = {
                  id: generateId(),
                  position: {
                    x: enemy.position.x + enemy.width / 2 - 15,
                    y: enemy.position.y + enemy.height
                  },
                  velocity: { x: 0, y: BULLET_SPEED * 0.6 },
                  width: 4,
                  height: 12,
                  damage: 25,
                  type: 'enemy',
                  color: 'green'
                };

                const rightBullet: Bullet = {
                  id: generateId(),
                  position: {
                    x: enemy.position.x + enemy.width / 2 + 15,
                    y: enemy.position.y + enemy.height
                  },
                  velocity: { x: 0, y: BULLET_SPEED * 0.6 },
                  width: 4,
                  height: 12,
                  damage: 25,
                  type: 'enemy',
                  color: 'green'
                };

                newState.bullets.push(leftBullet, rightBullet);
              }
            }
            // Standard single shot for other enemies
            else {
              // Determine bullet color based on enemy type
              let bulletColor: 'yellow' | 'green' = 'yellow';
              if (enemy.type === 'boss') bulletColor = 'green';

              const enemyBullet: Bullet = {
                id: generateId(),
                position: {
                  x: enemy.position.x + enemy.width / 2 - 3,
                  y: enemy.position.y + enemy.height
                },
                velocity: { x: 0, y: BULLET_SPEED * 0.6 }, // Slower than player bullets
                width: 4,
                height: 12,
                damage: enemy.type === 'boss' ? 30 : enemy.type.startsWith('c') ? 20 : 15,
                type: 'enemy',
                color: bulletColor
              };

              newState.bullets.push(enemyBullet);
            }

            setLastEnemyShoot(prev => ({ ...prev, [enemy.id]: currentTime }));
          }
        }
      });

      // Collision detection - separate player and enemy bullets
      const remainingBullets: Bullet[] = [];
      const remainingEnemies: Enemy[] = [];
      const remainingAsteroids: Asteroid[] = [];

      newState.bullets.forEach(bullet => {
        let bulletHit = false;

        if (bullet.type === 'player') {
          // Player bullets vs enemies
          newState.enemies.forEach(enemy => {
            if (!bulletHit &&
                bullet.position.x < enemy.position.x + enemy.width &&
                bullet.position.x + bullet.width > enemy.position.x &&
                bullet.position.y < enemy.position.y + enemy.height &&
                bullet.position.y + bullet.height > enemy.position.y) {
              enemy.health -= bullet.damage;
              bulletHit = true;
              if (enemy.health <= 0) {
                newState.score += enemy.points;
                setEnemiesKilled(prev => prev + 1);

                // Create explosion effect at enemy center
                const explosionX = enemy.position.x + enemy.width / 2;
                const explosionY = enemy.position.y + enemy.height / 2;
                const explosionSize = enemy.type === 'boss' ? 'large' : enemy.type.startsWith('c') ? 'medium' : 'small';
                const explosion = createExplosion(explosionX, explosionY, explosionSize);
                newState.explosions.push(explosion);

                // Play explosion sound
                playExplosionSound();

                // If boss was destroyed, reset boss state
                if (enemy.type === 'boss') {
                  setBossActive(false);
                }
                // If C11 was destroyed, decrease count and check level completion
                if (enemy.type === 'c11') {
                  setC11Count(prev => {
                    const newCount = prev - 1;
                    if (newCount === 0) {
                      // All C11s destroyed, level complete
                      setC11Active(false);
                      setLevelCompleted(prevCompleted => ({ ...prevCompleted, [gameLevel]: true }));

                      // Advance to next level
                      if (gameLevel < 3) {
                        setGameLevel(prev => prev + 1);
                      }
                    }
                    return newCount;
                  });
                }
              } else {
                remainingEnemies.push(enemy);
              }
            }
          });

          // Player bullets vs asteroids
          if (!bulletHit) {
            newState.asteroids.forEach(asteroid => {
              if (!bulletHit &&
                  bullet.position.x < asteroid.position.x + asteroid.width &&
                  bullet.position.x + bullet.width > asteroid.position.x &&
                  bullet.position.y < asteroid.position.y + asteroid.height &&
                  bullet.position.y + bullet.height > asteroid.position.y) {
                asteroid.health -= bullet.damage;
                bulletHit = true;
                if (asteroid.health <= 0) {
                  newState.score += asteroid.points;

                  // Create explosion effect at asteroid center
                  const explosionX = asteroid.position.x + asteroid.width / 2;
                  const explosionY = asteroid.position.y + asteroid.height / 2;
                  const explosion = createExplosion(explosionX, explosionY, 'medium');
                  newState.explosions.push(explosion);

                  // Play explosion sound
                  playExplosionSound();
                } else {
                  remainingAsteroids.push(asteroid);
                }
              }
            });
          }
        } else if (bullet.type === 'enemy') {
          // Enemy bullets vs player
          if (bullet.position.x < newState.player.position.x + newState.player.width &&
              bullet.position.x + bullet.width > newState.player.position.x &&
              bullet.position.y < newState.player.position.y + newState.player.height &&
              bullet.position.y + bullet.height > newState.player.position.y) {
            
            // Damage player health instead of immediately losing life
            newState.player.health -= bullet.damage;
            bulletHit = true;

            // Create explosion effect at player center when hit
            const explosionX = newState.player.position.x + newState.player.width / 2;
            const explosionY = newState.player.position.y + newState.player.height / 2;
            const explosion = createExplosion(explosionX, explosionY, 'medium');
            newState.explosions.push(explosion);
            playExplosionSound();

            // Check if player health is depleted
            if (newState.player.health <= 0) {
              newState.lives -= 1;
              newState.player.health = 100; // Reset health for next life
            }
          }
        }

        if (!bulletHit) {
          remainingBullets.push(bullet);
        }
      });

      // Add enemies that weren't hit
      newState.enemies.forEach(enemy => {
        if (enemy.health > 0 && !remainingEnemies.find(e => e.id === enemy.id)) {
          remainingEnemies.push(enemy);
        }
      });

      // Add asteroids that weren't hit  
      newState.asteroids.forEach(asteroid => {
        if (asteroid.health > 0 && !remainingAsteroids.find(a => a.id === asteroid.id)) {
          remainingAsteroids.push(asteroid);
        }
      });

      newState.bullets = remainingBullets;
      newState.enemies = remainingEnemies;
      newState.asteroids = remainingAsteroids;
      // Update starfield for forward movement effect
      setStarField(prevStars => 
        prevStars.map(star => ({
          ...star,
          y: star.y + star.speed * dt * 100 // Move stars down to simulate forward movement
        })).filter(star => star.y < CANVAS_HEIGHT + 10) // Remove stars that went off screen
      );

      // Add new stars at the top to maintain count
      setStarField(prevStars => {
        const newStars = [...prevStars];
        while (newStars.length < 150) {
          newStars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: -10,
            speed: Math.random() * 3 + 1,
            brightness: Math.random() * 0.8 + 0.2
          });
        }
        return newStars;
      });

      // Check player collision with enemies
      newState.enemies.forEach(enemy => {
        if (newState.player.position.x < enemy.position.x + enemy.width &&
            newState.player.position.x + newState.player.width > enemy.position.x &&
            newState.player.position.y < enemy.position.y + enemy.height &&
            newState.player.position.y + newState.player.height > enemy.position.y) {
          
          // Damage player health instead of immediately losing life
          newState.player.health -= 50; // Enemy collision does significant damage

          // Create explosion effect at collision point
          const explosionX = (newState.player.position.x + newState.player.width / 2 + enemy.position.x + enemy.width / 2) / 2;
          const explosionY = (newState.player.position.y + newState.player.height / 2 + enemy.position.y + enemy.height / 2) / 2;
          const explosion = createExplosion(explosionX, explosionY, 'large');
          newState.explosions.push(explosion);
          playExplosionSound();

          // Check if player health is depleted
          if (newState.player.health <= 0) {
            newState.lives -= 1;
            newState.player.health = 100; // Reset health for next life
          }

          // Remove the enemy that hit the player
          newState.enemies = newState.enemies.filter(e => e.id !== enemy.id);
        }
      });

      // Check player collision with asteroids
      newState.asteroids.forEach(asteroid => {
        if (newState.player.position.x < asteroid.position.x + asteroid.width &&
            newState.player.position.x + newState.player.width > asteroid.position.x &&
            newState.player.position.y < asteroid.position.y + asteroid.height &&
            newState.player.position.y + newState.player.height > asteroid.position.y) {
          
          // Damage player health instead of immediately losing life
          newState.player.health -= 40; // Asteroid collision does moderate damage

          // Create explosion effect at collision point
          const explosionX = (newState.player.position.x + newState.player.width / 2 + asteroid.position.x + asteroid.width / 2) / 2;
          const explosionY = (newState.player.position.y + newState.player.height / 2 + asteroid.position.y + asteroid.height / 2) / 2;
          const explosion = createExplosion(explosionX, explosionY, 'large');
          newState.explosions.push(explosion);
          playExplosionSound();

          // Check if player health is depleted
          if (newState.player.health <= 0) {
            newState.lives -= 1;
            newState.player.health = 100; // Reset health for next life
          }

          // Remove the asteroid that hit the player
          newState.asteroids = newState.asteroids.filter(a => a.id !== asteroid.id);
        }
      });

      // Check if game over after all collisions are processed
      if (newState.lives <= 0) {
        newState.gameStatus = 'gameOver';
        // Play game over sound when player dies
        playGameOverSound();
        // Record game session when game ends
        recordGameSessionToAPI(newState.score);
      }

      // Check player collision with power-ups
      newState.powerUps.forEach(powerUp => {
        if (newState.player.position.x < powerUp.position.x + powerUp.width &&
            newState.player.position.x + newState.player.width > powerUp.position.x &&
            newState.player.position.y < powerUp.position.y + powerUp.height &&
            newState.player.position.y + newState.player.height > powerUp.position.y) {

          if (powerUp.type === 'extraLife') {
            newState.lives += 1;
            playPowerUpSound();
          } else if (powerUp.type === 'missiles') {
            setMissileMode(true);
            setMissileModeEndTime(currentTime + 10000); // 10 seconds
            playPowerUpSound();
          } else if (powerUp.type === 'doubleShot') {
            setDoubleShotMode(true);
            setDoubleShotModeEndTime(currentTime + 8000); // 8 seconds
            playPowerUpSound();
          }

          // Remove collected power-up
          newState.powerUps = newState.powerUps.filter(p => p.id !== powerUp.id);
        }
      });

      return newState;
    });
    if (shotFired) setLastShotTime(newShotTime);
    if (enemySpawned) setLastEnemySpawn(newEnemySpawn);
  }, [gameState.gameStatus, lastShotTime, lastEnemySpawn, maxEnemiesOnScreen, spawnInterval, spaceKeyPressed, bossActive, lastBossSpawn, lastEnemyShoot, lastAsteroidSpawn, lastPlanetSpawn, lastExtraLifeScore, lastMissileSpawn, missileMode, missileModeEndTime]);

  // Progressive difficulty system
  useEffect(() => {
    const wavesConfig = [
      { enemiesKilled: 0, maxEnemies: 3, spawnInterval: 3000 },   // Wave 1: 3 enemies, 3 seconds
      { enemiesKilled: 5, maxEnemies: 4, spawnInterval: 2500 },   // Wave 2: 4 enemies, 2.5 seconds
      { enemiesKilled: 12, maxEnemies: 5, spawnInterval: 2000 },  // Wave 3: 5 enemies, 2 seconds
      { enemiesKilled: 22, maxEnemies: 6, spawnInterval: 1800 },  // Wave 4: 6 enemies, 1.8 seconds
      { enemiesKilled: 35, maxEnemies: 8, spawnInterval: 1500 },  // Wave 5: 8 enemies, 1.5 seconds
      { enemiesKilled: 50, maxEnemies: 10, spawnInterval: 1200 }, // Wave 6: 10 enemies, 1.2 seconds
      { enemiesKilled: 70, maxEnemies: 12, spawnInterval: 1000 }, // Wave 7: 12 enemies, 1 second
      { enemiesKilled: 95, maxEnemies: 15, spawnInterval: 800 },  // Wave 8: 15 enemies, 0.8 seconds
    ];

    // Find current wave based on enemies killed
    let newWave = 1;
    let newMaxEnemies = 3;
    let newSpawnInterval = 3000;

    for (let i = wavesConfig.length - 1; i >= 0; i--) {
      if (enemiesKilled >= wavesConfig[i].enemiesKilled) {
        newWave = i + 1;
        newMaxEnemies = wavesConfig[i].maxEnemies;
        newSpawnInterval = wavesConfig[i].spawnInterval;
        break;
      }
    }

    if (newWave !== currentWave) {
      setCurrentWave(newWave);
      setMaxEnemiesOnScreen(newMaxEnemies);
      setSpawnInterval(newSpawnInterval);
    }
  }, [enemiesKilled, currentWave]);

  // Initialize and update moving starfield
  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      // Initialize starfield if empty
      if (starField.length === 0) {
        const newStars = [];
        for (let i = 0; i < 150; i++) {
          newStars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            speed: Math.random() * 3 + 1, // Speed between 1-4
            brightness: Math.random() * 0.8 + 0.2 // Brightness between 0.2-1.0
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

    // Draw moving starfield
    starField.forEach(star => {
      const alpha = star.brightness;
      const size = star.speed > 2.5 ? 2 : 1; // Faster stars are bigger
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), size, size);
    });

    if (gameState.gameStatus === 'playing') {
      // Draw decorative planets first (background layer)
      gameState.planets.forEach(planet => {
        const planetSprite = images && images.planets[planet.type];
        if (planetSprite) {
          ctx.save();

          // Set opacity for background effect
          ctx.globalAlpha = planet.opacity;

          // Draw planet without rotation, simple rendering
          ctx.drawImage(
            planetSprite,
            planet.position.x,
            planet.position.y,
            planet.width,
            planet.height
          );

          ctx.restore();
        } else {
          // Fallback: Draw colored circle for planet
          ctx.save();
          ctx.globalAlpha = planet.opacity;
          ctx.fillStyle = '#4A90E2'; // Blue color for planets
          ctx.beginPath();
          ctx.arc(
            planet.position.x + planet.width / 2,
            planet.position.y + planet.height / 2,
            planet.width / 2,
            0,
            2 * Math.PI
          );
          ctx.fill();
          ctx.restore();
        }
      });
      // Draw player
      if (images && images.player) {
        ctx.drawImage(
          images.player,
          gameState.player.position.x,
          gameState.player.position.y,
          gameState.player.width,
          gameState.player.height
        );
      } else {
        // Fallback: Draw colored rectangle for player
        ctx.fillStyle = '#00ff00'; // Green for player
        ctx.fillRect(
          gameState.player.position.x,
          gameState.player.position.y,
          gameState.player.width,
          gameState.player.height
        );
        // Add text label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PLAYER', gameState.player.position.x + gameState.player.width/2, gameState.player.position.y - 5);
      }

      // Draw laser bullets with different colors
      gameState.bullets.forEach(bullet => {
        // Determine colors based on bullet type
        let colors = { primary: '#00aaff', mid: '#0088dd', dark: '#0066bb', glow: '#00aaff' }; // Blue default

        if (bullet.color === 'yellow') {
          colors = { primary: '#ffff00', mid: '#dddd00', dark: '#bbbb00', glow: '#ffff00' };
        } else if (bullet.color === 'green') {
          colors = { primary: '#00ff00', mid: '#00dd00', dark: '#00bb00', glow: '#00ff00' };
        } else if (bullet.color === 'red') {
          colors = { primary: '#ff0000', mid: '#dd0000', dark: '#bb0000', glow: '#ff0000' };
        }

        // Create gradient for laser effect
        const gradient = ctx.createLinearGradient(0, bullet.position.y, 0, bullet.position.y + bullet.height);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(0.5, colors.mid);
        gradient.addColorStop(1, colors.dark);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          bullet.position.x,
          bullet.position.y,
          bullet.width,
          bullet.height
        );

        // Add glow effect
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 8;
        ctx.fillRect(
          bullet.position.x,
          bullet.position.y,
          bullet.width,
          bullet.height
        );
        ctx.shadowBlur = 0;
      });

      // Draw enemies
      gameState.enemies.forEach(enemy => {
        const enemySprite = images && images.enemies[enemy.type];
        if (enemySprite) {
          // Add red glow for boss
          if (enemy.type === 'boss') {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
          }

          ctx.drawImage(
            enemySprite,
            enemy.position.x,
            enemy.position.y,
            enemy.width,
            enemy.height
          );

          ctx.shadowBlur = 0;
        } else {
          // Fallback: Draw colored rectangle for enemy
          let color = '#ff0000'; // Red for enemies
          if (enemy.type === 'boss') color = '#ff00ff'; // Magenta for boss
          else if (enemy.type.startsWith('c')) color = '#ffaa00'; // Orange for big enemies

          ctx.fillStyle = color;
          ctx.fillRect(
            enemy.position.x,
            enemy.position.y,
            enemy.width,
            enemy.height
          );

          // Add text label
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(enemy.type.toUpperCase(), enemy.position.x + enemy.width/2, enemy.position.y + enemy.height/2);
        }

        // Draw boss health bar
        if (enemy.type === 'boss') {
          const barWidth = 200;
          const barHeight = 20;
          const barX = CANVAS_WIDTH / 2 - barWidth / 2;
          const barY = 30;
          const healthPercent = enemy.health / 250; // Boss max health is 250

          // Background
          ctx.fillStyle = '#440000';
          ctx.fillRect(barX, barY, barWidth, barHeight);

          // Health bar
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

          // Border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(barX, barY, barWidth, barHeight);

          // Boss label
          ctx.fillStyle = '#ffffff';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('FINAL BOSS', CANVAS_WIDTH / 2, barY - 5);
        }

      });

      // Draw C11 health bars for all C11s (only when they exist)
      const c11Enemies = gameState.enemies.filter(enemy => enemy.type === 'c11');
      c11Enemies.forEach((enemy, index) => {
        const barWidth = 150;
        const barHeight = 16;
        const barX = CANVAS_WIDTH / 2 - barWidth / 2;
        const barY = 60 + (index * 25); // Stack multiple C11 health bars
        const healthPercent = enemy.health / 100; // C11 max health is 100

        // Background
        ctx.fillStyle = '#002200';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health bar
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // C11 label with number if multiple
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        const label = c11Enemies.length > 1 ? `C11 WARSHIP ${index + 1}` : 'C11 WARSHIP';
        ctx.fillText(label, CANVAS_WIDTH / 2, barY - 3);
      });

      // Draw rotating asteroids
      gameState.asteroids.forEach(asteroid => {
        const asteroidSprite = images && images.asteroids[asteroid.type];
        if (asteroidSprite) {
          ctx.save();

          // Move to asteroid center for rotation
          const centerX = asteroid.position.x + asteroid.width / 2;
          const centerY = asteroid.position.y + asteroid.height / 2;
          ctx.translate(centerX, centerY);

          // Apply rotation
          ctx.rotate((asteroid.rotation * Math.PI) / 180);

          // Draw asteroid centered at origin
          ctx.drawImage(
            asteroidSprite,
            -asteroid.width / 2,
            -asteroid.height / 2,
            asteroid.width,
            asteroid.height
          );

          ctx.restore();
        } else {
          // Fallback: Draw colored rectangle for asteroid
          ctx.fillStyle = '#8B4513'; // Brown color for asteroids
          ctx.fillRect(
            asteroid.position.x,
            asteroid.position.y,
            asteroid.width,
            asteroid.height
          );

          // Add text label
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(asteroid.type.toUpperCase(), asteroid.position.x + asteroid.width/2, asteroid.position.y + asteroid.height/2);
        }
      });

      // Draw power-ups
      gameState.powerUps.forEach(powerUp => {
        ctx.save();

        // Pulsing effect based on remaining life
        const alpha = 0.7 + 0.3 * Math.sin((powerUp.life * 5) % (Math.PI * 2));
        ctx.globalAlpha = alpha;

        if (powerUp.type === 'extraLife') {
          // Draw heart for extra life
          ctx.fillStyle = '#ff0080';
          ctx.shadowColor = '#ff0080';
          ctx.shadowBlur = 10;
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('❤️', powerUp.position.x + powerUp.width / 2, powerUp.position.y + powerUp.height / 2 + 8);
        } else if (powerUp.type === 'missiles') {
          // Draw missile symbol for triple shot
          ctx.fillStyle = '#00ff00';
          ctx.shadowColor = '#00ff00';
          ctx.shadowBlur = 10;
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🚀', powerUp.position.x + powerUp.width / 2, powerUp.position.y + powerUp.height / 2 + 6);
        } else if (powerUp.type === 'doubleShot') {
          // Draw double bullet symbol for double shot
          ctx.fillStyle = '#0088ff';
          ctx.shadowColor = '#0088ff';
          ctx.shadowBlur = 10;
          ctx.font = '18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('⚡⚡', powerUp.position.x + powerUp.width / 2, powerUp.position.y + powerUp.height / 2 + 6);
        }

        ctx.restore();
      });

      // Draw explosions on top of everything
      gameState.explosions.forEach(explosion => {
        explosion.particles.forEach(particle => {
          const alpha = particle.life / particle.maxLife;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.color;
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      });

      // Draw score and lives in top left corner of game screen
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;

      // Score display
      ctx.fillText(`Score: ${gameState.score.toLocaleString()}`, 20, 35);

      // Lives display with heart icons
      const heartsText = '❤️'.repeat(gameState.lives);
      ctx.fillText(`Lives: ${heartsText}`, 20, 65);

      // Player health bar
      const healthBarWidth = 200;
      const healthBarHeight = 15;
      const healthBarX = 20;
      const healthBarY = 85;
      const healthPercent = gameState.player.health / 100;

      // Health bar background
      ctx.fillStyle = '#440000';
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

      // Health bar fill
      const healthColor = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000';
      ctx.fillStyle = healthColor;
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

      // Health bar border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

      // Health text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Health: ${gameState.player.health}%`, 20, 120);

      // Missile mode timer display
      if (missileMode && missileModeEndTime > Date.now()) {
        const remainingTime = Math.ceil((missileModeEndTime - Date.now()) / 1000);
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 5;
        ctx.fillText(`🚀 TRIPLE SHOT: ${remainingTime}s`, 20, 95);
        ctx.shadowBlur = 0;
      }

      // Double shot mode timer display
      if (doubleShotMode && doubleShotModeEndTime > Date.now()) {
        const remainingTime = Math.ceil((doubleShotModeEndTime - Date.now()) / 1000);
        const yPosition = missileMode && missileModeEndTime > Date.now() ? 125 : 95; // Stack below triple shot if both active
        ctx.fillStyle = '#0088ff';
        ctx.shadowColor = '#0088ff';
        ctx.shadowBlur = 5;
        ctx.fillText(`⚡ DOUBLE SHOT: ${remainingTime}s`, 20, yPosition);
        ctx.shadowBlur = 0;
      }

      ctx.shadowBlur = 0;

      // Debug overlay
      if (!images) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('IMAGES NOT LOADED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        if (imageError) {
          ctx.font = '14px Arial';
          ctx.fillText(imageError, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        }
      }
    }
  }, [gameState, images, starField, imageError, audioSettings.muteAll, audioSettings.sfxVolume]); // Include audio settings in dependency array

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
    setGameState(prev => ({
      ...prev,
      gameStatus: 'playing',
      score: 0,
      lives: 3,
      bullets: [],
      enemies: [],
      asteroids: [],
      planets: [],
      explosions: [],
      powerUps: [],
      player: {
        ...prev.player,
        position: { x: CANVAS_WIDTH / 2 - 28.125, y: CANVAS_HEIGHT - 112.5 },
        health: 100,
        score: 0
      }
    }));
    setLastShotTime(0);
    setLastEnemySpawn(0);
    setMaxEnemiesOnScreen(3);
    setCurrentWave(1);
    setEnemiesKilled(0);
    setSpawnInterval(3000);
    setStarField([]);
    setSpaceKeyPressed(false);
    setLastBossSpawn(0);
    setBossActive(false);
    setC11Active(false);
    setGameLevel(1);
    setC11Count(0);
    setLevelCompleted({});
    setLastEnemyShoot({});
    setLastAsteroidSpawn(0);
    setLastPlanetSpawn(0);
    setLastExtraLifeScore(0);
    setLastMissileSpawn(0);
    setMissileMode(false);
    setMissileModeEndTime(0);
    setLastDoubleShotSpawn(0);
    setDoubleShotMode(false);
    setDoubleShotModeEndTime(0);
    onGameStateChange?.(true);
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'menu'
    }));
    onGameStateChange?.(false);
  };

  const goToMainMenu = () => {
    // Navigate to dashboard instead of just resetting game
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Score and Lives Display - Always Visible */}
      {gameState.gameStatus === 'playing' && (
        <div className="flex justify-between w-full max-w-4xl px-8 text-white font-futuristic text-xl">
          <div className="flex space-x-8">
            <div>Score: <span className="text-primary font-bold text-2xl">{gameState.score.toLocaleString()}</span></div>
            <div>Lives: <span className="text-secondary font-bold text-2xl">{'❤️'.repeat(gameState.lives)}</span></div>
          </div>
          <div className="flex space-x-6">
            <div>Wave: <span className="text-accent font-bold">{currentWave}</span></div>
            <div>Level: <span className="text-yellow-400 font-bold">{gameLevel}</span></div>
            <div>Enemies: <span className="text-green-400">{gameState.enemies.length}/{maxEnemiesOnScreen}</span></div>
            {gameState.score >= 10000 && gameLevel === 1 && !c11Active && (
              <div className="text-purple-400 animate-bounce font-bold">LEVEL 1 BOSS READY!</div>
            )}
            {gameState.score >= 20000 && gameLevel === 2 && !c11Active && (
              <div className="text-purple-400 animate-bounce font-bold">LEVEL 2 BOSSES READY!</div>
            )}
            {gameState.score >= 30000 && gameLevel === 3 && !c11Active && (
              <div className="text-purple-400 animate-bounce font-bold">LEVEL 3 BOSSES READY!</div>
            )}
            {c11Active && (
              <div className="text-red-600 font-bold animate-pulse text-xl">⚠️ C11 WARSHIPS ACTIVE! ⚠️</div>
            )}
            {bossActive && (
              <div className="text-red-600 font-bold animate-pulse text-xl">⚠️ FINAL BOSS! ⚠️</div>
            )}
          </div>
        </div>
      )}

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
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded">
                <div className="text-center text-white">
                  <h2 className="text-3xl font-futuristic font-bold mb-4 neon-text">SPACE SHOOTER</h2>
                  <p className="mb-6 text-lg">Use WASD or Arrow Keys to move<br />Spacebar to shoot</p>

                  {/* Debug Information */}
                  <div className="mb-4 text-sm">
                    <p>Loading Status: {imagesLoading ? 'Loading...' : 'Complete'}</p>
                    <p>Images Available: {images ? 'Yes' : 'No'}</p>
                    {imageError && <p className="text-red-400">Error: {imageError}</p>}
                    {images && (
                      <div className="text-green-400 text-xs">
                        <p>Player: {images.player ? '✓' : '✗'}</p>
                        <p>Enemies: {Object.keys(images.enemies).filter(key => images.enemies[key as keyof typeof images.enemies]).length}/{Object.keys(images.enemies).length}</p>
                      </div>
                    )}
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded">
                <div className="text-center text-white">
                  <h2 className="text-5xl font-futuristic font-bold mb-6 text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse">
                    GAME OVER
                  </h2>
                  <div className="mb-6 space-y-2">
                    <p className="text-2xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                      Final Score: {gameState.score.toLocaleString()}
                    </p>
                    <p className="text-lg text-gray-300">
                      Wave Reached: {currentWave}
                    </p>
                    <p className="text-lg text-gray-300">
                      Level Reached: {gameLevel}
                    </p>
                    <p className="text-lg text-gray-300">
                      Enemies Destroyed: {enemiesKilled}
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
    </div>
  );
};

export default SpaceShooter;