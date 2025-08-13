import { useCallback } from 'react';

export const useMemoryGameSounds = () => {
  const playSound = useCallback((soundPath: string, volume: number = 0.5) => {
    try {
      const audio = new Audio(soundPath);
      audio.volume = volume;
      audio.play().catch(error => {
        console.warn('Failed to play sound:', error);
      });
    } catch (error) {
      console.warn('Failed to create audio:', error);
    }
  }, []);

  const playCardFlip = useCallback(() => {
    playSound('/assets/game3/sounds/flipcard-91468.mp3', 0.4);
  }, [playSound]);

  const playGameStart = useCallback(() => {
    playSound('/assets/game3/sounds/game-start-317318.mp3', 0.6);
  }, [playSound]);

  const playGameOver = useCallback(() => {
    playSound('/assets/sounds/game-over-deep-male-voice-clip-352695.mp3', 0.7);
  }, [playSound]);

  const playLevelComplete = useCallback(() => {
    const congratsSounds = [
      '/assets/game3/sounds/Congrats/congratulations-male-spoken-264675.mp3',
      '/assets/game3/sounds/Congrats/congratulations-message-notification-sound-sfx-1-334724.mp3',
      '/assets/game3/sounds/Congrats/sci-fi-congratulations-message-notification-sound-sfx-334728.mp3'
    ];
    const randomSound = congratsSounds[Math.floor(Math.random() * congratsSounds.length)];
    playSound(randomSound, 0.8);
  }, [playSound]);

  return {
    playCardFlip,
    playGameStart,
    playGameOver,
    playLevelComplete
  };
};