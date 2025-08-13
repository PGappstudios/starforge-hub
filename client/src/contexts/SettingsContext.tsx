import { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  showIntroVideo: boolean;
  setShowIntroVideo: (show: boolean) => void;
  pauseMusicForVideo: boolean;
  setPauseMusicForVideo: (pause: boolean) => void;
  videoMusicBehavior: 'pause' | 'duck' | 'continue';
  setVideoMusicBehavior: (behavior: 'pause' | 'duck' | 'continue') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [showIntroVideo, setShowIntroVideo] = useState(() => {
    // Load from localStorage or default to true
    const saved = localStorage.getItem('starsekers-show-intro-video');
    return saved ? JSON.parse(saved) : true;
  });

  const [pauseMusicForVideo, setPauseMusicForVideoState] = useState(() => {
    const saved = localStorage.getItem('starsekers-pause-music-for-video');
    return saved ? JSON.parse(saved) : true;
  });

  const [videoMusicBehavior, setVideoMusicBehaviorState] = useState<'pause' | 'duck' | 'continue'>(() => {
    const saved = localStorage.getItem('starsekers-video-music-behavior');
    return saved ? JSON.parse(saved) : 'pause';
  });

  const handleSetShowIntroVideo = (show: boolean) => {
    setShowIntroVideo(show);
    localStorage.setItem('starsekers-show-intro-video', JSON.stringify(show));
  };

  const handleSetPauseMusicForVideo = (pause: boolean) => {
    setPauseMusicForVideoState(pause);
    localStorage.setItem('starsekers-pause-music-for-video', JSON.stringify(pause));
  };

  const handleSetVideoMusicBehavior = (behavior: 'pause' | 'duck' | 'continue') => {
    setVideoMusicBehaviorState(behavior);
    localStorage.setItem('starsekers-video-music-behavior', JSON.stringify(behavior));
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        showIntroVideo, 
        setShowIntroVideo: handleSetShowIntroVideo,
        pauseMusicForVideo,
        setPauseMusicForVideo: handleSetPauseMusicForVideo,
        videoMusicBehavior,
        setVideoMusicBehavior: handleSetVideoMusicBehavior
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};