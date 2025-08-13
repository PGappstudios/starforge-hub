export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

// Cargo Item Types based on game6 assets
export type CargoItemType = 
  // Heavy items (weight 3)
  | 'ARCO' | 'DIAMOND' | 'ROCH'
  // Light items (weight 1)  
  | 'SDU' | 'AGEL' | 'CARBON' | 'CRYSLAT' | 'ENRGSUB' | 'FSTAB' 
  | 'HYG' | 'IC3A' | 'LUMAN' | 'NITRO' | 'POLYMER' | 'PRTACL' 
  | 'PWRSRC' | 'RADABS';

export interface CargoItemDefinition {
  type: CargoItemType;
  weight: number;
  points: number;
  fileName: string;
}

export interface CargoItem {
  id: string;
  type: CargoItemType;
  position: Position;
  weight: number;
  points: number;
  collected: boolean;
  animationPhase: number;
}

export interface CargoManifest {
  items: CargoItem[];
  totalWeight: number;
  maxCapacity: number;
}

export interface CSSStation {
  id: string;
  position: Position;
  radius: number;
  animationPhase: number;
  deliveredItems: CargoItem[];
  totalDeliveries: number;
}

export interface CargoPlayer {
  id: string;
  position: Position;
  direction: Direction;
  rotation: number;
  speed: number;
  isMoving: boolean;
  cargo: CargoManifest;
  score: number;
  deliveryCount: number;
}

export interface CargoParticle {
  id: string;
  position: Position;
  velocity: Position;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface CargoEnemy {
  id: string;
  position: Position;
  direction: Direction;
  speed: number;
  detectionRadius: number;
  isChasing: boolean;
  targetPosition?: Position;
  animationPhase: number;
  active: boolean;
  lastMoveTime: number;
  patrolPoints: Position[];
  currentPatrolIndex: number;
  stuckCounter?: number;
}

export interface CargoGameState {
  player: CargoPlayer;
  availableItems: CargoItem[];
  cssStation: CSSStation;
  enemies: CargoEnemy[];
  particles: CargoParticle[];
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver' | 'levelComplete' | 'timeUp' | 'gameComplete';
  score: number;
  totalItems: number;
  collectedItems: number;
  deliveredItems: number;
  gameTime: number;
  levelStartTime: number;
  killedEnemies: number;
  timeRemaining: number; // In seconds
  gameDuration: number; // Total game duration in seconds (300 = 5 minutes)
  currentLevel: number; // Current level (1-7)
  totalLevels: number; // Total number of levels
}

export interface CargoGameResult {
  score: number;
  timeElapsed: number;
  itemsCollected: number;
  totalItems: number;
  deliveryCount: number;
  perfectDelivery: boolean; // All items delivered
  efficiency: number; // Ratio of deliveries to pickups
  heavyItemsCollected: number; // ARCO, DIAMOND, ROCH
  lightItemsCollected: number; // All other items
  totalWeight: number; // Total weight of all items collected
  itemBreakdown: Record<CargoItemType, number>; // Count of each item type collected
}

export const CARGO_CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,
  PLAYER_SPEED: 120,
  MAX_CARGO_WEIGHT: 3,
  CSS_RADIUS: 60,
  PICKUP_RADIUS: 25,
  
  // Enemy configuration
  ENEMY_COUNT: 8,
  ENEMY_SPEED: 90,
  ENEMY_DETECTION_RADIUS: 150,
  ENEMY_SIZE: 48,
  
  // Time and scoring configuration
  GAME_DURATION: 300, // 5 minutes in seconds
  POINTS_PER_DELIVERY: 100, // Points per item delivered to CSS
  TIME_BONUS_MULTIPLIER: 10, // Points per remaining second
  
  // Level progression configuration
  TOTAL_LEVELS: 7, // Number of levels in the game
  BASE_ENEMY_COUNT: 8, // Starting number of enemies in level 1
  ENEMIES_PER_LEVEL: 2, // Additional enemies per level
  
  // Item definitions with weights and points (legacy, now using POINTS_PER_DELIVERY)
  ITEM_DEFINITIONS: {
    // Heavy items (weight 3)
    ARCO: { weight: 3, points: 100, fileName: 'ARCO.png' },
    DIAMOND: { weight: 3, points: 100, fileName: 'DIAMOND.png' },
    ROCH: { weight: 3, points: 100, fileName: 'ROCH.png' },
    
    // Light items (weight 1)
    SDU: { weight: 1, points: 100, fileName: 'SDU.png' },
    AGEL: { weight: 1, points: 100, fileName: 'AGEL-57k3FPK3Uq1Vrp02.png' },
    CARBON: { weight: 1, points: 100, fileName: 'CARBON.png' },
    CRYSLAT: { weight: 1, points: 100, fileName: 'CRYSLAT.png' },
    ENRGSUB: { weight: 1, points: 100, fileName: 'ENRGSUB.png' },
    FSTAB: { weight: 1, points: 100, fileName: 'FSTAB-uG0HGWxwZeOsKidv.png' },
    HYG: { weight: 1, points: 100, fileName: 'HYG.png' },
    IC3A: { weight: 1, points: 100, fileName: 'IC3A.png' },
    LUMAN: { weight: 1, points: 100, fileName: 'LUMAN.png' },
    NITRO: { weight: 1, points: 100, fileName: 'NITRO-wmxKLSXK8vkZc9IY.png' },
    POLYMER: { weight: 1, points: 100, fileName: 'POLYMER.png' },
    PRTACL: { weight: 1, points: 100, fileName: 'PRTACL.png' },
    PWRSRC: { weight: 1, points: 100, fileName: 'PWRSRC.png' },
    RADABS: { weight: 1, points: 100, fileName: 'RADABS.png' }
  } as Record<CargoItemType, { weight: number; points: number; fileName: string }>
};