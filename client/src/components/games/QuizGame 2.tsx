import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { QuizQuestion, QuizGameState, QuizResult } from '@/types/quiz';
import { recordGameSession, calculatePointsFromScore } from '@/utils/gameLeaderboard';

interface QuizGameProps {
  onGameEnd?: (result: QuizResult) => void;
}

const QuizGame: React.FC<QuizGameProps> = ({ onGameEnd }) => {
  const [gameState, setGameState] = useState<QuizGameState>({
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 0,
    gameStatus: 'playing',
    selectedAnswer: null,
    showResult: false,
    timeRemaining: 15,
    strikes: 0,
    maxStrikes: 3,
    points: 0
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const shuffledQuestions = useMemo(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled;
  }, [questions]);

  const currentQuestion = shuffledQuestions[gameState.currentQuestionIndex];
  const progress = (gameState.currentQuestionIndex / shuffledQuestions.length) * 100;

  // Function to record game session to API
  const recordGameSessionToAPI = async (score: number) => {
    try {
      const points = calculatePointsFromScore(score, 4); // Game 4 = Star Atlas Quiz
      const success = await recordGameSession({
        gameId: 4,
        score: score,
        points: points
      });

      if (success) {
        console.log(`Game session recorded successfully: Score ${score}, Points ${points}`);
      } else {
        console.error('Failed to record game session to database');
      }
    } catch (error) {
      console.error('Error recording game session:', error);
    }
  };

  // Load sound effects
  const [gameOverSound, setGameOverSound] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    parseQuizQuestions();
  }, []);

  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.timeRemaining > 0) {
      const newTimer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
      setTimer(newTimer);
      return () => clearTimeout(newTimer);
    } else if (gameState.timeRemaining === 0 && gameState.gameStatus === 'playing') {
      handleTimeUp();
    }
  }, [gameState.timeRemaining, gameState.gameStatus]);

  const parseQuizQuestions = async () => {
    try {
      const response = await fetch('/assets/game4/questions/QuizQuestions.md');
      const text = await response.text();
      const parsed = parseMarkdownQuestions(text);
      setQuestions(parsed);
      setGameState(prev => ({ ...prev, totalQuestions: parsed.length }));
    } catch (error) {
      console.error('Failed to load quiz questions:', error);
    }
  };

  const parseMarkdownQuestions = (markdown: string): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    const lines = markdown.split('\n');
    let currentQuestion: Partial<QuizQuestion> = {};
    let options: Array<{ text: string; isCorrect: boolean }> = [];
    let questionId = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('## Question')) {
        if (currentQuestion.question && options.length > 0) {
          questions.push({
            id: questionId - 1,
            question: currentQuestion.question,
            options: [...options]
          });
        }
        currentQuestion = { id: questionId++ };
        options = [];
      } else if (line.startsWith('**') && line.endsWith('**')) {
        currentQuestion.question = line.slice(2, -2);
      } else if (line.startsWith('- ') || line.startsWith('✅ ')) {
        const isCorrect = line.startsWith('✅');
        const text = line.replace(/^[✅-]\s*/, '');
        if (text) {
          options.push({ text, isCorrect });
        }
      }
    }

    if (currentQuestion.question && options.length > 0) {
      questions.push({
        id: questionId - 1,
        question: currentQuestion.question,
        options: [...options]
      });
    }

    return questions;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (gameState.selectedAnswer !== null || gameState.showResult) return;

    if (timer) clearTimeout(timer);

    const isCorrect = currentQuestion.options[optionIndex].isCorrect;
    const pointsEarned = isCorrect ? 100 + gameState.timeRemaining : 0;

    setGameState(prev => ({
      ...prev,
      selectedAnswer: optionIndex,
      showResult: true,
      score: isCorrect ? prev.score + 1 : prev.score,
      points: prev.points + pointsEarned,
      strikes: isCorrect ? prev.strikes : prev.strikes + 1
    }));

    setTimeout(() => {
      if (!isCorrect && gameState.strikes + 1 >= gameState.maxStrikes) {
        gameOver();
      } else {
        nextQuestion();
      }
    }, 1500);
  };

  const handleTimeUp = () => {
    setGameState(prev => ({
      ...prev,
      showResult: true,
      selectedAnswer: -1,
      timeRemaining: 0,
      strikes: prev.strikes + 1
    }));

    setTimeout(() => {
      if (gameState.strikes + 1 >= gameState.maxStrikes) {
        gameOver();
      } else {
        nextQuestion();
      }
    }, 1500);
  };

  const nextQuestion = () => {
    const nextIndex = gameState.currentQuestionIndex + 1;

    if (nextIndex >= shuffledQuestions.length) {
      finishGame();
    } else {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        selectedAnswer: null,
        showResult: false,
        timeRemaining: 15
      }));
    }
  };

  const gameOver = () => {
    setGameState(prev => ({ ...prev, gameStatus: 'game_over' }));
    const result: QuizResult = {
      score: gameState.score,
      totalQuestions: gameState.currentQuestionIndex + 1,
      percentage: (gameState.score / (gameState.currentQuestionIndex + 1)) * 100,
      passed: false,
      points: gameState.points
    };
    onGameEnd?.(result);
  };

  const finishGame = () => {
    const percentage = (gameState.score / shuffledQuestions.length) * 100;
    const result: QuizResult = {
      score: gameState.score,
      totalQuestions: shuffledQuestions.length,
      percentage,
      passed: percentage >= 70,
      points: gameState.points
    };

    setGameState(prev => ({ ...prev, gameStatus: 'finished' }));
    recordGameSessionToAPI(gameState.score);
    onGameEnd?.(result);
  };

  const restartGame = () => {
    setGameState({
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: shuffledQuestions.length,
      gameStatus: 'playing',
      selectedAnswer: null,
      showResult: false,
      timeRemaining: 15,
      strikes: 0,
      maxStrikes: 3,
      points: 0
    });
  };

  const getScoreColor = () => {
    const percentage = (gameState.score / shuffledQuestions.length) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (gameState.gameStatus === 'finished' || gameState.gameStatus === 'game_over') {
    const isGameOver = gameState.gameStatus === 'game_over';
    const questionsAnswered = isGameOver ? gameState.currentQuestionIndex + 1 : shuffledQuestions.length;
    const percentage = (gameState.score / questionsAnswered) * 100;

    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className={`text-2xl ${isGameOver ? 'text-red-400' : 'text-blue-400'}`}>
            {isGameOver ? 'GAME OVER!' : 'Quiz Complete!'}
          </CardTitle>
          {isGameOver && (
            <p className="text-gray-400 mt-2">You missed 3 questions!</p>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-6xl font-bold mb-4 text-blue-400">
            {gameState.points.toLocaleString()}
          </div>
          <div className="text-lg text-gray-300">
            <span className="text-white">{gameState.score}</span>
            <span className="text-gray-400">/{questionsAnswered} correct</span>
            <span className="text-gray-400 ml-4">({percentage.toFixed(1)}%)</span>
          </div>
          {!isGameOver && (
            <Badge 
              variant={percentage >= 70 ? "default" : "destructive"}
              className="text-lg px-4 py-2"
            >
              {percentage >= 70 ? "PASSED" : "FAILED"}
            </Badge>
          )}
          {isGameOver && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              GAME OVER
            </Badge>
          )}
          <div className="space-y-2">
            <Button 
              onClick={restartGame}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Question {gameState.currentQuestionIndex + 1} of {shuffledQuestions.length}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {Array.from({ length: gameState.maxStrikes }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < gameState.strikes ? 'bg-red-500' : 'bg-gray-600'
                }`}
              />
            ))}
            <span className="text-sm text-gray-400 ml-2">Strikes</span>
          </div>
          <div className={`text-lg font-bold ${gameState.timeRemaining <= 10 ? 'text-red-400' : 'text-blue-400'}`}>
            {gameState.timeRemaining}s
          </div>
          <div className="text-sm text-gray-400">
            Points: <span className="text-blue-400 font-bold">{gameState.points.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl text-white leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let buttonClass = "w-full text-left p-4 rounded-lg border transition-all duration-200 ";

            if (gameState.showResult) {
              if (gameState.selectedAnswer === index) {
                if (option.isCorrect) {
                  buttonClass += "bg-green-900 border-green-600 text-green-100";
                } else {
                  buttonClass += "bg-red-900 border-red-600 text-red-100";
                }
              } else {
                buttonClass += "bg-gray-800 border-gray-600 text-gray-400";
              }
            } else {
              buttonClass += "bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={gameState.showResult}
                className={buttonClass}
              >
                <span className="block">{option.text}</span>
              </button>
            );
          })}

          {gameState.showResult && gameState.selectedAnswer !== null && gameState.selectedAnswer !== -1 && currentQuestion.options[gameState.selectedAnswer]?.isCorrect && (
            <div className="text-center mt-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
              <div className="text-green-400 font-bold text-lg">
                +{(100 + gameState.timeRemaining).toLocaleString()} Points!
              </div>
              <div className="text-green-300 text-sm">
                100 base + {gameState.timeRemaining} time bonus
              </div>
            </div>
          )}
        </CardContent>
        <div className="flex justify-center p-4">
          <img 
            src="/assets/game4/SA-PBTP-White.svg" 
            alt="Star Atlas Logo" 
            className="h-8 opacity-60"
          />
        </div>
      </Card>
    </div>
  );
};

export default QuizGame;