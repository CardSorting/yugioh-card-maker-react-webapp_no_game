import dbClient from '../../db/client';
import { DeckDetails, DeckCard } from '../../types/deck';
import { DBCard } from '../../types/card';

export class DeckService {
  static async createDeck(input: Partial<DeckDetails>): Promise<DeckDetails> {
    try {
      const result = await dbClient.query<DeckDetails>(
        `INSERT INTO decks (name) VALUES ($1) RETURNING *`,
        [input.name]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error;
    }
  }

  static async updateDeck(id: string, input: Partial<DeckDetails>): Promise<DeckDetails> {
    try {
      const result = await dbClient.query<DeckDetails>(
        `UPDATE decks SET name = $1 WHERE id = $2 RETURNING *`,
        [input.name, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating deck:', error);
      throw error;
    }
  }

  static async deleteDeck(id: string): Promise<void> {
    try {
      await dbClient.query('DELETE FROM decks WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error;
    }
  }

  static async listDecks(filters: {
    userId?: string;
    public?: boolean;
    orderBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<DeckDetails[]> {
    try {
      let query = 'SELECT * FROM deck_details WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      if (filters.userId) {
        query += ` AND user_id = $${paramCount}`;
        values.push(filters.userId);
        paramCount++;
      }

      if (filters.public !== undefined) {
        query += ` AND public = $${paramCount}`;
        values.push(filters.public);
        paramCount++;
      }

      if (filters.orderBy) {
        query += ` ORDER BY ${filters.orderBy}`;
      }

      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
        paramCount++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramCount}`;
        values.push(filters.offset);
      }

      const result = await dbClient.query<DeckDetails>(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error listing decks:', error);
      throw error;
    }
  }

  static async toggleDeckPublic(deckId: string): Promise<void> {
    try {
      await dbClient.query(
        'UPDATE decks SET public = NOT public WHERE id = $1',
        [deckId]
      );
    } catch (error) {
      console.error('Error toggling deck public status:', error);
      throw error;
    }
  }

  static async toggleDeckBookmark(deckId: string, userId: string): Promise<void> {
    try {
      const exists = await dbClient.query(
        'SELECT 1 FROM deck_bookmarks WHERE deck_id = $1 AND user_id = $2',
        [deckId, userId]
      );

      if (exists.rows.length > 0) {
        await dbClient.query(
          'DELETE FROM deck_bookmarks WHERE deck_id = $1 AND user_id = $2',
          [deckId, userId]
        );
      } else {
        await dbClient.query(
          'INSERT INTO deck_bookmarks (deck_id, user_id) VALUES ($1, $2)',
          [deckId, userId]
        );
      }
    } catch (error) {
      console.error('Error toggling deck bookmark:', error);
      throw error;
    }
  }

  static async addCardToDeck(input: {
    deck_id: string;
    card_id: string;
    deck_type: string;
    position: number;
  }): Promise<DeckCard> {
    try {
      const result = await dbClient.query<DeckCard>(
        `INSERT INTO deck_cards (deck_id, card_id, deck_type, position)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [input.deck_id, input.card_id, input.deck_type, input.position]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding card to deck:', error);
      throw error;
    }
  }

  static async removeCardFromDeck(deckId: string, cardId: string): Promise<void> {
    try {
      await dbClient.query(
        'DELETE FROM deck_cards WHERE deck_id = $1 AND card_id = $2',
        [deckId, cardId]
      );
    } catch (error) {
      console.error('Error removing card from deck:', error);
      throw error;
    }
  }

  static async updateCardPosition(input: {
    deck_type: string;
    position: number;
    deck_id: string;
    card_id: string;
  }): Promise<DeckCard> {
    try {
      const result = await dbClient.query<DeckCard>(
        `UPDATE deck_cards 
         SET deck_type = $1, position = $2 
         WHERE deck_id = $3 AND card_id = $4
         RETURNING *`,
        [input.deck_type, input.position, input.deck_id, input.card_id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating card position:', error);
      throw error;
    }
  }

  static async reorderDeckCards(deckId: string, cardIds: string[]): Promise<void> {
    try {
      await dbClient.transaction(async (client) => {
        for (let i = 0; i < cardIds.length; i++) {
          await client.query(
            'UPDATE deck_cards SET position = $1 WHERE deck_id = $2 AND card_id = $3',
            [i, deckId, cardIds[i]]
          );
        }
      });
    } catch (error) {
      console.error('Error reordering deck cards:', error);
      throw error;
    }
  }

  static async getDeckCards(userId: string): Promise<DBCard[]> {
    try {
      const result = await dbClient.query<DBCard>(
        `SELECT c.* FROM cards c
         JOIN deck_cards dc ON c.id = dc.card_id
         WHERE dc.deck_id IN (SELECT id FROM decks WHERE user_id = $1)`,
        [userId]
      );

      return result.rows.map(card => ({
        ...card,
        likes_count: 0,
        comments_count: 0,
        isLiked: false,
        isBookmarked: false
      }));
    } catch (error) {
      console.error('Error getting deck cards:', error);
      throw error;
    }
  }

  static async getDeckDetails(deckId: string): Promise<DeckDetails | null> {
    try {
      const result = await dbClient.query<DeckDetails>(
        `SELECT * FROM deck_details WHERE id = $1`,
        [deckId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting deck details:', error);
      throw error;
    }
  }

  static async getUserDecks(params: {
    userId: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
  }): Promise<DeckDetails[]> {
    try {
      let query = 'SELECT * FROM deck_details WHERE user_id = $1';
      const values: any[] = [params.userId];
      let paramCount = 2;

      if (params.orderBy) {
        query += ` ORDER BY ${params.orderBy}`;
      } else {
        query += ' ORDER BY created_at DESC';
      }

      if (params.limit) {
        query += ` LIMIT $${paramCount}`;
        values.push(params.limit);
        paramCount++;
      }

      if (params.offset) {
        query += ` OFFSET $${paramCount}`;
        values.push(params.offset);
      }

      const result = await dbClient.query<DeckDetails>(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting user decks:', error);
      throw error;
    }
  }

  static async updateDeckCard(deckId: string, cardId: string, input: Partial<DeckCard>): Promise<DeckCard> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [deckId, cardId];
      let paramCount = 3;

      if (input.deck_type !== undefined) {
        updateFields.push(`deck_type = $${paramCount}`);
        values.push(input.deck_type);
        paramCount++;
      }

      if (input.position !== undefined) {
        updateFields.push(`position = $${paramCount}`);
        values.push(input.position);
        paramCount++;
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      const result = await dbClient.query<DeckCard>(
        `UPDATE deck_cards 
         SET ${updateFields.join(', ')}
         WHERE deck_id = $1 AND card_id = $2
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Card not found in deck');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating deck card:', error);
      throw error;
    }
  }
}
