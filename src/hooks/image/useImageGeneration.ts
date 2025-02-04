import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateImage } from '../../services/image/imageGenerationService';
import { storeGeneration } from '../../services/image/generationStorageService';

interface UseImageGenerationResult {
  generatedImage: string | null;
  loading: boolean;
  error: string | null;
  generateAndStore: (prompt: string, referenceImageUrl?: string | null, visionAnalysis?: string | null) => Promise<void>;
}

export const useImageGeneration = (): UseImageGenerationResult => {
  const { session } = useAuth();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAndStore = useCallback(async (
    prompt: string,
    referenceImageUrl?: string | null,
    visionAnalysis?: string | null
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!session) {
        throw new Error('Authentication required');
      }

      const { imageUrl } = await generateImage(prompt, session);
      setGeneratedImage(imageUrl);

      await storeGeneration({
        prompt,
        imageUrl,
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

  return {
    generatedImage,
    loading,
    error,
    generateAndStore
  };
};
