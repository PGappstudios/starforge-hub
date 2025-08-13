export interface MemoryCard {
  id: string;
  imageUrl: string;
  imageName: string;
  isFlipped: boolean;
  isMatched: boolean;
  pairId: string;
}

export interface MemoryGameState {
  cards: MemoryCard[];
  flippedCards: string[];
  matchedPairs: number;
  moves: number;
  timeRemaining: number;
  gameStatus: 'ready' | 'playing' | 'paused' | 'won' | 'lost' | 'levelComplete';
  score: number;
  level: number;
  maxTimeForLevel: number;
}

export interface MemoryGameStats {
  moves: number;
  timeRemaining: number;
  matchedPairs: number;
  totalPairs: number;
  score: number;
}