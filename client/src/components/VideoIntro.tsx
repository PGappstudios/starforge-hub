import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { useAudioManager } from "@/hooks/useAudioManager";
import { useSettings } from "@/contexts/SettingsContext";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";

interface VideoIntroProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const VideoIntro = ({ isOpen, onClose, onComplete }: VideoIntroProps) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const { 
    onVideoPlay,
    onVideoPause,
    onVideoEnd,
    pauseForVideo,
    resumeFromVideo,
    isPlaying: musicIsPlaying 
  } = useAudioManager();

  const { pauseMusicForVideo, videoMusicBehavior } = useSettings();

  const handleComplete = useCallback(() => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onVideoEnd();
      // Use setTimeout to avoid React warnings about state updates during render
      setTimeout(() => {
        onComplete();
      }, 0);
    }
  }, [onVideoEnd, onComplete]);

  // Real-time progress tracking
  useEffect(() => {
    if (isOpen && playerRef.current && playerReady) {
      intervalRef.current = setInterval(() => {
        try {
          const currentTime = playerRef.current?.getCurrentTime() || 0;
          const duration = playerRef.current?.getDuration() || 0;
          
          setCurrentTime(currentTime);
          setDuration(duration);
          
          // Check if video ended
          if (duration > 0 && currentTime >= duration - 0.5) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            handleComplete();
          }
        } catch (error) {
          console.warn('Error getting video progress:', error);
        }
      }, 500);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isOpen, playerReady, handleComplete]);

  const handleClose = () => {
    // Resume background music when closing (if it was paused)
    if (pauseMusicForVideo && videoMusicBehavior === 'pause') {
      onVideoEnd();
    }
    onClose();
  };

  const togglePlay = () => {
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (error) {
        console.warn('Error controlling video playback:', error);
      }
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      try {
        if (isMuted) {
          playerRef.current.unMute();
        } else {
          playerRef.current.mute();
        }
        setIsMuted(!isMuted);
      } catch (error) {
        console.warn('Error controlling video mute:', error);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current && duration > 0) {
      try {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * duration;
        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      } catch (error) {
        console.warn('Error seeking video:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // YouTube Player configuration
  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0, // Hide YouTube controls, we'll use custom ones
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  // YouTube Player event handlers
  const onReady: YouTubeProps['onReady'] = (event) => {
    console.log('🎬 YouTube player ready');
    playerRef.current = event.target;
    setPlayerReady(true);
    setIsLoading(false);
    
    // Start playing and pause music
    try {
      event.target.playVideo();
    } catch (error) {
      console.warn('Failed to start video:', error);
    }
  };

  const onPlay: YouTubeProps['onPlay'] = () => {
    console.log('🎬 Video started playing');
    setIsPlaying(true);
    setIsLoading(false);
    
    // Only pause music if user setting allows it
    if (pauseMusicForVideo && videoMusicBehavior === 'pause') {
      onVideoPlay();
    }
  };

  const onPause: YouTubeProps['onPause'] = () => {
    console.log('🎬 Video paused');
    setIsPlaying(false);
    
    // Handle music based on user settings
    if (pauseMusicForVideo && videoMusicBehavior === 'pause') {
      onVideoPause();
    }
  };

  const onEnd: YouTubeProps['onEnd'] = () => {
    console.log('🎬 Video ended');
    setIsPlaying(false);
    
    // Resume music based on settings
    if (pauseMusicForVideo && videoMusicBehavior === 'pause') {
      onVideoEnd();
    }
    
    handleComplete();
  };

  const onError: YouTubeProps['onError'] = (event) => {
    console.error('🎬 YouTube error:', event.data);
    setHasError(true);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* YouTube Video */}
      <div className="w-full h-full">
        <YouTube
          videoId="AhBwLZCp0z8"
          opts={opts}
          onReady={onReady}
          onPlay={onPlay}
          onPause={onPause}
          onEnd={onEnd}
          onError={onError}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Loading Overlay */}
      {(isLoading || !playerReady) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-futuristic">Loading Trailer...</p>
            <p className="text-white/60 font-futuristic text-sm mt-2">Initializing video player...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-white font-futuristic text-xl mb-4">Unable to load trailer</p>
            <p className="text-white/70 font-futuristic mb-6">The YouTube video could not be loaded</p>
            <div className="space-x-4">
              <Button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  window.location.reload();
                }}
                variant="outline"
                className="font-futuristic"
              >
                Retry
              </Button>
              <Button
                onClick={handleClose}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-futuristic"
              >
                Continue to Game
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Button - Always visible */}
      <Button
        onClick={handleClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white z-10"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Skip Button - Always visible */}
      <Button
        onClick={handleClose}
        variant="outline"
        className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white border-white/30 z-10"
      >
        Skip Intro
      </Button>

      {/* Real Video Progress */}
      {isOpen && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0">
          <div 
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}

      {/* Video Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        {/* Progress Bar */}
        <div 
          className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlay}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              disabled={isLoading}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <Button
              onClick={toggleMute}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </Button>

            <span className="text-white font-futuristic text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="text-white font-futuristic text-lg">
            STAR SEEKERS TRAILER
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoIntro;