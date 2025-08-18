import { useCallback } from 'react';
import { useAudioManager } from '@/contexts/AudioManagerContext';

export const useMemoryGameSounds = () => {
  const { audioSettings } = useAudioManager();

  const playSound = useCallback((soundFile: string) => {
    // All game sounds disabled - music player controls all audio
    return;
  }, []);

  const playFlipSound = useCallback(() => {
    // Sound disabled
  }, []);

  const playGameStartSound = useCallback(() => {
    // Sound disabled
  }, []);

  const playGameOverSound = useCallback(() => {
    // Sound disabled
  }, []);

  const playLevelCompleteSound = useCallback(() => {
    // Sound disabled
  }, []);

  return {
    playFlipSound,
    playGameStartSound,
    playGameOverSound,
    playLevelCompleteSound
  };
};