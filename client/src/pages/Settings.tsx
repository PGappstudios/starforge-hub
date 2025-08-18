import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import FactionAvatar from "@/components/FactionAvatar";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  User, 
  Gamepad2, 
  Monitor, 
  Shield, 
  Bell,
  Palette,
  Save,
  RefreshCw
} from "lucide-react";

const Settings = () => {
  // Authentication
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const { toast } = useToast();

  // Settings Context
  const { 
    showIntroVideo, 
    setShowIntroVideo
  } = useSettings();

  // Profile Settings (synced with user data)
  const [selectedFaction, setSelectedFaction] = useState<"oni" | "mud" | "ustur">(user?.faction || "oni");
  const [email, setEmail] = useState(user?.email || "");
  const [solanaWallet, setSolanaWallet] = useState(user?.solanaWallet || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with user data when user changes
  useEffect(() => {
    if (user) {
      setSelectedFaction(user.faction || "oni");
      setEmail(user.email || "");
      setSolanaWallet(user.solanaWallet || "");
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="text-white text-xl font-futuristic">Loading...</div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-futuristic mb-4">Please sign in to access settings</div>
          <button 
            onClick={() => window.location.href = '/'} 
            className="nav-button"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!user || !isAuthenticated) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to update your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Attempting to save profile:', { 
        faction: selectedFaction,
        email: email.trim() || undefined,
        solanaWallet: solanaWallet.trim() || undefined
      });

      await updateProfile({ 
        faction: selectedFaction,
        email: email.trim() || undefined,
        solanaWallet: solanaWallet.trim() || undefined
      });
      
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      let errorMessage = "Failed to update profile. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If it's an authentication error, redirect to home
      if (error.message?.includes('authenticated') || error.message?.includes('401')) {
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSelectedFaction(user.faction || "oni");
    setEmail(user.email || "");
    setSolanaWallet(user.solanaWallet || "");
    setShowIntroVideo(true);
    toast({
      title: "Settings Reset",
      description: "Settings reset to defaults!",
    });
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-futuristic font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent neon-text mb-4">
            SETTINGS COMMAND CENTER
          </h1>
          <p className="text-xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] font-medium">
            Customize your cosmic gaming experience
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-1 mb-8">
              <TabsTrigger value="profile" className="font-futuristic flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                  <CardHeader>
                    <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                      <User className="w-6 h-6 text-primary" />
                      Player Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="font-futuristic">Username</Label>
                      <Input
                        id="username"
                        value={user.username}
                        disabled
                        className="bg-black/10 border-white/20 opacity-60"
                      />
                      <p className="text-xs text-white/60">Username cannot be changed</p>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-futuristic">Choose Your Faction</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { 
                            id: "oni" as const, 
                            name: "ONI", 
                            description: "Alien Forces"
                          },
                          { 
                            id: "mud" as const, 
                            name: "MUD", 
                            description: "Human Alliance"
                          },
                          { 
                            id: "ustur" as const, 
                            name: "USTUR", 
                            description: "Robot Network"
                          }
                        ].map((faction) => (
                          <div
                            key={faction.id}
                            onClick={() => setSelectedFaction(faction.id)}
                            className={cn(
                              "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 text-center transform hover:scale-105 backdrop-blur-md",
                              selectedFaction === faction.id 
                                ? "ring-2 ring-white/50 shadow-lg" 
                                : "border-white/20 hover:border-white/40",
                              faction.id === "oni" && selectedFaction === faction.id && "border-blue-500 bg-blue-500/20",
                              faction.id === "oni" && selectedFaction !== faction.id && "hover:border-blue-500/50 hover:bg-blue-500/5 bg-black/10",
                              faction.id === "mud" && selectedFaction === faction.id && "border-green-500 bg-green-500/20",
                              faction.id === "mud" && selectedFaction !== faction.id && "hover:border-green-500/50 hover:bg-green-500/5 bg-black/10",
                              faction.id === "ustur" && selectedFaction === faction.id && "border-purple-500 bg-purple-500/20",
                              faction.id === "ustur" && selectedFaction !== faction.id && "hover:border-purple-500/50 hover:bg-purple-500/5 bg-black/10"
                            )}
                          >
                            <FactionAvatar faction={faction.id} size="lg" className="mx-auto mb-3" />
                            <div className="font-futuristic font-bold text-white text-lg mb-1">
                              {faction.name}
                            </div>
                            <div className="text-sm text-white/70">
                              {faction.description}
                            </div>
                            {selectedFaction === faction.id && (
                              <div className="absolute top-3 right-3">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-futuristic">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="bg-black/10 border-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="solana-wallet" className="font-futuristic">Solana Wallet Address</Label>
                      <Input
                        id="solana-wallet"
                        value={solanaWallet}
                        onChange={(e) => setSolanaWallet(e.target.value)}
                        placeholder="Enter your Solana wallet address"
                        className="bg-black/10 border-white/20"
                      />
                      <p className="text-xs text-white/60">Your Solana wallet for rewards and transactions</p>
                    </div>

                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving || (user.faction === selectedFaction && user.email === email && user.solanaWallet === solanaWallet)}
                      className="w-full nav-button"
                    >
                      {isSaving ? "Updating..." : "Update Profile"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                  <CardHeader>
                    <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary" />
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <FactionAvatar faction={selectedFaction} size="xl" className="mx-auto mb-4" />
                      <h3 className="text-2xl font-futuristic font-bold text-white mb-2">{user.username}</h3>
                      <Badge variant="outline" className="capitalize mb-4">
                        {selectedFaction} Faction
                      </Badge>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-futuristic font-bold text-primary">{user.totalPoints || 0}</div>
                          <div className="text-sm text-white/70">Total Points</div>
                        </div>
                        <div>
                          <div className="text-2xl font-futuristic font-bold text-secondary">{user.gamesPlayed || 0}</div>
                          <div className="text-sm text-white/70">Games Played</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-12">
            <Button onClick={handleResetSettings} variant="outline" className="nav-button flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;