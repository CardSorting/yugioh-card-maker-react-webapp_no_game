import dbClient from '../../db/client';

export class CardActionService {
  static async likeCard(userId: string, cardId: string): Promise<void> {
    await dbClient.query(
      'INSERT INTO card_likes (user_id, card_id) VALUES ($1, $2)',
      [userId, cardId]
    );
  }

  static async unlikeCard(userId: string, cardId: string): Promise<void> {
    await dbClient.query(
      'DELETE FROM card_likes WHERE user_id = $1 AND card_id = $2',
      [userId, cardId]
    );
  }

  static async isCardLiked(userId: string, cardId: string): Promise<boolean> {
    const result = await dbClient.query<{ exists: boolean }>(
      'SELECT 1 FROM card_likes WHERE user_id = $1 AND card_id = $2',
      [userId, cardId]
    );
    return result.rows.length > 0;
  }

  static async bookmarkCard(userId: string, cardId: string): Promise<void> {
    await dbClient.query(
      'INSERT INTO card_bookmarks (user_id, card_id) VALUES ($1, $2)',
      [userId, cardId]
    );
  }

  static async removeBookmark(userId: string, cardId: string): Promise<void> {
    await dbClient.query(
      'DELETE FROM card_bookmarks WHERE user_id = $1 AND card_id = $2',
      [userId, cardId]
    );
  }

  static async isCardBookmarked(userId: string, cardId: string): Promise<boolean> {
    const result = await dbClient.query<{ exists: boolean }>(
      'SELECT 1 FROM card_bookmarks WHERE user_id = $1 AND card_id = $2',
      [userId, cardId]
    );
    return result.rows.length > 0;
  }

  static async getLikeCount(cardId: string): Promise<number> {
    const result = await dbClient.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM card_likes WHERE card_id = $1',
      [cardId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  static async getBookmarkCount(cardId: string): Promise<number> {
    const result = await dbClient.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM card_bookmarks WHERE card_id = $1',
      [cardId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}
