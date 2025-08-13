export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

export interface QuizGameState {
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  gameStatus: 'playing' | 'finished' | 'paused' | 'game_over';
  selectedAnswer: number | null;
  showResult: boolean;
  timeRemaining: number;
  strikes: number;
  maxStrikes: number;
  points: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  points: number;
}