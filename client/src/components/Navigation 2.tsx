
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BarChart3, Gamepad2, Users, Zap } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: Users },
    { path: "/wheel-of-iris", label: "Dice of Iris", icon: Zap },
    { path: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  ];

  const gameItems = [
    { path: "/game1", label: "Game 1" },
    { path: "/game2", label: "Game 2" },
    { path: "/game3", label: "Game 3" },
    { path: "/game4", label: "Game 4" },
    { path: "/game5", label: "Game 5" },
    { path: "/game6", label: "Game 6" },
  ];

  return (
    <nav className="bg-black/10 backdrop-blur-md border-b border-white/20 px-4 py-3">
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-futuristic font-bold text-primary neon-text">
            STAR SEEKERS
          </Link>

          {/* Main Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={location.pathname === path ? "default" : "ghost"}
                  size="sm"
                  className={location.pathname === path ? "neon-glow" : "hover:bg-primary/20"}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Games Navigation */}
          <div className="flex flex-wrap items-center gap-1">
            <Gamepad2 className="w-4 h-4 text-muted-foreground mr-2" />
            {gameItems.map(({ path, label }) => (
              <Link key={path} to={path}>
                <Button
                  variant={location.pathname === path ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs"
                >
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
