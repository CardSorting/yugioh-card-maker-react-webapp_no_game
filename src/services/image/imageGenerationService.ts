import { Session } from '@supabase/supabase-js';

export interface ImageGenerationResponse {
  imageUrl: string;
}

export const generateImage = async (prompt: string, session: Session): Promise<ImageGenerationResponse> => {
  const response = await fetch('https://ykifcwehtijnbpebhlda.supabase.co/functions/v1/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.error || 'Failed to generate image';
    console.error('Image generation failed:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    });
    throw new Error(`Failed to generate image: ${errorMessage}`);
  }

  const data = await response.json();
  return { imageUrl: data.imageUrl };
};
