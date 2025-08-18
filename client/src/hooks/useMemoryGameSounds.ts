import { useCallback, useRef, useEffect } from 'react';
import { useAudioManager } from '@/contexts/AudioManagerContext';

export const useMemoryGameSounds = () => {
  const { audioSettings } = useAudioManager();
  const flipSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameStartSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  const levelCompleteSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio files
  useEffect(() => {
    flipSoundRef.current = new Audio('/assets/game3/sounds/flipcard-91468.mp3');
    flipSoundRef.current.volume = 0.4;
    flipSoundRef.current.preload = 'auto';

    gameStartSoundRef.current = new Audio('/assets/sounds/game-start-317318.mp3');
    gameStartSoundRef.current.volume = 0.5;
    gameStartSoundRef.current.preload = 'auto';

    gameOverSoundRef.current = new Audio('/assets/sounds/game-over-deep-male-voice-clip-352695.mp3');
    gameOverSoundRef.current.volume = 0.6;
    gameOverSoundRef.current.preload = 'auto';

    levelCompleteSoundRef.current = new Audio('/assets/game6/correct-6033.mp3');
    levelCompleteSoundRef.current.volume = 0.5;
    levelCompleteSoundRef.current.preload = 'auto';

    return () => {
      // Cleanup
      [flipSoundRef, gameStartSoundRef, gameOverSoundRef, levelCompleteSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.src = '';
          ref.current = null;
        }
      });
    };
  }, []);

  const playSound = useCallback((soundRef: React.RefObject<HTMLAudioElement>) => {
    if (audioSettings.muteAll || !soundRef.current) return;
    
    try {
      soundRef.current.currentTime = 0;
      soundRef.current.volume = (audioSettings.sfxVolume / 100) * 0.5;
      soundRef.current.play().catch(e => console.log('Sound play failed:', e));
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }, [audioSettings.muteAll, audioSettings.sfxVolume]);

  const playFlipSound = useCallback(() => {
    playSound(flipSoundRef);
  }, [playSound]);

  const playGameStartSound = useCallback(() => {
    playSound(gameStartSoundRef);
  }, [playSound]);

  const playGameOverSound = useCallback(() => {
    playSound(gameOverSoundRef);
  }, [playSound]);

  const playLevelCompleteSound = useCallback(() => {
    playSound(levelCompleteSoundRef);
  }, [playSound]);

  return {
    playFlipSound,
    playGameStartSound,
    playGameOverSound,
    playLevelCompleteSound
  };
};