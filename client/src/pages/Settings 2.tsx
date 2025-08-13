import { useState } from "react";
import Navigation from "@/components/Navigation";
import FactionAvatar from "@/components/FactionAvatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAudioManager } from "@/hooks/useAudioManager";
import { 
  Settings as SettingsIcon, 
  User, 
  Gamepad2, 
  Volume2, 
  Monitor, 
  Shield, 
  Bell,
  Palette,
  Save,
  RefreshCw
} from "lucide-react";

const Settings = () => {
  // Audio Manager
  const { audioSettings, updateAudioSettings, playByCategory } = useAudioManager();

  // Profile Settings
  const [username, setUsername] = useState("CosmicPlayer");
  const [selectedFaction, setSelectedFaction] = useState<"oni" | "mud" | "ustur" | null>("ustur");
  const [email, setEmail] = useState("cosmic.player@starforge.com");

  // Game Settings
  const [difficulty, setDifficulty] = useState("medium");
  const [autoSave, setAutoSave] = useState(true);
  const [showHelpTips, setShowHelpTips] = useState(true);
  const [enableCheats, setEnableCheats] = useState(false);

  // Display Settings
  const [theme, setTheme] = useState("dark");
  const [resolution, setResolution] = useState("1920x1080");
  const [fullscreen, setFullscreen] = useState(false);
  const [showFPS, setShowFPS] = useState(false);
  const [particleEffects, setParticleEffects] = useState(true);

  // Notification Settings
  const [gameNotifications, setGameNotifications] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);
  const [leaderboardNotifications, setLeaderboardNotifications] = useState(false);

  const handleSaveSettings = () => {
    // In a real app, this would save to backend/localStorage
    console.log("Settings saved!");
  };

  const handleResetSettings = () => {
    // Reset to defaults
    setUsername("CosmicPlayer");
    setSelectedFaction("ustur");
    setDifficulty("medium");
    setAutoSave(true);
    updateAudioSettings({
      masterVolume: 75,
      musicVolume: 60,
      sfxVolume: 80,
      muteAll: false,
    });
    setTheme("dark");
    setFullscreen(false);
    console.log("Settings reset to defaults!");
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8">
              <TabsTrigger value="profile" className="font-futuristic flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="game" className="font-futuristic flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Game
              </TabsTrigger>
              <TabsTrigger value="audio" className="font-futuristic flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="display" className="font-futuristic flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Display
              </TabsTrigger>
              <TabsTrigger value="notifications" className="font-futuristic flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alerts
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="game-card">
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
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-black/10 border-white/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-futuristic">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black/10 border-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-futuristic">Faction</Label>
                      <Select value={selectedFaction || undefined} onValueChange={(value: "oni" | "mud" | "ustur") => setSelectedFaction(value)}>
                        <SelectTrigger className="bg-black/10 border-white/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oni">ONI Faction</SelectItem>
                          <SelectItem value="mud">MUD Faction</SelectItem>
                          <SelectItem value="ustur">USTUR Faction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="game-card">
                  <CardHeader>
                    <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary" />
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <FactionAvatar faction={selectedFaction} size="xl" className="mx-auto mb-4" />
                      <h3 className="text-2xl font-futuristic font-bold text-white mb-2">{username}</h3>
                      <Badge variant="outline" className="capitalize mb-4">
                        {selectedFaction} Faction
                      </Badge>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-futuristic font-bold text-primary">2,847</div>
                          <div className="text-sm text-white/70">Total Score</div>
                        </div>
                        <div>
                          <div className="text-2xl font-futuristic font-bold text-secondary">12</div>
                          <div className="text-sm text-white/70">Games Won</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Game Settings */}
            <TabsContent value="game">
              <Card className="game-card">
                <CardHeader>
                  <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                    <Gamepad2 className="w-6 h-6 text-primary" />
                    Game Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="font-futuristic">Difficulty Level</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger className="bg-black/10 border-white/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy - Cadet</SelectItem>
                            <SelectItem value="medium">Medium - Pilot</SelectItem>
                            <SelectItem value="hard">Hard - Commander</SelectItem>
                            <SelectItem value="expert">Expert - Admiral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-save" className="font-futuristic">Auto-Save Progress</Label>
                        <Switch
                          id="auto-save"
                          checked={autoSave}
                          onCheckedChange={setAutoSave}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="help-tips" className="font-futuristic">Show Help Tips</Label>
                        <Switch
                          id="help-tips"
                          checked={showHelpTips}
                          onCheckedChange={setShowHelpTips}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cheats" className="font-futuristic">Enable Developer Mode</Label>
                        <Switch
                          id="cheats"
                          checked={enableCheats}
                          onCheckedChange={setEnableCheats}
                        />
                      </div>

                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm text-yellow-400 font-medium">
                          ⚠️ Developer mode disables leaderboard submissions and achievements.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audio Settings */}
            <TabsContent value="audio">
              <Card className="game-card">
                <CardHeader>
                  <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                    <Volume2 className="w-6 h-6 text-primary" />
                    Audio Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <Label htmlFor="mute-all" className="font-futuristic">Mute All Audio</Label>
                    <Switch
                      id="mute-all"
                      checked={audioSettings.muteAll}
                      onCheckedChange={(checked) => updateAudioSettings({ muteAll: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <Label className="font-futuristic">Master Volume</Label>
                      <div className="px-3">
                        <Slider
                          value={[audioSettings.masterVolume]}
                          onValueChange={(value) => updateAudioSettings({ masterVolume: value[0] })}
                          max={100}
                          step={5}
                          disabled={audioSettings.muteAll}
                          className="w-full"
                        />
                        <div className="text-center text-sm text-white/70 mt-2">
                          {audioSettings.masterVolume}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-futuristic">Music Volume</Label>
                      <div className="px-3">
                        <Slider
                          value={[audioSettings.musicVolume]}
                          onValueChange={(value) => updateAudioSettings({ musicVolume: value[0] })}
                          max={100}
                          step={5}
                          disabled={audioSettings.muteAll}
                          className="w-full"
                        />
                        <div className="text-center text-sm text-white/70 mt-2">
                          {audioSettings.musicVolume}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-futuristic">Sound Effects</Label>
                      <div className="px-3">
                        <Slider
                          value={[audioSettings.sfxVolume]}
                          onValueChange={(value) => updateAudioSettings({ sfxVolume: value[0] })}
                          max={100}
                          step={5}
                          disabled={audioSettings.muteAll}
                          className="w-full"
                        />
                        <div className="text-center text-sm text-white/70 mt-2">
                          {audioSettings.sfxVolume}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Music Preview Section */}
                  <div className="space-y-4">
                    <Label className="font-futuristic">Music Preview</Label>
                    <p className="text-sm text-white/70">
                      Test different music categories to find your preferred atmosphere
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => playByCategory('menu')}
                        className="text-sm"
                      >
                        Menu Music
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => playByCategory('ambient')}
                        className="text-sm"
                      >
                        Ambient
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => playByCategory('action')}
                        className="text-sm"
                      >
                        Action
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => playByCategory('game')}
                        className="text-sm"
                      >
                        Game Music
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent value="display">
              <Card className="game-card">
                <CardHeader>
                  <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                    <Monitor className="w-6 h-6 text-primary" />
                    Display & Graphics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="font-futuristic">Theme</Label>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger className="bg-black/10 border-white/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dark">Dark Cosmic</SelectItem>
                            <SelectItem value="light">Light Nebula</SelectItem>
                            <SelectItem value="auto">Auto (System)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-futuristic">Resolution</Label>
                        <Select value={resolution} onValueChange={setResolution}>
                          <SelectTrigger className="bg-black/10 border-white/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                            <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                            <SelectItem value="2560x1440">2560x1440 (2K)</SelectItem>
                            <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="fullscreen" className="font-futuristic">Fullscreen Mode</Label>
                        <Switch
                          id="fullscreen"
                          checked={fullscreen}
                          onCheckedChange={setFullscreen}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-fps" className="font-futuristic">Show FPS Counter</Label>
                        <Switch
                          id="show-fps"
                          checked={showFPS}
                          onCheckedChange={setShowFPS}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="particle-effects" className="font-futuristic">Particle Effects</Label>
                        <Switch
                          id="particle-effects"
                          checked={particleEffects}
                          onCheckedChange={setParticleEffects}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card className="game-card">
                <CardHeader>
                  <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                    <Bell className="w-6 h-6 text-primary" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="game-notifications" className="font-futuristic">Game Events</Label>
                        <p className="text-sm text-white/70">Game start, end, and important events</p>
                      </div>
                      <Switch
                        id="game-notifications"
                        checked={gameNotifications}
                        onCheckedChange={setGameNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="achievement-notifications" className="font-futuristic">Achievements</Label>
                        <p className="text-sm text-white/70">New achievements and milestones</p>
                      </div>
                      <Switch
                        id="achievement-notifications"
                        checked={achievementNotifications}
                        onCheckedChange={setAchievementNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="leaderboard-notifications" className="font-futuristic">Leaderboard Updates</Label>
                        <p className="text-sm text-white/70">Rank changes and monthly resets</p>
                      </div>
                      <Switch
                        id="leaderboard-notifications"
                        checked={leaderboardNotifications}
                        onCheckedChange={setLeaderboardNotifications}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-12">
            <Button onClick={handleSaveSettings} className="nav-button flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
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