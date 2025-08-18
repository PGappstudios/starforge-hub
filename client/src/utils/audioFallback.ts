// Audio fallback utility for deployment environments
// Handles browser autoplay policies and audio loading issues

interface AudioConfig {
  volume: number;
  preload?: string;
  loop?: boolean;
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private userInteracted = false;

  constructor() {
    // Enable audio after first user interaction
    this.enableAudioOnInteraction();
  }

  private enableAudioOnInteraction() {
    const enableAudio = () => {
      this.userInteracted = true;
      console.log('🎵 User interaction detected - audio enabled');
      
      // Initialize AudioContext if needed
      if (!this.audioContext && typeof AudioContext !== 'undefined') {
        try {
          this.audioContext = new AudioContext();
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
        } catch (error) {
          console.warn('🎵 AudioContext not supported:', error);
        }
      }

      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });
  }

  async createAudio(src: string, config: AudioConfig = { volume: 1.0 }): Promise<HTMLAudioElement> {
    // Check if audio is already cached
    if (this.audioCache.has(src)) {
      const cachedAudio = this.audioCache.get(src)!;
      cachedAudio.volume = config.volume;
      return cachedAudio;
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      // Set up error handling
      audio.addEventListener('error', (e) => {
        const error = audio.error;
        let errorMessage = 'Unknown audio error';
        
        if (error) {
          switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Audio loading aborted';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error loading audio';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Audio decoding error';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Audio format not supported';
              break;
          }
        }

        console.error(`🎵 ❌ Audio loading failed for ${src}:`, errorMessage);
        reject(new Error(errorMessage));
      });

      // Set up success handling
      audio.addEventListener('canplaythrough', () => {
        console.log(`🎵 ✅ Audio loaded successfully: ${src}`);
        this.audioCache.set(src, audio);
        resolve(audio);
      }, { once: true });

      // Configure audio
      audio.volume = config.volume;
      audio.preload = (config.preload as 'none' | 'metadata' | 'auto') || 'auto';
      audio.loop = config.loop || false;
      
      // Start loading
      audio.src = src;
      audio.load();
    });
  }

  async playAudio(src: string, config: AudioConfig = { volume: 1.0 }): Promise<void> {
    if (!this.userInteracted) {
      console.warn(`🎵 ⚠️ Cannot play ${src} - waiting for user interaction`);
      return;
    }

    try {
      const audio = await this.createAudio(src, config);
      
      // Reset audio to beginning if it's already playing
      audio.currentTime = 0;
      
      // Play with promise handling for newer browsers
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log(`🎵 ▶️ Playing: ${src}`);
      }
    } catch (error) {
      console.error(`🎵 ❌ Failed to play ${src}:`, error);
      
      // Try to verify if file exists
      try {
        const response = await fetch(src, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`🎵 ❌ Audio file not found: ${src} (${response.status})`);
        } else {
          console.error(`🎵 ❌ Audio file exists but playback failed: ${src}`);
        }
      } catch (fetchError) {
        console.error(`🎵 ❌ Cannot verify audio file existence: ${src}`, fetchError);
      }
    }
  }

  // Preload multiple audio files
  async preloadAudios(audioSources: Array<{ src: string; config?: AudioConfig }>): Promise<void> {
    const loadPromises = audioSources.map(({ src, config }) => 
      this.createAudio(src, config || { volume: 1.0 }).catch(error => {
        console.warn(`🎵 ⚠️ Failed to preload ${src}:`, error);
        return null;
      })
    );

    await Promise.all(loadPromises);
    console.log(`🎵 📦 Preloaded ${audioSources.length} audio files`);
  }

  // Check if audio is supported
  isAudioSupported(): boolean {
    return typeof Audio !== 'undefined';
  }

  // Get user interaction status
  hasUserInteracted(): boolean {
    return this.userInteracted;
  }
}

// Create singleton instance
export const audioManager = new AudioManager();

// Helper functions for common game sounds
export const playGameSound = async (soundPath: string, volume: number = 1.0) => {
  await audioManager.playAudio(soundPath, { volume });
};

export const preloadGameSounds = async (soundPaths: string[]) => {
  const audioSources = soundPaths.map(src => ({ src, config: { volume: 1.0 } }));
  await audioManager.preloadAudios(audioSources);
};

// Export for backward compatibility
export default audioManager;