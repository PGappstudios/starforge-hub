import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioManager as useAudioManagerHook } from '@/hooks/useAudioManager';

// Create the context type based on the return type of useAudioManager hook
type AudioManagerContextType = ReturnType<typeof useAudioManagerHook>;

const AudioManagerContext = createContext<AudioManagerContextType | undefined>(undefined);

interface AudioManagerProviderProps {
  children: ReactNode;
}

export const AudioManagerProvider: React.FC<AudioManagerProviderProps> = ({ children }) => {
  const audioManager = useAudioManagerHook();

  return (
    <AudioManagerContext.Provider value={audioManager}>
      {children}
    </AudioManagerContext.Provider>
  );
};

export const useAudioManager = (): AudioManagerContextType => {
  const context = useContext(AudioManagerContext);
  if (context === undefined) {
    throw new Error('useAudioManager must be used within an AudioManagerProvider');
  }
  return context;
};