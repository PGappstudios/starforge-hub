import { useState, useEffect } from 'react';
import { CargoItemType, CARGO_CONFIG } from '@/types/maze';

export interface CargoImages {
  player: HTMLImageElement;
  cssStation: HTMLImageElement;
  cargoItems: Record<CargoItemType, HTMLImageElement>;
  enemy: HTMLImageElement;
}

export const useMazeImageLoader = () => {
  const [images, setImages] = useState<CargoImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    };

    const loadAllImages = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load player
        const player = await loadImage('/assets/game6/Images/p1.png');
        
        // Load CSS station (use the 10.png image as requested)
        const cssStation = await loadImage('/assets/game6/Images/10.png');
        
        // Load enemy image
        const enemy = await loadImage('/assets/game6/enemies/iris.png');

        // Load all cargo items
        const cargoItemPromises = Object.entries(CARGO_CONFIG.ITEM_DEFINITIONS).map(
          async ([itemType, definition]) => {
            console.log(`Loading cargo item: ${itemType} -> ${definition.fileName}`);
            const image = await loadImage(`/assets/game6/Images/${definition.fileName}`);
            return [itemType as CargoItemType, image] as const;
          }
        );

        const cargoItemResults = await Promise.all(cargoItemPromises);
        const cargoItems = Object.fromEntries(cargoItemResults) as Record<CargoItemType, HTMLImageElement>;

        const cargoImages: CargoImages = {
          player,
          cssStation,
          cargoItems,
          enemy
        };

        setImages(cargoImages);
        console.log('✅ Cargo images loaded successfully', {
          player: !!player,
          cssStation: !!cssStation,
          enemy: !!enemy,
          cargoItemsCount: Object.keys(cargoItems).length
        });
      } catch (err) {
        console.error('❌ Error loading cargo images:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    loadAllImages();
  }, []);

  return { images, loading, error };
};