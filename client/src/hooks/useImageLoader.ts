import { useState, useEffect } from 'react';

export interface LoadedImages {
  player: HTMLImageElement;
  enemies: {
    e1: HTMLImageElement;
    e2: HTMLImageElement;
    e3: HTMLImageElement;
    e4: HTMLImageElement;
    e5: HTMLImageElement;
    e6: HTMLImageElement;
    c8: HTMLImageElement;
    c9: HTMLImageElement;
    c10: HTMLImageElement;
    c11: HTMLImageElement;
    boss: HTMLImageElement;
  };
  asteroids: {
    a1: HTMLImageElement;
    a2: HTMLImageElement;
    a3: HTMLImageElement;
  };
  planets: {
    '1': HTMLImageElement;
    '2': HTMLImageElement;
    '3': HTMLImageElement;
    '4': HTMLImageElement;
    '5': HTMLImageElement;
    '6': HTMLImageElement;
    '7': HTMLImageElement;
    '8': HTMLImageElement;
    '9': HTMLImageElement;
    '10': HTMLImageElement;
    '11': HTMLImageElement;
    '12': HTMLImageElement;
    '13': HTMLImageElement;
    '14': HTMLImageElement;
    '15': HTMLImageElement;
    w1: HTMLImageElement;
    w2: HTMLImageElement;
    w3: HTMLImageElement;
    w4: HTMLImageElement;
    w5: HTMLImageElement;
  };
}

export const useImageLoader = () => {
  const [images, setImages] = useState<LoadedImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        console.log(`Loading image: ${src}`);
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
        console.log('🎮 Starting to load all game images...');
        setLoading(true);
        setError(null);

        const [
          player,
          e1, e2, e3, e4, e5, e6,
          c8, c9, c10, c11, boss,
          a1, a2, a3,
          p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15,
          w1, w2, w3, w4, w5
        ] = await Promise.all([
          loadImage('/assets/game1/player.png'),
          loadImage('/assets/game1/smallenemies/e1.png'),
          loadImage('/assets/game1/smallenemies/e2.png'),
          loadImage('/assets/game1/smallenemies/e3.png'),
          loadImage('/assets/game1/smallenemies/e4.png'),
          loadImage('/assets/game1/smallenemies/e5.png'),
          loadImage('/assets/game1/smallenemies/e6.png'),
          loadImage('/assets/game1/Bigenemies/c8.png'),
          loadImage('/assets/game1/Bigenemies/c9.png'),
          loadImage('/assets/game1/Bigenemies/c10.png'),
          loadImage('/assets/game1/finalboss/c11.png'),
          loadImage('/assets/game1/finalboss/c11.png'),
          loadImage('/assets/game1/Asteroids/a1.imageset/a1.png'),
          loadImage('/assets/game1/Asteroids/a2.imageset/a2.png'),
          loadImage('/assets/game1/Asteroids/a3.imageset/a3.png'),
          loadImage('/assets/game1/Planets/1.imageset/1.png'),
          loadImage('/assets/game1/Planets/2.imageset/2.png'),
          loadImage('/assets/game1/Planets/3.imageset/3.png'),
          loadImage('/assets/game1/Planets/4.imageset/4.png'),
          loadImage('/assets/game1/Planets/5.imageset/5.png'),
          loadImage('/assets/game1/Planets/6.imageset/6.png'),
          loadImage('/assets/game1/Planets/7.imageset/7.png'),
          loadImage('/assets/game1/Planets/8.imageset/8.png'),
          loadImage('/assets/game1/Planets/9.imageset/9.png'),
          loadImage('/assets/game1/Planets/10.imageset/10.png'),
          loadImage('/assets/game1/Planets/11.imageset/11.png'),
          loadImage('/assets/game1/Planets/12.imageset/12.png'),
          loadImage('/assets/game1/Planets/13.imageset/13.png'),
          loadImage('/assets/game1/Planets/14.imageset/14.png'),
          loadImage('/assets/game1/Planets/15.imageset/15.png'),
          loadImage('/assets/game1/Planets/w1.imageset/w1.png'),
          loadImage('/assets/game1/Planets/w2.imageset/w2.png'),
          loadImage('/assets/game1/Planets/w3.imageset/w3.png'),
          loadImage('/assets/game1/Planets/w4.imageset/w4.png'),
          loadImage('/assets/game1/Planets/w5.imageset/w5.png'),
        ]);

        console.log('✅ All images loaded successfully!');
        setImages({
          player,
          enemies: { e1, e2, e3, e4, e5, e6, c8, c9, c10, c11, boss },
          asteroids: { a1, a2, a3 },
          planets: { 
            '1': p1, '2': p2, '3': p3, '4': p4, '5': p5, '6': p6, '7': p7, '8': p8, '9': p9, '10': p10,
            '11': p11, '12': p12, '13': p13, '14': p14, '15': p15,
            w1, w2, w3, w4, w5
          }
        });
        setLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load images';
        console.error('❌ Image loading failed:', errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    };

    loadAllImages();
  }, []);

  return { images, loading, error };
};