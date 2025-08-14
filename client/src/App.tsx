import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MusicPlayer from "@/components/MusicPlayer";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { useCreditNotifications } from "@/hooks/useCreditNotifications";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Credits from "./pages/Credits";
import Settings from "./pages/Settings";
import WheelOfIris from "./pages/WheelOfIris";
import SSIP from "./pages/SSIP";
import Game1 from "./pages/games/Game1";
import Game2 from "./pages/games/Game2";
import Game3 from "./pages/games/Game3";
import Game4 from "./pages/games/Game4";
import Game5 from "./pages/games/Game5";
import Game6 from "./pages/games/Game6";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

// Component to initialize credit notifications
const CreditNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useCreditNotifications();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SettingsProvider>
        <CreditsProvider>
          <TooltipProvider>
            <CreditNotificationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/wheel-of-iris" element={<WheelOfIris />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/credits" element={<Credits />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/ss-ip" element={<SSIP />} />
                  <Route path="/game1" element={<Game1 />} />
                  <Route path="/game2" element={<Game2 />} />
                  <Route path="/game3" element={<Game3 />} />
                  <Route path="/game4" element={<Game4 />} />
                  <Route path="/game5" element={<Game5 />} />
                  <Route path="/game6" element={<Game6 />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MusicPlayer />
              </BrowserRouter>
            </CreditNotificationProvider>
          </TooltipProvider>
        </CreditsProvider>
      </SettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;