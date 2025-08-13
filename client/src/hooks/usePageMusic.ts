import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudioManager } from './useAudioManager';

interface PageMusicConfig {
  [path: string]: {
    specificTrack?: string;
  };
}

const pageMusicConfig: PageMusicConfig = {
  '/': { specificTrack: 'discovery-of-iris.mp3' },
  // Removed leaderboard-specific music; music now only controlled by the global player
  '/wheel-of-iris': { specificTrack: 'love-story.mp3' },
};

export const usePageMusic = () => {
  const location = useLocation();
  const { playTrack, allTracks, currentTrack, playAllTracks, isPlaying, musicEnabled } = useAudioManager();

  // Disable any page-driven auto-start. Music is controlled solely by the Music Player.
  useEffect(() => {
    // no-op
  }, []);

  useEffect(() => {
    const config = pageMusicConfig[location.pathname];
    
    // Add a delay to prevent rapid track switching during navigation
    const timeoutId = setTimeout(() => {
      // If a specific track is requested for this page
      if (config?.specificTrack) {
        const track = allTracks.find(t => t.filename === config.specificTrack);
        if (track && (!currentTrack || currentTrack.filename !== config.specificTrack)) {
          console.log(`Switching to specific track: ${track.name} for page: ${location.pathname}`);
          playTrack(track);
        }
      } else {
        // Do not auto-start generic music here; MusicPlayer controls app music
        console.log(`Page ${location.pathname} has no specific track; deferring to MusicPlayer`);
      }
    }, 500); // 500ms delay to prevent rapid switching

    return () => clearTimeout(timeoutId);
  }, [location.pathname, playTrack, allTracks, currentTrack, playAllTracks, isPlaying]);

  return {
    currentPageConfig: pageMusicConfig[location.pathname],
  };
};