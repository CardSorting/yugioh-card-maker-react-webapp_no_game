import dbClient from '../../db/client';
import { DBCard } from '../../types/card';
import { CardActionService } from './cardActionService';

export class CardService {
  static async getCard(id: string, userId?: string): Promise<DBCard | null> {
    let result = await dbClient.query<DBCard>(
      `SELECT * FROM card_details WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      // Try getting from base cards table
      result = await dbClient.query<DBCard>(
        `SELECT * FROM cards WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }
    }

    const cardData = result.rows[0];

    // If user is logged in, get their interactions
    if (userId) {
      const [isLiked, isBookmarked] = await Promise.all([
        CardActionService.isCardLiked(userId, id),
        CardActionService.isCardBookmarked(userId, id)
      ]);

      return {
        ...cardData,
        isLiked,
        isBookmarked
      };
    }

    return cardData;
  }

  static async updateCard(id: string, updates: Partial<DBCard>): Promise<DBCard> {
    const result = await dbClient.query<DBCard>(
      `UPDATE cards 
       SET card_title = $1, card_eff1 = $2, card_image_path = $3 
       WHERE id = $4 
       RETURNING *`,
      [updates.cardTitle, updates.cardEff1, updates.card_image_path, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Card not found');
    }

    // Refresh materialized view
    await dbClient.query('REFRESH MATERIALIZED VIEW card_details');

    const updatedCard = result.rows[0];

    // Get interaction counts
    const likesCount = await CardActionService.getLikeCount(id);

    return {
      ...updatedCard,
      likes_count: likesCount,
      comments_count: 0, // TODO: Implement comments count
      isLiked: false,
      isBookmarked: false
    };
  }

  static async deleteCard(id: string): Promise<boolean> {
    return await dbClient.transaction(async (client) => {
      // Delete from all related tables
      await client.query(
        'DELETE FROM card_likes WHERE card_id = $1',
        [id]
      );

      await client.query(
        'DELETE FROM card_bookmarks WHERE card_id = $1',
        [id]
      );

      await client.query(
        'DELETE FROM card_comments WHERE card_id = $1',
        [id]
      );

      const result = await client.query(
        'DELETE FROM cards WHERE id = $1',
        [id]
      );

      return result.rowCount !== null && result.rowCount > 0;
    });
  }

  static async getCardDetail(id: string, userId?: string): Promise<DBCard | null> {
    try {
      let result = await dbClient.query<DBCard>(
        `SELECT c.*, 
         u.username as creator_username,
         p.avatar_url as creator_profile_image,
         COUNT(DISTINCT cl.id) as likes_count,
         COUNT(DISTINCT cc.id) as comments_count,
         EXISTS(SELECT 1 FROM card_likes WHERE user_id = $2 AND card_id = c.id) as is_liked,
         EXISTS(SELECT 1 FROM card_bookmarks WHERE user_id = $2 AND card_id = c.id) as is_bookmarked
         FROM cards c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.id
         LEFT JOIN card_likes cl ON c.id = cl.card_id
         LEFT JOIN card_comments cc ON c.id = cc.card_id
         WHERE c.id = $1
         GROUP BY c.id, u.username, p.avatar_url`,
        [id, userId || null]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting card detail:', error);
      throw error;
    }
  }
}

export const { getCardDetail } = CardService;
