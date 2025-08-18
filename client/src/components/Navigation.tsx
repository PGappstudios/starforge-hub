
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, BarChart3, Users, Zap, Settings, Coins, Star, LogIn, LogOut, User } from "lucide-react";
import { useCredits } from "@/contexts/CreditsContext";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";

const Navigation = () => {
  const location = useLocation();
  const { credits } = useCredits();
  const { isAuthenticated, user, logout } = useAuth();
  const [showAuthForm, setShowAuthForm] = useState(false);
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: Users },
    { path: "/wheel-of-iris", label: "Dice of Iris", icon: Zap },
    { path: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
    { path: "/credits", label: "Credits", icon: Coins },
    { path: "/ss-ip", label: "SS-IP", icon: Star },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const handleSignIn = () => {
    setShowAuthForm(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthForm(false);
  };

  const handleAuthClose = () => {
    setShowAuthForm(false);
  };

  const handleLogout = () => {
    logout();
  };


  return (
    <nav className="bg-black/10 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between lg:items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-futuristic font-bold text-primary neon-text lg:flex-shrink-0 lg:ml-8">
            STAR SEEKERS
          </Link>

          {/* Main Navigation - Centered */}
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 lg:flex-1 lg:justify-center">
            {navItems.map(({ path, label, icon: Icon }) => {
              // Special handling for Dice of Iris to include credits
              if (path === "/wheel-of-iris") {
                return (
                  <Link key={path} to={path}>
                    <Button
                      variant={location.pathname === path ? "default" : "ghost"}
                      size="sm"
                      className={`${location.pathname === path ? "neon-glow" : "hover:bg-primary/20"} relative`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                      <Badge 
                        variant="secondary" 
                        className="ml-2 font-futuristic bg-yellow-500/20 border-yellow-500/50 text-yellow-400 px-2 py-0.5 text-xs"
                      >
                        <Coins className="w-3 h-3 mr-1" />
                        {credits}
                      </Badge>
                    </Button>
                  </Link>
                );
              }
              
              // Regular nav items
              return (
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
              );
            })}
          </div>

          {/* Authentication Controls */}
          <div className="flex items-center gap-2 lg:flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm text-white/70">
                  {user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-primary/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignIn}
                className="hover:bg-primary/20"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthForm && (
        <AuthForm
          onAuthSuccess={handleAuthSuccess}
          onClose={handleAuthClose}
        />
      )}
    </nav>
  );
};

export default Navigation;
