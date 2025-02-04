import { Session } from '@supabase/supabase-js';

export interface VisionAnalysisResponse {
  analysis: string;
}

export const analyzeImage = async (imageData: string, session: Session): Promise<VisionAnalysisResponse> => {
  // Ensure we have the base64 data without the data URL prefix
  const base64Data = imageData.includes('base64,') 
    ? imageData.split('base64,')[1] 
    : imageData;

  const response = await fetch('https://ykifcwehtijnbpebhlda.supabase.co/functions/v1/generate-image/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ image: base64Data }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze image');
  }

  const data = await response.json();
  return { analysis: data.analysis };
};
