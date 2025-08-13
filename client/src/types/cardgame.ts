export interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number; // Numeric value for game logic
  isVisible: boolean;
  isSelected: boolean;
  position: { x: number; y: number };
}

export interface CardGameState {
  deck: Card[];
  playerHand: Card[];
  dealerHand?: Card[];
  gameField: Card[];
  score: number;
  level: number;
  lives: number;
  gameStatus: 'instructions' | 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';
  timeRemaining: number;
  moves: number;
  combo: number;
}

export interface CardGameResult {
  completed: boolean;
  score: number;
  level: number;
  timeElapsed: number;
  moves: number;
  perfectGame: boolean;
}

export interface CardGameProps {
  onGameEnd?: (result: CardGameResult) => void;
}