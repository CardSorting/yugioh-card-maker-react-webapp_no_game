import { Session } from '@supabase/supabase-js';

export interface VisionAnalysisResponse {
  analysis: string;
}

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class VisionAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisionAnalysisError';
  }
}

const validateImage = (imageData: string): string => {
  // Check if it's a valid data URL
  if (!imageData.startsWith('data:')) {
    throw new VisionAnalysisError('Invalid image format: Must be a data URL');
  }

  // Extract MIME type and base64 data
  const [header, base64Data] = imageData.split('base64,');
  if (!header || !base64Data) {
    throw new VisionAnalysisError('Invalid image format: Malformed data URL');
  }

  // Validate MIME type
  const mimeType = header.slice(5, -1); // Remove 'data:' and trailing ';'
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new VisionAnalysisError(
      `Invalid image type: Must be one of ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  // Check file size
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > MAX_IMAGE_SIZE) {
    throw new VisionAnalysisError(
      `Image too large: Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
    );
  }

  return base64Data;
};

export const analyzeImage = async (imageData: string, session: Session): Promise<VisionAnalysisResponse> => {
  const base64Data = validateImage(imageData);

  const response = await fetch('https://ykifcwehtijnbpebhlda.supabase.co/functions/v1/vision-analysis', {
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
