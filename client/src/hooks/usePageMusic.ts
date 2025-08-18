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
    // Completely disable automatic music starting from page navigation
    // All music control is now handled solely by the MusicPlayer component
    console.log(`Page ${location.pathname} loaded - music control disabled, use MusicPlayer only`);
  }, [location.pathname]);

  return {
    currentPageConfig: pageMusicConfig[location.pathname],
  };
};