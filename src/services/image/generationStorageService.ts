import client from '../../client';

export interface GenerationStorageInput {
  prompt: string;
  imageUrl: string;
  referenceImageUrl?: string | null;
  visionAnalysis?: string | null;
}

export const storeGeneration = async (data: GenerationStorageInput): Promise<void> => {
  await client.post('/generations', data);
};

export const markGenerationAsUsed = async (imageUrl: string): Promise<void> => {
  await client.patch(`/generations/${encodeURIComponent(imageUrl)}/used`);
};
