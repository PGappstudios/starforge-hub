
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket, Users, Trophy, Zap } from "lucide-react";
import VideoIntro from "@/components/VideoIntro";
import { useSettings } from "@/contexts/SettingsContext";

const Index = () => {
  const navigate = useNavigate();
  const { showIntroVideo } = useSettings();
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const handleEnterHub = () => {
    if (showIntroVideo) {
      setIsVideoOpen(true);
    } else {
      navigate("/dashboard");
    }
  };

  const handleVideoClose = () => {
    setIsVideoOpen(false);
    navigate("/dashboard");
  };

  const handleVideoComplete = () => {
    setIsVideoOpen(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <VideoIntro 
        isOpen={isVideoOpen}
        onClose={handleVideoClose}
        onComplete={handleVideoComplete}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-futuristic font-black text-white mb-4 animate-float text-outline">
            STAR SEEKERS
          </h1>
          <p className="text-2xl md:text-3xl font-cosmic text-white mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] font-semibold">
            Choose Your Faction. Claim Your Destiny.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-futuristic text-lg px-8 py-4 neon-glow">
                Enter Hub
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg" className="border-secondary text-secondary hover:bg-secondary/10 font-futuristic text-lg px-8 py-4">
                View Leaderboard
              </Button>
            </Link>
          </div>
        </header>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="faction-card text-center">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-futuristic font-bold mb-2 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">Epic Adventures</h3>
            <p className="text-white font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Explore the cosmos across multiple game universes</p>
          </Card>
          
          <Card className="faction-card text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-secondary" />
            <h3 className="text-xl font-futuristic font-bold mb-2 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">Three Factions</h3>
            <p className="text-white font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Choose between Aliens, Robots, or Humans</p>
          </Card>
          
          <Card className="faction-card text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h3 className="text-xl font-futuristic font-bold mb-2 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">Global Rankings</h3>
            <p className="text-white font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Compete for glory on the unified leaderboard</p>
          </Card>
          
          <Card className="faction-card text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-futuristic font-bold mb-2 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">Cosmic Rewards</h3>
            <p className="text-white font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Earn points and unlock new possibilities</p>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-4xl font-futuristic font-bold mb-4 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
            Ready to Begin?
          </h2>
          <p className="text-xl text-white mb-8 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] font-medium">
            Join thousands of players in the ultimate cosmic gaming experience
          </p>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 font-futuristic text-lg px-12 py-4 animate-pulse-slow">
              Launch Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
