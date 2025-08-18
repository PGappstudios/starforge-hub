import { useState, useEffect, useRef, useCallback } from 'react';

export interface Track {
  id: string;
  name: string;
  filename: string;
  category: 'menu' | 'game' | 'ambient' | 'action';
}

export const musicTracks: Track[] = [
  { id: '1', name: 'Discovery of Iris', filename: 'discovery-of-iris.mp3', category: 'menu' },
  { id: '2', name: 'The Heart of Star Atlas', filename: 'the-heart-of-star-atlas.mp3', category: 'ambient' },
  { id: '3', name: 'The Convergence War', filename: 'the-convergence-war.mp3', category: 'action' },
  { id: '4', name: 'Armstrong Forever', filename: 'armstrong-forever.mp3', category: 'menu' },
  { id: '5', name: 'Short Story of a Lost Astronaut', filename: 'short-story-of-a-lost-astronaut.mp3', category: 'ambient' },
  { id: '6', name: 'The Last Stand', filename: 'the-last-stand.mp3', category: 'action' },
  { id: '7', name: 'The Peacebringers Archive', filename: 'the-peacebringers-archive.mp3', category: 'ambient' },
  { id: '8', name: 'AHR Visits Earth', filename: 'ahr-visits-earth.mp3', category: 'game' },
  { id: '9', name: 'Love Story', filename: 'love-story.mp3', category: 'ambient' },
  { id: '10', name: 'Singing of the Peace Treaty', filename: 'singing-of-the-peace-treaty.mp3', category: 'menu' },
  { id: '11', name: 'Assassination of Paizul', filename: 'assassination-of-paizul.mp3', category: 'action' },
  { id: '12', name: 'Paizul Funeral Procession', filename: 'paizul-funeral-procession.mp3', category: 'ambient' },
];

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muteAll: boolean;
}

// Audio manager state
const STORAGE_KEYS = {
  MUSIC_ENABLED: 'starforge_music_enabled',
  VOLUME_SETTINGS: 'starforge_volume_settings',
  LAST_TRACK: 'starforge_last_track'
};

// Load settings from localStorage
const loadStoredSettings = (): AudioSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VOLUME_SETTINGS);
    if (stored) {
      return { ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load stored audio settings:', error);
  }
  return {
    masterVolume: 75,
    musicVolume: 60,
    sfxVolume: 80,
    muteAll: false,
  };
};

// Check if music is enabled
const isMusicEnabled = (): boolean => {
  try {
    const enabled = localStorage.getItem(STORAGE_KEYS.MUSIC_ENABLED);
    return enabled !== 'false'; // Default to true
  } catch (error) {
    return true;
  }
};

// Save settings to localStorage
const saveSettings = (settings: AudioSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.VOLUME_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save audio settings:', error);
  }
};

// Save music enabled state
const saveMusicEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MUSIC_ENABLED, enabled.toString());
  } catch (error) {
    console.warn('Failed to save music enabled state:', error);
  }
};

