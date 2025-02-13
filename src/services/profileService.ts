import dbClient from '../db/client';
import { Profile, Card } from '../types/profile';
import { Comment } from '../types/comment';

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const result = await dbClient.query<Profile>(
        `SELECT * FROM profiles WHERE id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  static async getProfileByUsername(userId: string, username: string): Promise<Profile | null> {
    try {
      const result = await dbClient.query<Profile>(
        `SELECT * FROM profiles WHERE user_id = $1 AND username = $2`,
        [userId, username]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting profile by username:', error);
      throw error;
    }
  }

  static async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    try {
      const result = await dbClient.query<Profile>(
        `UPDATE profiles 
         SET username = $1, bio = $2, avatar_url = $3, updated_at = $4 
         WHERE id = $5 
         RETURNING *`,
        [updates.username, updates.bio, updates.avatar_url, new Date().toISOString(), updates.id]
      );

      if (!result.rows[0]) {
        throw new Error('Profile not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  static async getProfileCards(userId: string, currentUserId?: string): Promise<Card[]> {
    try {
      const cardsResult = await dbClient.query<Card>(
        `SELECT * FROM cards WHERE user_id = $1`,
        [userId]
      );

      const cards = cardsResult.rows;
      if (cards.length === 0) return [];

      const cardIds = cards.map(card => card.id);

      // Get likes and comments counts
      const [likesResult, commentsResult] = await Promise.all([
        dbClient.query<{ card_id: string; count: string }>(
          'SELECT card_id, COUNT(*) as count FROM card_likes WHERE card_id = ANY($1) GROUP BY card_id',
          [cardIds]
        ),
        dbClient.query<{ card_id: string; count: string }>(
          'SELECT card_id, COUNT(*) as count FROM card_comments WHERE card_id = ANY($1) GROUP BY card_id',
          [cardIds]
        )
      ]);

      // If current user is viewing, get their interactions
      let userLikes = new Set<string>();
      if (currentUserId) {
        const userLikesResult = await dbClient.query<{ card_id: string }>(
          'SELECT card_id FROM card_likes WHERE user_id = $1 AND card_id = ANY($2)',
          [currentUserId, cardIds]
        );
        userLikes = new Set(userLikesResult.rows.map(row => row.card_id));
      }

      const likesMap = new Map(likesResult.rows.map(row => [row.card_id, parseInt(row.count, 10)]));
      const commentsMap = new Map(commentsResult.rows.map(row => [row.card_id, parseInt(row.count, 10)]));

      return cards.map(card => ({
        ...card,
        likes_count: likesMap.get(card.id) || 0,
        comments_count: commentsMap.get(card.id) || 0,
        isLiked: userLikes.has(card.id),
        isBookmarked: false // TODO: Implement bookmarks
      }));
    } catch (error) {
      console.error('Error getting profile cards:', error);
      throw error;
    }
  }

  static async getProfileStats(userId: string, currentUserId?: string): Promise<{
    cardsCount: number;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
  }> {
    try {
      const [cardsCount, followersCount, followingCount, isFollowing] = await Promise.all([
        dbClient.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM cards WHERE user_id = $1',
          [userId]
        ),
        dbClient.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
          [userId]
        ),
        dbClient.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
          [userId]
        ),
        currentUserId ? dbClient.query<{ exists: boolean }>(
          'SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2)',
          [currentUserId, userId]
        ) : Promise.resolve({ rows: [{ exists: false }] })
      ]);

      return {
        cardsCount: parseInt(cardsCount.rows[0].count),
        followersCount: parseInt(followersCount.rows[0].count),
        followingCount: parseInt(followingCount.rows[0].count),
        isFollowing: isFollowing.rows[0].exists
      };
    } catch (error) {
      console.error('Error getting profile stats:', error);
      throw error;
    }
  }

  static async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      await dbClient.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [followerId, followingId]
      );
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      await dbClient.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  static async likeCard(userId: string, cardId: string): Promise<void> {
    try {
      await dbClient.query(
        'INSERT INTO card_likes (user_id, card_id) VALUES ($1, $2)',
        [userId, cardId]
      );
    } catch (error) {
      console.error('Error liking card:', error);
      throw error;
    }
  }

  static async unlikeCard(userId: string, cardId: string): Promise<void> {
    try {
      await dbClient.query(
        'DELETE FROM card_likes WHERE user_id = $1 AND card_id = $2',
        [userId, cardId]
      );
    } catch (error) {
      console.error('Error unliking card:', error);
      throw error;
    }
  }

  static async addComment(
    userId: string,
    cardId: string,
    content: string,
    parentCommentId?: string
  ): Promise<Comment | null> {
    try {
      const result = await dbClient.query<Comment>(
        `INSERT INTO card_comments (user_id, card_id, content, parent_comment_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, cardId, content, parentCommentId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  static async getBookmarkedCards(userId: string): Promise<Card[]> {
    try {
      const bookmarksResult = await dbClient.query<{ card_id: string }>(
        `SELECT card_id FROM card_bookmarks WHERE user_id = $1`,
        [userId]
      );

      if (bookmarksResult.rows.length === 0) return [];

      const cardIds = bookmarksResult.rows.map(row => row.card_id);

      // Get card details
      const cardsResult = await dbClient.query<Card>(
        `SELECT * FROM cards WHERE id = ANY($1)`,
        [cardIds]
      );

      // Get likes and comments counts
      const [likesResult, commentsResult] = await Promise.all([
        dbClient.query<{ card_id: string; count: string }>(
          'SELECT card_id, COUNT(*) as count FROM card_likes WHERE card_id = ANY($1) GROUP BY card_id',
          [cardIds]
        ),
        dbClient.query<{ card_id: string; count: string }>(
          'SELECT card_id, COUNT(*) as count FROM card_comments WHERE card_id = ANY($1) GROUP BY card_id',
          [cardIds]
        )
      ]);

      // Get user's likes
      let userLikes = new Set<string>();
      const userLikesResult = await dbClient.query<{ card_id: string }>(
        'SELECT card_id FROM card_likes WHERE user_id = $1 AND card_id = ANY($2)',
        [userId, cardIds]
      );
      userLikes = new Set(userLikesResult.rows.map(row => row.card_id));

      const likesMap = new Map(likesResult.rows.map(row => [row.card_id, parseInt(row.count, 10)]));
      const commentsMap = new Map(commentsResult.rows.map(row => [row.card_id, parseInt(row.count, 10)]));

      return cardsResult.rows.map(card => ({
        ...card,
        likes_count: likesMap.get(card.id) || 0,
        comments_count: commentsMap.get(card.id) || 0,
        isLiked: userLikes.has(card.id),
        isBookmarked: true
      }));
    } catch (error) {
      console.error('Error getting bookmarked cards:', error);
      throw error;
    }
  }

  static async getCardComments(cardId: string): Promise<Comment[]> {
    try {
      const result = await dbClient.query<Comment>(
        `SELECT cc.*, u.username, p.avatar_url
         FROM card_comments cc
         LEFT JOIN users u ON cc.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.id
         WHERE cc.card_id = $1
         ORDER BY cc.created_at DESC`,
        [cardId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting card comments:', error);
      throw error;
    }
  }

  static async getCommentReplies(commentId: string): Promise<Comment[]> {
    try {
      const result = await dbClient.query<Comment>(
        `SELECT cc.*, u.username, p.avatar_url
         FROM card_comments cc
         LEFT JOIN users u ON cc.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.id
         WHERE cc.parent_comment_id = $1
         ORDER BY cc.created_at ASC`,
        [commentId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting comment replies:', error);
      throw error;
    }
  }

  static async getUserCards(userId: string, currentUserId?: string): Promise<Card[]> {
    try {
      const result = await dbClient.query<Card>(
        `SELECT c.*, u.username as creator_username, p.avatar_url as creator_profile_image,
         COUNT(DISTINCT cl.id) as likes_count,
         COUNT(DISTINCT cc.id) as comments_count,
         EXISTS(SELECT 1 FROM card_likes WHERE user_id = $2 AND card_id = c.id) as is_liked,
         EXISTS(SELECT 1 FROM card_bookmarks WHERE user_id = $2 AND card_id = c.id) as is_bookmarked
         FROM cards c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.id
         LEFT JOIN card_likes cl ON c.id = cl.card_id
         LEFT JOIN card_comments cc ON c.id = cc.card_id
         WHERE c.user_id = $1
         GROUP BY c.id, u.username, p.avatar_url
         ORDER BY c.created_at DESC`,
        [userId, currentUserId || userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting user cards:', error);
      throw error;
    }
  }

  static async getUserBookmarks(userId: string, currentUserId?: string): Promise<Card[]> {
    try {
      const result = await dbClient.query<Card>(
        `SELECT c.*, u.username as creator_username, p.avatar_url as creator_profile_image,
         COUNT(DISTINCT cl.id) as likes_count,
         COUNT(DISTINCT cc.id) as comments_count,
         EXISTS(SELECT 1 FROM card_likes WHERE user_id = $2 AND card_id = c.id) as is_liked,
         true as is_bookmarked
         FROM cards c
         INNER JOIN card_bookmarks cb ON c.id = cb.card_id
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.id
         LEFT JOIN card_likes cl ON c.id = cl.card_id
         LEFT JOIN card_comments cc ON c.id = cc.card_id
         WHERE cb.user_id = $1
         GROUP BY c.id, u.username, p.avatar_url
         ORDER BY cb.created_at DESC`,
        [userId, currentUserId || userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
      throw error;
    }
  }

  static async createProfile(userId: string, username: string): Promise<Profile> {
    try {
      const result = await dbClient.query<Profile>(
        `INSERT INTO profiles (id, username, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING *`,
        [userId, username]
      );

      if (!result.rows[0]) {
        throw new Error('Failed to create profile');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }
}
