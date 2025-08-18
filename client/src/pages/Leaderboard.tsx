import Navigation from "@/components/Navigation";
import FactionAvatar from "@/components/FactionAvatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Calendar, Clock, Globe, GamepadIcon, Users, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import AuthForm from "@/components/AuthForm";

interface LeaderboardEntry {
  id: number;
  userId: number;
  score: number;
  points: number;
  user: {
    id: number;
    username: string;
    faction: "oni" | "mud" | "ustur" | null;
    totalPoints: number;
    gamesPlayed: number;
  };
  rank?: number;
}

interface GlobalLeaderboardEntry {
  id: number;
  userId: number;
  totalPoints: number;
  gamesPlayed: number;
  user: {
    id: number;
    username: string;
    faction: "oni" | "mud" | "ustur" | null;
  };
  rank?: number;
}


const GAMES_CONFIG = {
  1: { name: "Cosmic Battle Arena", description: "Engage in epic space battles across the galaxy" },
  2: { name: "Stellar Mining", description: "Extract valuable resources from asteroids" },
  3: { name: "Space Traders", description: "Navigate cosmic trade routes and markets" },
  4: { name: "Lore Master", description: "Test your knowledge of the Star Atlas universe" },
  5: { name: "Star Seekers Puzzle", description: "Solve challenging puzzles in space" },
  6: { name: "Cargo Runner", description: "Manage cargo and logistics across star systems" },
} as const;

const Leaderboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedGame, setSelectedGame] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'global' | 'games'>('global');
  const [showAuthForm, setShowAuthForm] = useState(false);

  // Show auth form if user is not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthForm(true);
    } else {
      setShowAuthForm(false); // Hide form if user authenticates
    }
  }, [isAuthenticated]);

  // Helper to safely parse JSON or return empty array on error
  const safeJsonParse = async (response: Response) => {
    if (!response.ok) {
      console.warn(`HTTP error: ${response.status} ${response.statusText}`);
      return [];
    }
    try {
      const data = await response.json();
      // Ensure data is an array, even if API returns single object or null
      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch (error) {
      console.warn('JSON parsing error:', error);
      return []; // Return empty array if parsing fails
    }
  };

  // Fetch global leaderboard
  const { data: globalLeaderboard, isLoading: globalLoading, error: globalError } = useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn: async (): Promise<GlobalLeaderboardEntry[]> => {
      const response = await fetch('/api/leaderboard/global?limit=50', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await safeJsonParse(response);
      return data.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      }));
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Fetch game leaderboards
  const { data: monthlyLeaderboard, isLoading: monthlyLoading, error: monthlyError } = useQuery({
    queryKey: ['leaderboard', 'game', selectedGame, 'monthly'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const response = await fetch(`/api/leaderboard/game/${selectedGame}?type=monthly&limit=50`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await safeJsonParse(response);
      return data.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      }));
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  const { data: yearlyLeaderboard, isLoading: yearlyLoading, error: yearlyError } = useQuery({
    queryKey: ['leaderboard', 'game', selectedGame, 'yearly'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const response = await fetch(`/api/leaderboard/game/${selectedGame}?type=yearly&limit=50`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await safeJsonParse(response);
      return data.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      }));
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });


  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-2xl font-futuristic font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
        2: "bg-gray-500/20 text-gray-400 border-gray-500/50",
        3: "bg-amber-600/20 text-amber-400 border-amber-600/50"
      };
      return colors[rank as keyof typeof colors];
    }
    return "bg-muted/50 text-muted-foreground border-muted";
  };

  const renderGlobalLeaderboardEntry = (entry: GlobalLeaderboardEntry, compact = false) => (
    <div
      key={entry.id}
      className={`flex items-center gap-4 ${compact ? 'p-3' : 'p-4'} rounded-lg border transition-all duration-200 bg-black/10 border-white/10 hover:bg-black/20 ${
        entry.user.username === user?.username ? 'bg-primary/10 border-primary/40 neon-glow' : ''
      }`}
    >
      {/* Rank */}
      <div className={`flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-12 h-12'}`}>
        {entry.rank && entry.rank <= 3 ? (
          getRankIcon(entry.rank)
        ) : (
          <span className={`font-futuristic font-bold text-muted-foreground ${
            compact ? 'text-lg' : 'text-xl'
          }`}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <FactionAvatar faction={entry.user.faction} size={compact ? "sm" : "md"} />

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-futuristic font-bold truncate ${
            compact ? 'text-base' : 'text-lg'
          }`}>
            {entry.user.username}
          </h3>
          {entry.user.username === user?.username && (
            <Badge variant="default" className="text-xs">YOU</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-xs">
            {entry.user.faction || 'No Faction'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {entry.gamesPlayed} games played
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className={`font-futuristic font-bold text-primary ${
          compact ? 'text-xl' : 'text-2xl'
        }`}>
          {entry.totalPoints.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">
          total score
        </div>
      </div>
    </div>
  );

  const renderGameLeaderboardEntry = (entry: LeaderboardEntry, compact = false) => {
    // Defensive check for missing user data
    if (!entry.user) {
      console.warn('Leaderboard entry missing user data:', entry);
      return null;
    }

    return (
      <div
        key={entry.id}
        className={`flex items-center gap-4 ${compact ? 'p-3' : 'p-4'} rounded-lg border transition-all duration-200 bg-black/10 border-white/10 hover:bg-black/20 ${
          entry.user.username === user?.username ? 'bg-primary/10 border-primary/40 neon-glow' : ''
        }`}
    >
      {/* Rank */}
      <div className={`flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-12 h-12'}`}>
        {entry.rank && entry.rank <= 3 ? (
          getRankIcon(entry.rank)
        ) : (
          <span className={`font-futuristic font-bold text-muted-foreground ${
            compact ? 'text-lg' : 'text-xl'
          }`}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <FactionAvatar faction={entry.user.faction} size={compact ? "sm" : "md"} />

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-futuristic font-bold truncate ${
            compact ? 'text-base' : 'text-lg'
          }`}>
            {entry.user.username}
          </h3>
          {entry.user.username === user?.username && (
            <Badge variant="default" className="text-xs">YOU</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-xs">
            {entry.user.faction || 'No Faction'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {entry.points} pts
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className={`font-futuristic font-bold text-primary ${
          compact ? 'text-xl' : 'text-2xl'
        }`}>
          {entry.score.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">
          best score
        </div>
      </div>
    </div>
    );
  };

  const renderTop3Podium = (entries: (GlobalLeaderboardEntry | LeaderboardEntry)[], isGlobal = false) => {
    if (entries.length < 3) return null;

    return (
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {entries.slice(0, 3).map((entry, index) => (
          <Card key={entry.id || entry.user.id || index} className={`bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 text-center`}>
            <CardHeader>
              <div className="flex justify-center mb-4">
                {getRankIcon(entry.rank || index + 1)}
              </div>
              <div className="flex justify-center mb-4">
                <FactionAvatar faction={entry.user.faction} size="lg" />
              </div>
              <CardTitle className="font-futuristic text-xl">{entry.user.username}</CardTitle>
              <Badge variant="outline" className={`${getRankBadge(entry.rank || index + 1)} font-futuristic`}>
                Rank #{entry.rank || index + 1}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-futuristic font-bold text-primary">
                  {isGlobal
                    ? (entry as GlobalLeaderboardEntry).totalPoints.toLocaleString()
                    : (entry as LeaderboardEntry).score.toLocaleString()
                  }
                </div>
                <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">
                  {isGlobal ? 'Total Score' : 'Best Score'}
                </div>
                {isGlobal && (
                  <div className="text-lg font-semibold">
                    {(entry as GlobalLeaderboardEntry).gamesPlayed} Games
                  </div>
                )}
                {!isGlobal && (
                  <div className="text-lg font-semibold">
                    {(entry as LeaderboardEntry).points} Score
                  </div>
                )}
                <Badge variant="secondary" className="capitalize">
                  {entry.user.faction || 'No'} Faction
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };


  const isEmpty = !globalLoading && !monthlyLoading && !yearlyLoading &&
                  !globalLeaderboard?.length && !monthlyLeaderboard?.length && !yearlyLeaderboard?.length;

  return (
    <div className="min-h-screen cosmic-bg">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {showAuthForm && !user ? (
          <div className="flex justify-center items-center h-[70vh]">
            <AuthForm 
              onAuthSuccess={() => setShowAuthForm(false)}
              onClose={() => setShowAuthForm(false)}
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-futuristic font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent neon-text mb-4">
                GALACTIC LEADERBOARDS
              </h1>
              <p className="text-xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] font-medium">
                Champions across all cosmic realms and time
              </p>
            </div>

              {/* Discord Invite */}
              <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 max-w-2xl mx-auto">
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-white mb-4 font-medium">
                      Want to join tournaments and win rewards? Connect with the community on our Discord.
                    </p>
                    <a
                      href="https://discord.gg/AQhazUGaBA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-button inline-flex items-center gap-2"
                    >
                      Join our Discord
                    </a>
                  </CardContent>
                </Card>

            {/* Main Navigation */}
            <div className="flex justify-center mb-8">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'global' | 'games')} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="global" className="font-futuristic flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Global Hall of Fame
                  </TabsTrigger>
                  <TabsTrigger value="games" className="font-futuristic flex items-center gap-2">
                    <GamepadIcon className="w-4 h-4" />
                    Game Leaderboards
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Empty State */}
            {isEmpty && !globalLoading && !monthlyLoading && !yearlyLoading && (
              <div className="text-center mb-16">
                <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 max-w-2xl mx-auto">
                  <CardContent className="pt-8 pb-8">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                    <h3 className="text-2xl font-futuristic font-bold text-white mb-4">
                      No Champions Yet
                    </h3>
                    <p className="text-white/70 mb-6">
                      Be the first to play games and earn your place in the galactic leaderboards!
                    </p>
                    <Badge variant="outline" className="font-futuristic">
                      Start playing to see rankings
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Global Leaderboard */}
            {activeTab === 'global' && (
              <div className="mb-16">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-futuristic font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] mb-2 flex items-center justify-center gap-3">
                    <Globe className="w-8 h-8 text-primary" />
                    GLOBAL HALL OF FAME
                  </h2>
                  <p className="text-lg text-white/80 font-medium">
                    All-time champions • Never resets • Combined scores from all games
                  </p>
                </div>

                {globalLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-white/70">Loading global champions...</p>
                  </div>
                ) : globalLeaderboard && globalLeaderboard.length > 0 ? (
                  <>
                    {renderTop3Podium(globalLeaderboard, true)}
                    <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                      <CardHeader>
                        <CardTitle className="font-futuristic text-2xl text-center">Complete Rankings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {globalLeaderboard.map((entry) => renderGlobalLeaderboardEntry(entry))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center text-white/70">
                    No global rankings yet. Play some games to appear here!
                  </div>
                )}
              </div>
            )}

            {/* Game Leaderboards */}
            {activeTab === 'games' && (
              <div className="mb-16">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-futuristic font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] mb-4">
                    GAME LEADERBOARDS
                  </h2>
                  <p className="text-lg text-white/80 font-medium mb-6">
                    Compete for glory in each cosmic challenge
                  </p>

                  {/* Game Selector */}
                  <div className="max-w-md mx-auto">
                    <Select value={selectedGame.toString()} onValueChange={(value) => setSelectedGame(parseInt(value))}>
                      <SelectTrigger className="w-full font-futuristic bg-black/20 border-border/30">
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GAMES_CONFIG).map(([id, game]) => (
                          <SelectItem key={id} value={id} className="font-futuristic">
                            {game.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                  <CardHeader>
                    <CardTitle className="font-futuristic text-2xl text-center mb-4">
                      {GAMES_CONFIG[selectedGame as keyof typeof GAMES_CONFIG].name}
                    </CardTitle>

                    <Tabs defaultValue="monthly" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="monthly" className="font-futuristic flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Monthly Champions
                        </TabsTrigger>
                        <TabsTrigger value="yearly" className="font-futuristic flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Yearly Legends
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="monthly" className="mt-0">
                        {monthlyLoading ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-white/70">Loading monthly rankings...</p>
                          </div>
                        ) : monthlyLeaderboard && monthlyLeaderboard.length > 0 ? (
                          <>
                            <div className="mb-6 text-center">
                              <p className="text-sm text-white/70">
                                Monthly leaderboard - resets on the 1st of each month
                              </p>
                            </div>
                            <div className="space-y-3">
                              {monthlyLeaderboard.map((entry) => renderGameLeaderboardEntry(entry, true))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-white/70 py-8">
                            No monthly rankings yet for this game. Be the first to play!
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="yearly" className="mt-0">
                        {yearlyLoading ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-white/70">Loading yearly rankings...</p>
                          </div>
                        ) : yearlyLeaderboard && yearlyLeaderboard.length > 0 ? (
                          <>
                            <div className="mb-6 text-center">
                              <p className="text-sm text-white/70">
                                Yearly leaderboard - resets on January 1st
                              </p>
                            </div>
                            <div className="space-y-3">
                              {yearlyLeaderboard.map((entry) => renderGameLeaderboardEntry(entry, true))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-white/70 py-8">
                            No yearly rankings yet for this game. Be the first to play!
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardHeader>
                </Card>
              </div>
            )}

            {/* Faction Stats - Only show if we have global data */}
            {activeTab === 'global' && globalLeaderboard && globalLeaderboard.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                {["oni", "mud", "ustur"].map((faction) => {
                  const factionPlayers = globalLeaderboard.filter(p => p.user.faction === faction);
                  const totalPoints = factionPlayers.reduce((sum, p) => sum + p.totalPoints, 0);
                  const avgPoints = factionPlayers.length > 0 ? Math.round(totalPoints / factionPlayers.length) : 0;

                  return (
                    <Card key={faction} className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 text-center">
                      <CardHeader>
                        <FactionAvatar faction={faction as any} size="lg" className="mx-auto mb-2" />
                        <CardTitle className="font-futuristic capitalize">{faction} Faction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-futuristic font-bold">
                            {totalPoints.toLocaleString()}
                          </div>
                          <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">Total Score</div>
                          <div className="text-lg">{avgPoints.toLocaleString()} Avg</div>
                          <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">
                            {factionPlayers.length} Players
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;