export const useAudioManager = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('all');
  const [savedPosition, setSavedPosition] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadStoredSettings());
  const [musicEnabled, setMusicEnabled] = useState(isMusicEnabled());

  // Initialize audio element
  useEffect(() => {
    if (audioRef.current) {
      console.log('🎵 Audio element already exists, skipping initialization');
      return;
    }

    console.log('🎵 Initializing audio manager...');
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      handleTrackEnd();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      if (audio) {
        console.log('🎵 Cleaning up audio manager...');
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  // Update volume when settings change and save to localStorage
  useEffect(() => {
    if (audioRef.current) {
      const effectiveVolume = audioSettings.muteAll 
        ? 0 
        : (audioSettings.masterVolume / 100) * (audioSettings.musicVolume / 100);
      audioRef.current.volume = effectiveVolume;
      console.log('🎵 Volume updated to:', Math.round(effectiveVolume * 100) + '%');
    }
    saveSettings(audioSettings);
  }, [audioSettings]);

  // Save music enabled state when changed
  useEffect(() => {
    saveMusicEnabled(musicEnabled);
  }, [musicEnabled]);

  const loadTrack = useCallback((track: Track) => {
    if (audioRef.current) {
      // Stop current playback first
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);

      const audioPath = `/assets/Music/${track.filename}`;
      console.log(`🎵 Setting audio source to: ${audioPath}`);
      setIsLoading(true);
      audioRef.current.src = audioPath;
      setCurrentTrack(track);
      setCurrentTime(0);

      // Add load event listeners for debugging
      audioRef.current.addEventListener('loadstart', () => {
        console.log('🎵 Audio loading started');
      }, { once: true });

      audioRef.current.addEventListener('canplay', () => {
        console.log('🎵 ✅ Audio can start playing');
        setIsLoading(false);
      }, { once: true });

      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('🎵 ✅ Audio can play through without buffering');
      }, { once: true });

      audioRef.current.addEventListener('error', (e) => {
        const errorDetails = audioRef.current?.error;
        const errorMessage = errorDetails ? 
          `Code: ${errorDetails.code}, Message: ${errorDetails.message || 'Unknown error'}` :
          'Unknown audio error';

        console.error('🎵 ❌ Audio loading error for:', audioPath);
        console.error('🎵 ❌ Error details:', errorMessage);
        console.error('🎵 ❌ MediaError codes: 1=Aborted, 2=Network, 3=Decode, 4=NotSupported');

        // Check if file exists by trying to fetch it
        fetch(audioPath, { method: 'HEAD' })
          .then(response => {
            if (!response.ok) {
              console.error('🎵 ❌ Audio file not found:', response.status, response.statusText);
            } else {
              console.error('🎵 ❌ Audio file exists but failed to load - likely codec issue');
            }
          })
          .catch(fetchError => {
            console.error('🎵 ❌ Failed to verify audio file existence:', fetchError);
          });

        setIsLoading(false);
        setCurrentTrack(null); // Clear failed track
      }, { once: true });
    } else {
      console.error('🎵 ❌ Audio reference is null!');
    }
  }, [audioSettings]);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      console.error('🎵 ❌ Cannot play - audio element not initialized');
      return;
    }

    if (!currentTrack) {
      console.error('🎵 ❌ Cannot play - no track loaded');
      return;
    }

    if (!musicEnabled) {
      console.log('🎵 ❌ Cannot play - music disabled by user');
      return;
    }

    try {
      console.log('🎵 Playing:', currentTrack.name);

      // Check audio readiness
      if (audioRef.current.readyState < 2) {
        console.log('🎵 Audio not ready, waiting...');
        setIsLoading(true);

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio loading timeout'));
          }, 10000); // 10 second timeout

          const onCanPlay = () => {
            clearTimeout(timeout);
            audioRef.current?.removeEventListener('canplay', onCanPlay);
            audioRef.current?.removeEventListener('error', onError);
            resolve(true);
          };

          const onError = (e: Event) => {
            clearTimeout(timeout);
            audioRef.current?.removeEventListener('canplay', onCanPlay);
            audioRef.current?.removeEventListener('error', onError);
            reject(new Error('Audio loading failed'));
          };

          audioRef.current?.addEventListener('canplay', onCanPlay);
          audioRef.current?.addEventListener('error', onError);
        });
      }

      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
      console.log('🎵 ✅ Playback started successfully');

    } catch (error: any) {
      setIsPlaying(false);
      setIsLoading(false);

      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        console.log('🎵 ⚠️ Autoplay blocked - user interaction required');
      } else if (error.name === 'NotSupportedError') {
        console.error('🎵 ❌ Audio format not supported:', currentTrack.filename);
      } else if (error.name === 'AbortError') {
        console.log('🎵 ⚠️ Playback aborted (likely due to new track loading)');
      } else {
        console.error('🎵 ❌ Playback failed:', error.message || error);
      }
    }
  }, [currentTrack, musicEnabled]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const pauseAndSavePosition = useCallback(() => {
    if (audioRef.current) {
      setSavedPosition(audioRef.current.currentTime);
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resumeFromSavedPosition = useCallback(async () => {
    if (audioRef.current && savedPosition > 0) {
      audioRef.current.currentTime = savedPosition;
      setSavedPosition(0); // Clear saved position
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error resuming audio from saved position:', error);
        setIsPlaying(false);
      }
    } else {
      // Fallback to regular play
      play();
    }
  }, [savedPosition, play]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    console.log(`🎵 Loading track: ${track.name}`);
    console.log(`🎵 Audio file path: /assets/Music/${track.filename}`);
    loadTrack(track);
    // Wait a bit for the track to load before playing
    setTimeout(async () => {
      console.log('🎵 Attempting to play track after loading...');
      try {
        await play();
        console.log('🎵 ✅ Track started successfully');
      } catch (error) {
        console.error('🎵 ❌ Failed to play track:', error);
      }
    }, 500); // Increased delay to ensure loading
  }, [loadTrack, play]);

  const handleTrackEnd = useCallback(() => {
    if (repeat === 'one') {
      seek(0);
      play();
      return;
    }

    if (playlist.length > 0) {
      let nextIndex = currentPlaylistIndex + 1;
      if (nextIndex >= playlist.length) {
        if (repeat === 'all') nextIndex = 0; else { setIsPlaying(false); return; }
      }
      setCurrentPlaylistIndex(nextIndex);
      playTrack(playlist[nextIndex]);
      return;
    }

    // Fallback: no playlist set. Continue through global track list for continuous music
    if (currentTrack) {
      const globalIndex = musicTracks.findIndex(t => t.id === currentTrack.id);
      let nextGlobalIndex = globalIndex + 1;
      if (nextGlobalIndex >= musicTracks.length) {
        if (repeat === 'all') nextGlobalIndex = 0; else { setIsPlaying(false); return; }
      }
      const next = musicTracks[nextGlobalIndex];
      if (next) playTrack(next); else setIsPlaying(false);
    } else {
      // Nothing loaded; start playing all if repeat-all desired
      if (repeat === 'all' && musicTracks.length > 0) {
        playTrack(musicTracks[0]);
      } else {
        setIsPlaying(false);
      }
    }
  }, [repeat, playlist, currentPlaylistIndex, seek, play, playTrack, currentTrack]);

  const nextTrack = useCallback(() => {
    if (playlist.length > 0) {
      let nextIndex = currentPlaylistIndex + 1;
      if (nextIndex >= playlist.length) nextIndex = 0;
      setCurrentPlaylistIndex(nextIndex);
      playTrack(playlist[nextIndex]);
      return;
    }
    // Fallback to global list
    if (currentTrack) {
      const idx = musicTracks.findIndex(t => t.id === currentTrack.id);
      const nextIdx = (idx + 1) % musicTracks.length;
      playTrack(musicTracks[nextIdx]);
    } else if (musicTracks.length > 0) {
      playTrack(musicTracks[0]);
    }
  }, [playlist, currentPlaylistIndex, playTrack, currentTrack]);

  const previousTrack = useCallback(() => {
    if (playlist.length > 0) {
      let prevIndex = currentPlaylistIndex - 1;
      if (prevIndex < 0) prevIndex = playlist.length - 1;
      setCurrentPlaylistIndex(prevIndex);
      playTrack(playlist[prevIndex]);
      return;
    }
    // Fallback to global list
    if (currentTrack) {
      const idx = musicTracks.findIndex(t => t.id === currentTrack.id);
      const prevIdx = (idx - 1 + musicTracks.length) % musicTracks.length;
      playTrack(musicTracks[prevIdx]);
    } else if (musicTracks.length > 0) {
      playTrack(musicTracks[musicTracks.length - 1]);
    }
  }, [playlist, currentPlaylistIndex, playTrack, currentTrack]);

  const createPlaylist = useCallback((tracks: Track[], startIndex = 0) => {
    console.log(`Creating playlist with ${tracks.length} tracks`);
    let finalTracks = [...tracks];

    if (shuffle) {
      // Shuffle the tracks
      for (let i = finalTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalTracks[i], finalTracks[j]] = [finalTracks[j], finalTracks[i]];
      }
    }

    setPlaylist(finalTracks);
    setCurrentPlaylistIndex(startIndex);

    if (finalTracks.length > 0) {
      playTrack(finalTracks[startIndex]);
    }
  }, [shuffle, playTrack]);

  const playAllTracks = useCallback(() => {
    createPlaylist(musicTracks);
  }, [createPlaylist]);

  const updateAudioSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    console.log('🎵 Updating audio settings:', newSettings);
    setAudioSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleMusicEnabled = useCallback(() => {
    const newEnabled = !musicEnabled;
    console.log('🎵 Toggling music enabled:', newEnabled);
    setMusicEnabled(newEnabled);

    if (!newEnabled && isPlaying) {
      pause();
    }
  }, [musicEnabled, isPlaying, pause]);

  // Video-aware music control
  const pauseForVideo = useCallback(() => {
    console.log('🎵 🎬 Pausing music for video');
    if (isPlaying) {
      pauseAndSavePosition();
      setVideoPaused(true);
    }
  }, [isPlaying, pauseAndSavePosition]);

  const resumeFromVideo = useCallback(async () => {
    console.log('🎵 🎬 Resuming music after video');
    if (videoPaused) {
      setVideoPaused(false);
      await resumeFromSavedPosition();
    }
  }, [videoPaused, resumeFromSavedPosition]);

  const onVideoPlay = useCallback(() => {
    console.log('🎵 🎬 Video started playing');
    setVideoPlaying(true);
    pauseForVideo();
  }, [pauseForVideo]);

  const onVideoPause = useCallback(() => {
    console.log('🎵 🎬 Video paused');
    setVideoPlaying(false);
    // Don't resume music on video pause, only on video end
  }, []);

  const onVideoEnd = useCallback(() => {
    console.log('🎵 🎬 Video ended');
    setVideoPlaying(false);
    resumeFromVideo();
  }, [resumeFromVideo]);

  const playByCategory = useCallback((category: Track['category']) => {
    const categoryTracks = musicTracks.filter(track => track.category === category);
    createPlaylist(categoryTracks);
  }, [createPlaylist]);

  return {
    // Playback state
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    playlist,
    currentPlaylistIndex,
    shuffle,
    repeat,
    savedPosition,

    // Controls
    play,
    pause,
    pauseAndSavePosition,
    resumeFromSavedPosition,
    stop,
    seek,
    playTrack,
    nextTrack,
    previousTrack,
    createPlaylist,
    playAllTracks,

    // Settings
    setShuffle,
    setRepeat,

    // Audio settings
    audioSettings,
    updateAudioSettings,
    playByCategory,

    // Data
    allTracks: musicTracks,

    // Music enabled state
    musicEnabled,
    toggleMusicEnabled,

    // Video integration
    videoPaused,
    videoPlaying,
    pauseForVideo,
    resumeFromVideo,
    onVideoPlay,
    onVideoPause,
    onVideoEnd,
  };
};