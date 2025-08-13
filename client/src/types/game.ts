export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Position;
  velocity: Velocity;
  width: number;
  height: number;
}

export interface Player extends GameObject {
  health: number;
  score: number;
}

export interface Bullet extends GameObject {
  damage: number;
  type?: 'player' | 'enemy';
  color?: 'blue' | 'yellow' | 'green' | 'red';
}

export type EnemyType = 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'c8' | 'c9' | 'c10' | 'c11' | 'boss';

export interface Enemy extends GameObject {
  health: number;
  points: number;
  type: EnemyType;
}

export type AsteroidType = 'a1' | 'a2' | 'a3';

export interface Asteroid extends GameObject {
  health: number;
  points: number;
  type: AsteroidType;
  rotation: number;
  rotationSpeed: number;
}

export type PlanetType = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | 'w1' | 'w2' | 'w3' | 'w4' | 'w5';

export interface Planet extends GameObject {
  type: PlanetType;
  scale: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export interface ExplosionParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface Explosion {
  id: string;
  position: Position;
  particles: ExplosionParticle[];
  life: number;
  maxLife: number;
}

export type PowerUpType = 'extraLife' | 'missiles' | 'doubleShot';

export interface PowerUp extends GameObject {
  type: PowerUpType;
  life: number;
  maxLife: number;
}

export interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  asteroids: Asteroid[];
  planets: Planet[];
  explosions: Explosion[];
  powerUps: PowerUp[];
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver';
  score: number;
  lives: number;
  level: number;
}