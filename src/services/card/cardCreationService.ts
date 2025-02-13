import dbClient from '../../db/client';
import { CardState } from '../../types/card';

export class CardCreationService {
  static async createCard(userId: string, cardState: CardState): Promise<string> {
    try {
      const result = await dbClient.query<{ id: string }>(
        `INSERT INTO cards (
          user_id,
          card_title,
          card_type,
          card_subtype,
          card_eff1,
          card_eff2,
          card_attr,
          card_race,
          card_custom_race,
          card_level,
          card_blue,
          card_red,
          card_atk,
          card_def,
          pendulum_size,
          card_pendulum_info,
          info_size,
          card_info,
          card_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id`,
        [
          userId,
          cardState.cardTitle,
          cardState.cardType,
          cardState.cardSubtype,
          cardState.cardEff1,
          cardState.cardEff2,
          cardState.cardAttr,
          cardState.cardRace,
          cardState.cardCustomRace,
          cardState.cardLevel,
          cardState.cardBLUE,
          cardState.cardRED,
          cardState.cardATK,
          cardState.cardDEF,
          cardState.pendulumSize,
          cardState.cardPendulumInfo,
          cardState.infoSize,
          cardState.cardInfo,
          cardState.cardKey || null
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  static async updateCardImage(imageUrl: string): Promise<void> {
    try {
      await dbClient.query(
        'UPDATE cards SET card_image_path = $1 WHERE id = (SELECT id FROM cards ORDER BY created_at DESC LIMIT 1)',
        [imageUrl]
      );
    } catch (error) {
      console.error('Error updating card image:', error);
      throw error;
    }
  }

  static async updateGenerationStatus(imageUrl: string): Promise<void> {
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

  static async saveCard(userId: string, cardState: CardState, imageBlob: Blob): Promise<string> {
    try {
      // First create the card record
      const cardId = await this.createCard(userId, cardState);

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageBlob);
      });
      const base64Image = await base64Promise;

      // Update the card with the image
      await dbClient.query(
        'UPDATE cards SET card_image_path = $1 WHERE id = $2',
        [base64Image, cardId]
      );

      return cardId;
    } catch (error) {
      console.error('Error saving card:', error);
      throw error;
    }
  }
}
