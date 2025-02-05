import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateImage } from '../../services/image/imageGenerationService';
import { storeGeneration } from '../../services/image/generationStorageService';

interface UseImageGenerationResult {
  generatedImages: string[];
  selectedImage: string | null;
  loading: boolean;
  error: string | null;
  generateAndStore: (
    prompt: string, 
    referenceImageUrl?: string | null, 
    visionAnalysis?: string | null,
    aspectRatio?: string
  ) => Promise<void>;
  selectImage: (index: number) => void;
}

export const useImageGeneration = (): UseImageGenerationResult => {
  const { session } = useAuth();
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAndStore = useCallback(async (
    prompt: string,
    referenceImageUrl?: string | null,
    visionAnalysis?: string | null,
    aspectRatio?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!session) {
        throw new Error('Authentication required');
      }

      const { imageUrls, variationUrls } = await generateImage(prompt, session, { aspectRatio });
      setGeneratedImages(imageUrls);
      setSelectedImage(imageUrls[0] || null);

      await storeGeneration({
        prompt,
        imageUrl: imageUrls[0], // Still store the first one as the main image URL
        variationUrls: variationUrls, // Store all variation URLs
        referenceImageUrl,
        visionAnalysis
      }, session);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const selectImage = useCallback((index: number) => {
    if (index >= 0 && index < generatedImages.length) {
      setSelectedImage(generatedImages[index]);
    }
  }, [generatedImages]);

  return {
    generatedImages,
    selectedImage,
    loading,
    error,
    generateAndStore,
    selectImage
  };
};
