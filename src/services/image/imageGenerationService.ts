export interface ImageGenerationResponse {
  imageId: string;
  imageData: string;
  created_at: string;
}

export const generateImage = async (prompt: string, token: string): Promise<ImageGenerationResponse> => {
  const response = await fetch('/api/image/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  
  if (!data.success) {
    console.error('Image generation failed:', {
      status: response.status,
      statusText: response.statusText,
      error: data.error
    });
    throw new Error(`Failed to generate image: ${data.error}`);
  }

  return {
    imageId: data.imageId,
    imageData: data.imageData,
    created_at: data.created_at
  };
};
