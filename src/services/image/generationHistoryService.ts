import dbClient from '../../db/client';

export interface Generation {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
  is_used: boolean;
}

export class GenerationHistoryService {
  static async getUserGenerations(): Promise<Generation[]> {
    try {
      const result = await dbClient.query<Generation>(
        `SELECT id, prompt, image_url, created_at, is_used 
         FROM user_generations 
         ORDER BY created_at DESC`
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching user generations:', error);
      throw new Error('Failed to fetch generation history');
    }
  }

  static async markGenerationAsUsed(imageUrl: string): Promise<void> {
    try {
      await dbClient.query(
        'UPDATE user_generations SET is_used = true WHERE image_url = $1',
        [imageUrl]
      );
    } catch (error) {
      console.error('Error updating generation status:', error);
      // Non-critical error, don't throw
    }
  }
}
