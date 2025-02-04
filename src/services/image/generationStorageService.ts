import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';

export interface GenerationStorageInput {
  prompt: string;
  imageUrl: string;
  referenceImageUrl?: string | null;
  visionAnalysis?: string | null;
}

export const storeGeneration = async (
  data: GenerationStorageInput,
  session: Session
): Promise<void> => {
  if (!session?.user?.id) {
    throw new Error('User ID is required');
  }

  const { error } = await supabase
    .from('user_generations')
    .insert([
      {
        user_id: session.user.id,
        prompt: data.prompt,
        image_url: data.imageUrl,
        reference_image_url: data.referenceImageUrl,
        vision_analysis: data.visionAnalysis
      }
    ]);

  if (error) {
    throw error;
  }
};
