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
  { id: '8', name: 'AHR Visits Earth', filename: 'ahr-visits-earth.mp3', category: 'menu' },
  { id: '9', name: 'Love Story', filename: 'love-story.mp3', category: 'ambient' },
  { id: '10', name: 'Singing of the Peace Treaty', filename: 'singing-of-the-peace-treaty.mp3', category: 'ambient' },
  { id: '11', name: 'Assassination of Paizul', filename: 'assassination-of-paizul.mp3', category: 'action' },
  { id: '12', name: 'Paizul Funeral Procession', filename: 'paizul-funeral-procession.mp3', category: 'ambient' },
];

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muteAll: boolean;
}

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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    masterVolume: 75,
    musicVolume: 60,
    sfxVolume: 80,
    muteAll: false,
  });

  // Initialize audio element
  useEffect(() => {
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
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  // Update volume when settings change
  useEffect(() => {
    if (audioRef.current) {
      const effectiveVolume = audioSettings.muteAll 
        ? 0 
        : (audioSettings.masterVolume / 100) * (audioSettings.musicVolume / 100);
      audioRef.current.volume = effectiveVolume;
    }
  }, [audioSettings]);

  const loadTrack = useCallback((track: Track) => {
    if (audioRef.current) {
      setIsLoading(true);
      audioRef.current.src = `/assets/Music/${track.filename}`;
      setCurrentTrack(track);
      setCurrentTime(0);
    }
  }, []);

  const play = useCallback(async () => {
    if (audioRef.current && currentTrack) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      }
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

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
    loadTrack(track);
    // Wait a bit for the track to load
    setTimeout(() => {
      play();
    }, 100);
  }, [loadTrack, play]);

  const handleTrackEnd = useCallback(() => {
    if (repeat === 'one') {
      seek(0);
      play();
    } else if (playlist.length > 0) {
      let nextIndex = currentPlaylistIndex + 1;
      
      if (nextIndex >= playlist.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
      
      setCurrentPlaylistIndex(nextIndex);
      playTrack(playlist[nextIndex]);
    } else {
      setIsPlaying(false);
    }
  }, [repeat, playlist, currentPlaylistIndex, seek, play, playTrack]);

  const nextTrack = useCallback(() => {
    if (playlist.length === 0) return;
    
    let nextIndex = currentPlaylistIndex + 1;
    if (nextIndex >= playlist.length) {
      nextIndex = 0;
    }
    
    setCurrentPlaylistIndex(nextIndex);
    playTrack(playlist[nextIndex]);
  }, [playlist, currentPlaylistIndex, playTrack]);

  const previousTrack = useCallback(() => {
    if (playlist.length === 0) return;
    
    let prevIndex = currentPlaylistIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }
    
    setCurrentPlaylistIndex(prevIndex);
    playTrack(playlist[prevIndex]);
  }, [playlist, currentPlaylistIndex, playTrack]);

  const createPlaylist = useCallback((tracks: Track[], startIndex = 0) => {
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

  const playByCategory = useCallback((category: Track['category']) => {
    const categoryTracks = musicTracks.filter(track => track.category === category);
    createPlaylist(categoryTracks);
  }, [createPlaylist]);

  const updateAudioSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setAudioSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

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
    
    // Controls
    play,
    pause,
    stop,
    seek,
    playTrack,
    nextTrack,
    previousTrack,
    createPlaylist,
    playByCategory,
    
    // Settings
    setShuffle,
    setRepeat,
    
    // Audio settings
    audioSettings,
    updateAudioSettings,
    
    // Data
    allTracks: musicTracks,
  };
};