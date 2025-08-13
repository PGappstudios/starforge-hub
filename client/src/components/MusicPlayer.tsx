import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  ChevronUp,
  ChevronDown,
  X,
  Eye
} from "lucide-react";
import { useAudioManager, Track } from "@/hooks/useAudioManager";
import { usePageMusic } from "@/hooks/usePageMusic";

const MusicPlayer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    shuffle,
    repeat,
    audioSettings,
    play,
    pause,
    nextTrack,
    previousTrack,
    seek,
    setShuffle,
    setRepeat,
    playAllTracks,
    updateAudioSettings,
    allTracks,
    playTrack,
    musicEnabled,
    toggleMusicEnabled,
  } = useAudioManager();

  // Enable page-specific music
  usePageMusic();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (value: number[]) => {
    updateAudioSettings({ musicVolume: value[0] });
  };

  const toggleMute = () => {
    updateAudioSettings({ muteAll: !audioSettings.muteAll });
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const getRepeatIcon = () => {
    switch (repeat) {
      case 'one':
        return <Repeat1 className="w-4 h-4" />;
      case 'all':
        return <Repeat className="w-4 h-4" />;
      default:
        return <Repeat className="w-4 h-4 opacity-50" />;
    }
  };

  const cycleRepeat = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  // Show minimized button when hidden
  if (isHidden) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsHidden(false)}
          className="flex items-center gap-2 bg-black/10 backdrop-blur-md border-white/20 hover:bg-primary/30"
          size="sm"
        >
          <Eye className="w-4 h-4" />
          Show Music
        </Button>
      </div>
    );
  }

  // Show music disabled state
  if (!musicEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-black/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={toggleMusicEnabled}
                className="flex items-center gap-2 bg-green-600/80 hover:bg-green-600/90 text-white font-medium px-4 py-2"
              >
                <Music className="w-4 h-4" />
                Enable Background Music
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHidden(true)}
                className="p-1 h-auto text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentTrack && !isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-black/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={() => {
                  console.log('🎵 Manual start music button clicked');
                  playAllTracks();
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-600/90 text-white font-medium px-4 py-2 shadow-lg"
              >
                <Music className="w-4 h-4" />
                Start Background Music
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMusicEnabled}
                  className="p-1 h-auto text-gray-400 hover:text-white"
                  title="Disable music"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHidden(true)}
                  className="p-1 h-auto text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
              <Card className="bg-black/10 backdrop-blur-md border-white/20 min-w-80">
        <CardContent className="p-4">
          {/* Header with Controls */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <span className="font-futuristic text-sm text-white">Music Player</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 h-auto"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHidden(true)}
                className="p-1 h-auto text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current Track Info */}
          {currentTrack && (
            <div className="mb-3">
              <div className="text-sm font-medium text-white truncate">
                {currentTrack.name}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {currentTrack && (
            <div className="mb-3">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
                disabled={!duration}
              />
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShuffle(!shuffle)}
              className={shuffle ? "text-primary" : "text-white/50"}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={previousTrack}>
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={isPlaying ? pause : play}
              disabled={!currentTrack || isLoading}
              className="bg-primary hover:bg-primary/80"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={nextTrack}>
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleRepeat}
              className={repeat !== 'none' ? "text-primary" : "text-white/50"}
            >
              {getRepeatIcon()}
            </Button>
          </div>

          {/* Expanded Controls */}
          {isExpanded && (
            <div className="space-y-3 border-t border-white/20 pt-3">
              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="p-1"
                >
                  {audioSettings.muteAll ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={[audioSettings.musicVolume]}
                  max={100}
                  step={5}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                  disabled={audioSettings.muteAll}
                />
                <span className="text-xs text-white/70 w-8 text-right">
                  {audioSettings.muteAll ? '0' : audioSettings.musicVolume}%
                </span>
              </div>

              {/* Music Controls */}
              <div className="mb-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playAllTracks()}
                  className="w-full text-xs"
                >
                  Play All Tracks
                </Button>
                <Button
                  variant={musicEnabled ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleMusicEnabled}
                  className="w-full text-xs"
                >
                  {musicEnabled ? 'Disable Music' : 'Enable Music'}
                </Button>
              </div>

              {/* Track Selection */}
              <div className="space-y-2">
                <label className="text-xs font-futuristic text-white/70">Select Track:</label>
                <Select onValueChange={(trackId) => {
                  const track = allTracks.find(t => t.id === trackId);
                  if (track) playTrack(track);
                }}>
                  <SelectTrigger className="bg-black/10 border-white/20 text-xs">
                    <SelectValue placeholder="Choose a track..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MusicPlayer;