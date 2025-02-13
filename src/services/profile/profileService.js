import pool, { transaction } from '../../config/database.js';
import { deleteFile } from '../../middleware/upload.js';

export const ProfileService = {
  async getByUsername(username) {
    const result = await pool.query(
      `SELECT p.*, u.email 
       FROM profiles p
       JOIN users u ON p.id = u.id
       WHERE p.username = $1`,
      [username]
    );

    return result.rows[0] || null;
  },

  async getById(id) {
    const result = await pool.query(
      `SELECT p.*, u.email
       FROM profiles p
       JOIN users u ON p.id = u.id
       WHERE p.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  },

  async update(userId, data) {
    return transaction(async (client) => {
      // If updating username, check if it's available
      if (data.username) {
        const existing = await client.query(
          'SELECT id FROM profiles WHERE username = $1 AND id != $2',
          [data.username, userId]
        );
        if (existing.rows.length > 0) {
          throw new Error('Username already taken');
        }
      }

      // If updating avatar, delete old avatar file if it exists
      if (data.avatar_url) {
        const current = await client.query(
          'SELECT avatar_url FROM profiles WHERE id = $1',
          [userId]
        );
        
        if (current.rows[0]?.avatar_url) {
          const oldAvatarFilename = current.rows[0].avatar_url.split('/').pop();
          await deleteFile(oldAvatarFilename);
        }
      }

      // Build update query dynamically based on provided fields
      const updates = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(userId);
      const query = `
        UPDATE profiles 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    });
  },

  async getFollowers(userId) {
    const result = await pool.query(
      `SELECT p.*, u.email
       FROM profiles p
       JOIN users u ON p.id = u.id
       JOIN user_follows uf ON p.id = uf.follower_id
       WHERE uf.following_id = $1`,
      [userId]
    );

    return result.rows;
  },

  async getFollowing(userId) {
    const result = await pool.query(
      `SELECT p.*, u.email
       FROM profiles p
       JOIN users u ON p.id = u.id
       JOIN user_follows uf ON p.id = uf.following_id
       WHERE uf.follower_id = $1`,
      [userId]
    );

    return result.rows;
  },

  async follow(followerId, followingId) {
    await pool.query(
      'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
    );
  },

  async unfollow(followerId, followingId) {
    await pool.query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
  },

  async isFollowing(followerId, followingId) {
    const result = await pool.query(
      'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    return result.rows.length > 0;
  },

  async getStats(userId) {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM user_follows WHERE following_id = $1) as follower_count,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM cards WHERE user_id = $1) as card_count,
        (SELECT COUNT(*) FROM decks WHERE user_id = $1) as deck_count`,
      [userId]
    );

    const stats = result.rows[0];
    return {
      followerCount: parseInt(stats.follower_count),
      followingCount: parseInt(stats.following_count),
      cardCount: parseInt(stats.card_count),
      deckCount: parseInt(stats.deck_count),
    };
  },
};

export default ProfileService;
