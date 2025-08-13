
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Trophy, Star } from "lucide-react";

interface GameTemplateProps {
  gameNumber: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  maxPoints: number;
  playerBest: number;
}

const GameTemplate = ({ gameNumber, title, description, difficulty, maxPoints, playerBest }: GameTemplateProps) => {
  const difficultyColors = {
    Easy: "bg-green-500/20 text-green-400 border-green-500/50",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    Hard: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    Expert: "bg-red-500/20 text-red-400 border-red-500/50"
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="nav-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Game Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-futuristic font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] mb-4">
            {title}
          </h1>
          <p className="text-xl text-white mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] font-medium">
            {description}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="outline" className={difficultyColors[difficulty]}>
              {difficulty}
            </Badge>
            <Badge variant="outline" className="font-futuristic text-white border-white/50 bg-white/10">
              <Trophy className="w-4 h-4 mr-2" />
              Max: {maxPoints} Points
            </Badge>
            <Badge variant="secondary" className="font-futuristic text-white bg-white/20">
              <Star className="w-4 h-4 mr-2" />
              Your Best: {playerBest} Points
            </Badge>
          </div>
        </div>

        {/* Game Area */}
        <Card className="game-card max-w-4xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="font-futuristic text-2xl text-center text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">Game Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-card/30 rounded-lg p-12 text-center border-2 border-dashed border-border/50">
              <div className="mb-8">
                <Play className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-2xl font-futuristic font-bold mb-2 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">Game Coming Soon</h3>
                <p className="text-white text-lg font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
                  The actual game mechanics will be implemented here.
                </p>
              </div>
              
              {/* Placeholder Game Controls */}
              <div className="space-y-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-futuristic text-lg px-8 py-4 neon-glow" disabled>
                  Start Game
                </Button>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" disabled>Instructions</Button>
                  <Button variant="outline" disabled>Settings</Button>
                  <Button variant="outline" disabled>High Scores</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Stats */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="faction-card text-center">
            <CardContent className="pt-6">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">{playerBest}</div>
              <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">Personal Best</div>
            </CardContent>
          </Card>
          
          <Card className="faction-card text-center">
            <CardContent className="pt-6">
              <Play className="w-8 h-8 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">0</div>
              <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">Times Played</div>
            </CardContent>
          </Card>
          
          <Card className="faction-card text-center">
            <CardContent className="pt-6">
              <Star className="w-8 h-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-futuristic font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">{maxPoints}</div>
              <div className="text-sm text-white font-medium drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">Max Possible</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GameTemplate;
