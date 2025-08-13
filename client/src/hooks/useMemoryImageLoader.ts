import { useState, useEffect, useCallback } from 'react';

export interface MemoryImage {
  name: string;
  url: string;
}

const AVAILABLE_IMAGES = [
  '1009219_full.jpeg',
  '1023820_full.jpeg',
  '1059495_full.jpeg',
  '1079402_full.jpeg',
  '1082344_full.jpeg',
  '1082371_full.jpeg',
  '1082378_full.jpeg',
  '1082398_full.jpeg',
  '1083174_full.jpeg',
  '1142695_full.jpeg',
  '1148042_full.jpeg',
  '1148077_full.jpeg',
  '1182455_full.jpeg',
  '1210384_full.jpeg',
  '1260886_full.jpeg',
  '1270088_full.jpeg',
  '1364166_full.jpeg',
  '150583_full.jpeg',
  '157497_full (1).jpeg',
  '157497_full.jpeg',
  '175947_full.jpeg',
  '187974_full (1).jpeg',
  '187974_full.jpeg',
  '24036_full.jpeg',
  '549749_full.jpeg',
  '583898_full (1).jpeg',
  '583898_full.jpeg',
  '679083_full.jpeg',
  '723311_full.jpeg',
  '774058_full.jpeg',
  '788531_full.jpeg',
  '795430_full.jpeg',
  '813981_full.jpeg',
  '816551_full.jpeg',
  '832188_full.jpeg',
  '8437_full.jpeg',
  '873688_full.jpeg',
  '902105_full.jpeg',
  '944478_full.jpeg',
  '95246_full.jpeg',
  '95251_full (1).jpeg',
  '95251_full.jpeg',
  '95604_full (1).jpeg',
  '95604_full.jpeg'
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useMemoryImageLoader = (pairsCount: number = 8) => {
  const [images, setImages] = useState<MemoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRandomImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Randomly select images for the game
      const shuffledImages = shuffleArray(AVAILABLE_IMAGES);
      const selectedImages = shuffledImages.slice(0, pairsCount);

      // Create image objects with URLs
      const memoryImages: MemoryImage[] = selectedImages.map(imageName => ({
        name: imageName,
        url: `/assets/game3/Images/${imageName}`
      }));

      // Preload images to ensure they exist
      const imagePromises = memoryImages.map(img => {
        return new Promise<MemoryImage>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(img);
          image.onerror = () => reject(new Error(`Failed to load ${img.name}`));
          image.src = img.url;
        });
      });

      const loadedImages = await Promise.all(imagePromises);
      setImages(loadedImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
      console.error('Error loading memory game images:', err);
    } finally {
      setLoading(false);
    }
  }, [pairsCount]);

  useEffect(() => {
    loadRandomImages();
  }, [loadRandomImages]);

  const reloadImages = () => {
    loadRandomImages();
  };

  return {
    images,
    loading,
    error,
    reloadImages
  };
};