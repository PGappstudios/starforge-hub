import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coins, AlertTriangle } from 'lucide-react';
import MazeGame from '@/components/games/MazeGame';
import { CargoGameResult } from '@/types/maze';
import { useCredits } from '@/contexts/CreditsContext';
import { useGameResults } from '@/hooks/useGameResults';

interface Props {
  children: ReactNode;
  onError: (error: string) => void;
}

interface State {
  hasError: boolean;
}

class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game6 Error:', error, errorInfo);
    this.props.onError(`Game failed to load: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

const Game6 = () => {
  console.log('Game6 component rendering...');
  
  const [gameResult, setGameResult] = useState<CargoGameResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const { credits, canAfford, spendCredits } = useCredits();
  const { submitGameResult } = useGameResults();
  
  const GAME_COST = 1;

  const handleGameEnd = (result: CargoGameResult) => {
    console.log('Cargo game ended with result:', result);
    setGameResult(result);
    
    if (hasPlayedGame) {
      // Submit score to leaderboard
      if (result.score > 0) {
        submitGameResult(result.score, 'game6');
      }
    }
  };

  const handleGameStateChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (playing && !hasPlayedGame) {
      setHasPlayedGame(true);
      spendCredits(GAME_COST, 'Cargo Runner - Game Started');
    }
  };

  return (
    <div className={`min-h-screen ${isPlaying ? 'bg-black' : 'cosmic-bg'}`}>
      {!isPlaying && (
        <div className="max-w-6xl mx-auto p-4">
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Game Hub
              </Button>
            </Link>
            {/* Credit Status */}
            <div className="text-center mb-6">
              <Badge variant="outline" className="text-white border-white/50 bg-white/10">
                <Coins className="w-4 h-4 mr-2" />
                Credits: {credits}
              </Badge>
            </div>

            {/* Insufficient Credits Warning */}
            {!canAfford(GAME_COST) && (
              <Card className="max-w-md mx-auto mb-8 bg-red-900/20 border-red-500/50">
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <h3 className="text-xl font-bold text-red-400 mb-2">Insufficient Credits</h3>
                  <p className="text-red-300 mb-4">
                    You need {GAME_COST} credit to play this game. You currently have {credits} credits.
                  </p>
                  <p className="text-sm text-red-200">
                    Earn more credits by completing other games or challenges!
                  </p>
                </CardContent>
              </Card>
            )}
            
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Cargo Runner</h1>
              <p className="text-gray-300 mb-4">Collect valuable cargo and deliver it to the CSS station</p>
              <div className="flex justify-center gap-4 mb-4">
                <Badge variant="outline" className="text-orange-400 border-orange-400">
                  <Coins className="w-4 h-4 mr-2" />
                  Cost: {GAME_COST} Credit
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Area - Always Visible */}
      <div className={`flex justify-center ${isPlaying ? 'min-h-screen items-center' : ''}`}>
        {isPlaying && (
          <div className="absolute inset-0 bg-black">
            {/* Full-screen starfield */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 200 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-px h-px bg-white opacity-60"
                  style={{
                    left: `${(i * 73) % 100}%`,
                    top: `${(i * 37) % 100}%`,
                    animationDelay: `${(i * 0.1) % 3}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {canAfford(GAME_COST) ? (
          gameError ? (
            <Card className="max-w-md mx-auto bg-red-800/20 border-red-600/50">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <h3 className="text-xl font-bold text-red-400 mb-2">Game Error</h3>
                <p className="text-red-300 mb-4">{gameError}</p>
                <Button 
                  onClick={() => setGameError(null)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <GameErrorBoundary onError={setGameError}>
              <MazeGame 
                onGameEnd={handleGameEnd} 
                onGameStateChange={handleGameStateChange}
              />
            </GameErrorBoundary>
          )
        ) : (
          <Card className="max-w-md mx-auto bg-gray-800/50 border-gray-600">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-300">
                You need {GAME_COST} credit to play this cargo runner game.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {!isPlaying && gameResult && (
        <div className="max-w-6xl mx-auto p-4">
          <Card className="mt-6 bg-gray-800/50 border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-center text-purple-400">
                🏆 Mission Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">{gameResult.score}</div>
                  <div className="text-sm text-gray-400">Final Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{gameResult.deliveryCount}</div>
                  <div className="text-sm text-gray-400">Deliveries Made</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{gameResult.itemsCollected}/{gameResult.totalItems}</div>
                  <div className="text-sm text-gray-400">Items Collected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.floor(gameResult.timeElapsed / 60)}:{(gameResult.timeElapsed % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-400">Mission Time</div>
                </div>
              </div>

              {/* Cargo Information */}
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3 text-center">Cargo Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-orange-400">{gameResult.heavyItemsCollected}</div>
                    <div className="text-sm text-gray-400">Heavy Items (3kg)</div>
                    <div className="text-xs text-gray-500">ARCO, DIAMOND, ROCH</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-cyan-400">{gameResult.lightItemsCollected}</div>
                    <div className="text-sm text-gray-400">Light Items (1kg)</div>
                    <div className="text-xs text-gray-500">All other cargo types</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-pink-400">{gameResult.totalWeight}kg</div>
                    <div className="text-sm text-gray-400">Total Weight Delivered</div>
                    <div className="text-xs text-gray-500">Combined cargo mass</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3 text-center">Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-orange-400">{Math.round(gameResult.efficiency * 100)}%</div>
                    <div className="text-sm text-gray-400">Delivery Efficiency</div>
                    <div className="text-xs text-gray-500">Items delivered vs collected</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-indigo-400">
                      {gameResult.totalItems > 0 ? Math.round((gameResult.score / gameResult.totalItems)) : 0}
                    </div>
                    <div className="text-sm text-gray-400">Points per Item</div>
                    <div className="text-xs text-gray-500">Average score efficiency</div>
                  </div>
                </div>
              </div>

              {/* Detailed Item Breakdown */}
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3 text-center">Cargo Manifest</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 text-center text-xs">
                  {Object.entries(gameResult.itemBreakdown).map(([itemType, count]) => (
                    count > 0 && (
                      <div key={itemType} className="bg-gray-700/20 rounded p-2">
                        <div className="font-bold text-white">{itemType}</div>
                        <div className="text-gray-300">x{count}</div>
                        <div className="text-gray-500">{count * (itemType === 'ARCO' || itemType === 'DIAMOND' || itemType === 'ROCH' ? 3 : 1)}kg</div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Game Rules Information */}
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3 text-center">Mission Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <h4 className="font-semibold text-orange-400 mb-2">Heavy Cargo (3kg each):</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• ARCO - Advanced Resource Container</li>
                      <li>• DIAMOND - Precious Mineral Crystal</li>
                      <li>• ROCH - Rare Organic Compound</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">Light Cargo (1kg each):</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• SDU, CARBON, POLYMER - Basic materials</li>
                      <li>• PWRSRC, ENRGSUB - Energy components</li>
                      <li>• CRYSLAT, LUMAN - Refined elements</li>
                      <li>• And other specialized cargo types</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="inline-block bg-purple-600/20 border border-purple-600/50 rounded-lg p-3">
                    <div className="text-purple-400 font-bold">Cargo Bay Limit: 3kg total capacity</div>
                    <div className="text-sm text-purple-300">Strategic planning required for optimal efficiency</div>
                  </div>
                </div>
              </div>

              {gameResult.perfectDelivery && (
                <div className="mt-4 p-4 bg-yellow-600/20 border border-yellow-600/50 rounded-lg text-center">
                  <div className="text-yellow-400 font-bold text-lg">🌟 Perfect Mission Complete!</div>
                  <div className="text-sm text-yellow-300 mt-1">All cargo successfully delivered to CSS station</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Game6;