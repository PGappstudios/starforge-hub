export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment {
  id: string;
  position: Position;
  rotation: number;
}

export interface Snake {
  segments: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type ResourceType = 'ammo' | 'food' | 'fuel' | 'tool';

export interface Resource {
  id: string;
  position: Position;
  type: ResourceType;
  points: number;
  collected: boolean;
  spawnTime: number;
  lifespan: number;
}

export type SnakeEnemyType = 'e1' | 'e2' | 'e4' | 'e6' | 'c8' | 'c9' | 'c11';

export interface SnakeEnemy {
  id: string;
  position: Position;
  type: SnakeEnemyType;
  spawnTime: number;
  lifespan: number; // 6 seconds
  active: boolean;
}

export interface SnakeGameState {
  snake: Snake;
  resources: Resource[];
  enemies: SnakeEnemy[];
  score: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver';
  gameSpeed: number;
  lastMoveTime: number;
  collectedResources: Set<ResourceType>;
}

export interface LoadedSnakeImages {
  player: HTMLImageElement;
  resources: {
    ammo: HTMLImageElement;
    food: HTMLImageElement;
    fuel: HTMLImageElement;
    tool: HTMLImageElement;
  };
  enemies: {
    e1: HTMLImageElement;
    e2: HTMLImageElement;
    e4: HTMLImageElement;
    e6: HTMLImageElement;
    c8: HTMLImageElement;
    c9: HTMLImageElement;
    c11: HTMLImageElement;
  };
}