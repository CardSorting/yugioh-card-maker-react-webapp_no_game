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
  const { session } = useAuth();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeAndReturnPrompt = useCallback(async (imageData: string): Promise<string> => {
    try {
      setAnalyzing(true);
      setError(null);

      if (!session) {
        throw new Error('Authentication required');
      }

      const { analysis: newAnalysis } = await analyzeImage(imageData, session);
      setAnalysis(newAnalysis);
      return newAnalysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, [session]);

  return {
    analysis,
    analyzing,
    error,
    analyzeAndReturnPrompt
  };
};
