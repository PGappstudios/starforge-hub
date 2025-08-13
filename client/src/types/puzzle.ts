export interface PuzzlePiece {
  id: number;
  currentPosition: number;
  correctPosition: number;
  imageData: string;
  isEmpty: boolean;
}

export interface PuzzleGameState {
  pieces: PuzzlePiece[];
  moves: number;
  timeElapsed: number;
  gameStatus: 'menu' | 'loading' | 'preview' | 'playing' | 'completed' | 'error';
  previewTimeLeft: number;
  selectedImage: string;
  isShuffling: boolean;
  gameStartTime: number;
  selectedPiece: number | null;
  error?: string;
}

export interface PuzzleResult {
  completed: boolean;
  moves: number;
  timeElapsed: number;
  score: number;
  perfectGame: boolean;
}

export interface ImageInfo {
  name: string;
  path: string;
}