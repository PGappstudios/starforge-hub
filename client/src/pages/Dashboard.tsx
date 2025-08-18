import { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import FactionAvatar from "@/components/FactionAvatar";
import AuthForm from "@/components/AuthForm";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Trophy, Star, Zap, Coins } from "lucide-react";
import { useCredits } from "@/contexts/CreditsContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMusic } from "@/hooks/usePageMusic";

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const credits = user?.credits || 0;
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [gameStats, setGameStats] = useState<Array<{ gameId: number; gameName: string; bestScore: number; totalPoints: number; gamesPlayed: number }>>([]);

  // Fetch user's game breakdown for accurate point display
  useEffect(() => {
    const fetchGameStats = async () => {
      if (user) {
        try {
          console.log('Fetching game stats for user:', user.id);
          const response = await fetch(`/api/user/${user.id}/game-breakdown`);
          if (response.ok) {
            const stats = await response.json();
            console.log('Game stats received:', stats);
            setGameStats(stats);
          } else {
            console.error('Failed to fetch game stats:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching game stats:', error);
        }
      }
    };

    fetchGameStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="text-white text-xl font-futuristic">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navigation />
        <AuthForm
          onAuthSuccess={() => {
            setShowAuthForm(false);
            // User will be automatically redirected after successful auth
          }}
          onClose={() => {
            // Allow guest access by not doing anything
            setShowAuthForm(false);
          }}
        />
      </div>
    );
  }

  // Calculate user rank based on total points (simple ranking system)
  const calculateRank = (totalPoints?: number | null) => {
    if (!totalPoints || totalPoints < 100) return "Rookie";
    if (totalPoints < 500) return "Explorer";
    if (totalPoints < 1000) return "Veteran";
    if (totalPoints < 2000) return "Elite";
    return "Legend";
  };

  // Get real game statistics from user data
  const getGameStats = (gameId: number) => {
    // TODO: Implement gameStats fetching from gameSessions/gameLeaderboards if needed
    return {
      points: 0,
      lastPlayed: "Never"
    };
  };

  const games = [
    { id: 1, name: "Cosmic Battle Arena", description: "Engage in epic space battles across the galaxy", ...getGameStats(1) },
    { id: 2, name: "Stellar Mining", description: "Extract valuable resources from asteroids", ...getGameStats(2) },
    { id: 3, name: "Space Traders", description: "Navigate cosmic trade routes and markets", ...getGameStats(3) },
    { id: 4, name: "Lore Master", description: "Test your knowledge of the Star Atlas universe", ...getGameStats(4) },
    { id: 5, name: "Star Seekers Puzzle", description: "Solve challenging puzzles in space", ...getGameStats(5) },
    { id: 6, name: "Cargo Runner", description: "Manage cargo and logistics across star systems", ...getGameStats(6) },
  ];

  return (
    <div className="min-h-screen cosmic-bg">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <FactionAvatar faction={user.faction || "oni"} size="lg" />
            <div>
              <h1 className="text-3xl font-futuristic font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                Welcome, {user.username}
              </h1>
              <p className="text-white capitalize drop-shadow-[0_0_5px_rgba(255,255,255,0.4)] font-medium">
                {user.faction || "No Faction"} • {calculateRank(user.totalPoints)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="font-futuristic text-lg px-4 py-2">
              <Coins className="w-4 h-4 mr-2" />
              {credits} Credits
            </Badge>
            <Badge variant="secondary" className="font-futuristic text-lg px-4 py-2">
              <Trophy className="w-4 h-4 mr-2" />
              {user.totalPoints} Points
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-lg transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 text-center">
            <CardContent className="pt-6">
              <Coins className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">{credits}</div>
              <div className="text-sm text-white font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Credits</div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-lg transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 text-center">
            <CardContent className="pt-6">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">{user.totalPoints}</div>
              <div className="text-sm text-white font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Total Points</div>
            </CardContent>
          </Card>
        </div>

        {/* Games Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-futuristic font-bold mb-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">Your Games</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => {
            // Get user's best points for this game from leaderboard data
            const userGameStats = gameStats?.find(stat => stat.gameId === index + 1);
            const gamePoints = userGameStats?.totalPoints || 0;

            return (
            <Card key={game.id} className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 hover:scale-105 flex flex-col h-full">
              <CardHeader className="flex-grow">
                <CardTitle className="font-futuristic text-lg text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">{game.name}</CardTitle>
                <p className="text-white font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">{game.description}</p>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex justify-center mb-4">
                  <Link to={`/game${game.id}`}>
                    <Button className="w-full nav-button">
                      Play Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            );
          })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h3 className="text-xl font-futuristic font-bold mb-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">Quick Actions</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/dice-of-iris">
              <Button variant="outline" className="nav-button">
                <Coins className="w-4 h-4 mr-2" />
                Earn Credits
              </Button>
            </Link>
            <Link to="/credits">
              <Button variant="outline" className="nav-button">
                <Star className="w-4 h-4 mr-2" />
                Buy Credits
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" className="nav-button">
                <Trophy className="w-4 h-4 mr-2" />
                View Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;