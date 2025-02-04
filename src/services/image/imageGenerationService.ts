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
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  return { imageUrl: data.imageUrl };
};
