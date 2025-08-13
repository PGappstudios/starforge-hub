import { useState, useEffect } from 'react';
import { LoadedSnakeImages } from '@/types/snake';

export const useSnakeImageLoader = () => {
  const [images, setImages] = useState<LoadedSnakeImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        console.log(`Loading snake game image: ${src}`);
        const img = new Image();
        img.onload = () => {
          console.log(`✓ Successfully loaded: ${src}`);
          resolve(img);
        };
        img.onerror = () => {
          console.error(`✗ Failed to load image: ${src}`);
          reject(new Error(`Failed to load image: ${src}`));
        };
        img.src = src;
      });
    };

    const loadAllImages = async () => {
      try {
        console.log('🐍 Starting to load all snake game images...');
        setLoading(true);
        setError(null);

        const [
          player,
          ammo, food, fuel, tool,
          e1, e2, e4, e6, c8, c9, c11
        ] = await Promise.all([
          loadImage('/assets/game2/player/p1.png'),
          loadImage('/assets/game2/R4/AMMO.png'),
          loadImage('/assets/game2/R4/FOOD.png'),
          loadImage('/assets/game2/R4/FUEL.png'),
          loadImage('/assets/game2/R4/TOOL.png'),
          loadImage('/assets/game2/enemies/e1.png'),
          loadImage('/assets/game2/enemies/e2.png'),
          loadImage('/assets/game2/enemies/e4.png'),
          loadImage('/assets/game2/enemies/e6.png'),
          loadImage('/assets/game2/enemies/c8.png'),
          loadImage('/assets/game2/enemies/c9.png'),
          loadImage('/assets/game2/enemies/c11.png'),
        ]);

        console.log('✅ All snake game images loaded successfully!');
        setImages({
          player,
          resources: { ammo, food, fuel, tool },
          enemies: { e1, e2, e4, e6, c8, c9, c11 }
        });
        setLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load snake game images';
        console.error('❌ Snake game image loading failed:', errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    };

    loadAllImages();
  }, []);

  return { images, loading, error };
};