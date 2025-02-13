export interface VisionAnalysisResponse {
  analysis: string;
}

export const analyzeImage = async (imageUrl: string): Promise<VisionAnalysisResponse> => {
  const response = await fetch('/api/image/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageData: imageUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze image');
  }

  const data = await response.json();
  return { analysis: data.analysis };
};
