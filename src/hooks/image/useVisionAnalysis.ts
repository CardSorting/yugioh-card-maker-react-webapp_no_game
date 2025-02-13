import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyzeImage } from '../../services/image/visionAnalysisService';

interface UseVisionAnalysisResult {
  analysis: string | null;
  analyzing: boolean;
  error: string | null;
  analyzeAndReturnPrompt: (imageData: string) => Promise<string>;
}

export const useVisionAnalysis = (): UseVisionAnalysisResult => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeAndReturnPrompt = useCallback(async (imageData: string): Promise<string> => {
    try {
      setAnalyzing(true);
      setError(null);

      if (!user) {
        throw new Error('Authentication required');
      }

      const { analysis: newAnalysis } = await analyzeImage(imageData);
      setAnalysis(newAnalysis);
      return newAnalysis;
    } catch (err) {
      let errorMessage = 'An error occurred during image analysis';
      
      errorMessage = err instanceof Error ? err.message : 'An error occurred during image analysis';
      
      setError(errorMessage);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  return {
    analysis,
    analyzing,
    error,
    analyzeAndReturnPrompt
  };
};
