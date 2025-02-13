import dbClient from '../../db/client';
import { Comment } from '../../types/comment';

export class CommentService {
  static async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      // Check if user owns the comment
      await dbClient.query(
        'DELETE FROM card_comments WHERE id = $1 AND user_id = $2',
        [commentId, userId]
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  static async deleteCommentAsAdmin(commentId: string, userId: string): Promise<void> {
    try {
      // Check if user is admin
      await dbClient.query(
        'DELETE FROM card_comments WHERE id = $1 AND EXISTS (SELECT 1 FROM users WHERE id = $2 AND is_admin = true)',
        [commentId, userId]
      );
    } catch (error) {
      console.error('Error deleting comment as admin:', error);
      throw error;
    }
  }

  static async getCardComments(cardId: string, userId?: string): Promise<Comment[]> {
    try {
      let result = await dbClient.query<Comment>(
        `SELECT cc.*, u.username, p.avatar_url
         FROM card_comments cc
         LEFT JOIN users u ON cc.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.id
         WHERE cc.card_id = $1
         ORDER BY cc.created_at DESC`,
        [cardId]
      );

      if (result.rows.length === 0) {
        return [];
      }

      // If user is logged in, get their interactions
      if (userId) {
        result = await dbClient.query<Comment>(
          `SELECT cc.*, u.username, p.avatar_url,
           EXISTS(SELECT 1 FROM comment_likes WHERE user_id = $2 AND comment_id = cc.id) as is_liked
           FROM card_comments cc
           LEFT JOIN users u ON cc.user_id = u.id
           LEFT JOIN profiles p ON u.id = p.id
           WHERE cc.card_id = $1
           ORDER BY cc.created_at DESC`,
          [cardId, userId]
        );
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting card comments:', error);
      throw error;
    }
  }

  static async getCommentReplies(commentId: string, userId?: string): Promise<Comment[]> {
    try {
      let result = await dbClient.query<Comment>(
        `SELECT cc.*, u.username, p.avatar_url
         FROM card_comments cc
         LEFT JOIN users u ON cc.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.id
         WHERE cc.parent_comment_id = $1
         ORDER BY cc.created_at ASC`,
        [commentId]
      );

      if (result.rows.length === 0) {
        return [];
      }

      // If user is logged in, get their interactions
      if (userId) {
        result = await dbClient.query<Comment>(
          `SELECT cc.*, u.username, p.avatar_url,
           EXISTS(SELECT 1 FROM comment_likes WHERE user_id = $2 AND comment_id = cc.id) as is_liked
           FROM card_comments cc
           LEFT JOIN users u ON cc.user_id = u.id
           LEFT JOIN profiles p ON u.id = p.id
           WHERE cc.parent_comment_id = $1
           ORDER BY cc.created_at ASC`,
          [commentId, userId]
        );
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting comment replies:', error);
      throw error;
    }
  }

  static async addComment(
    userId: string,
    cardId: string,
    content: string,
    parentCommentId: string | null
  ): Promise<Comment | null> {
    try {
      const result = await dbClient.query<Comment>(
        `INSERT INTO card_comments (user_id, card_id, content, parent_comment_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, cardId, content, parentCommentId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  static async deleteCommentAndReplies(commentId: string): Promise<void> {
    try {
      await dbClient.transaction(async (client) => {
        // Delete all replies first
        await client.query(
          'DELETE FROM card_comments WHERE parent_comment_id = $1',
          [commentId]
        );

        // Then delete the comment itself
        await client.query(
          'DELETE FROM card_comments WHERE id = $1',
          [commentId]
        );
      });
    } catch (error) {
      console.error('Error deleting comment and replies:', error);
      throw error;
    }
  }

  static async likeComment(commentId: string): Promise<void> {
    try {
      await dbClient.query(
        `INSERT INTO comment_likes (comment_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (comment_id, user_id) DO NOTHING`,
        [commentId]
      );

      // Update likes count
      await dbClient.query(
        `UPDATE card_comments 
         SET likes_count = COALESCE(likes_count, 0) + 1
         WHERE id = $1`,
        [commentId]
      );
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }

  static async unlikeComment(commentId: string): Promise<void> {
    try {
      await dbClient.query(
        'DELETE FROM comment_likes WHERE comment_id = $1',
        [commentId]
      );

      // Update likes count
      await dbClient.query(
        `UPDATE card_comments 
         SET likes_count = GREATEST(COALESCE(likes_count, 1) - 1, 0)
         WHERE id = $1`,
        [commentId]
      );
    } catch (error) {
      console.error('Error unliking comment:', error);
      throw error;
    }
  }
}
