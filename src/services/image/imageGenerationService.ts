import { Session } from '@supabase/supabase-js';

export interface ImageGenerationResponse {
  imageUrls: string[];
  variationUrls: string[]; // Add variationUrls here
  taskId?: string;
}

export const generateImage = async (
  prompt: string, 
  session: Session,
  options: { aspectRatio?: string } = {}
): Promise<ImageGenerationResponse> => {
  const response = await fetch('https://ykifcwehtijnbpebhlda.supabase.co/functions/v1/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ 
      prompt,
      // Match the parameter name expected by the Edge Function
      aspect_ratio: options.aspectRatio || '1:1'
    }),
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
  return { imageUrls: data.imageUrls, variationUrls: data.imageUrls }; // Return variationUrls
};
