import { supabase } from '../../supabaseClient';

export class CardActionService {
  static async likeCard(userId: string, cardId: string): Promise<void> {
    const { error } = await supabase
      .from('card_likes')
      .insert([{ user_id: userId, card_id: cardId }]);

    if (error) throw error;
  }

  static async unlikeCard(userId: string, cardId: string): Promise<void> {
    const { error } = await supabase
      .from('card_likes')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId);

    if (error) throw error;
  }

  static async isCardLiked(userId: string, cardId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('card_likes')
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  static async bookmarkCard(userId: string, cardId: string): Promise<void> {
    const { error } = await supabase
      .from('card_bookmarks')
      .insert([{ user_id: userId, card_id: cardId }]);

    if (error) throw error;
  }

  static async removeBookmark(userId: string, cardId: string): Promise<void> {
    const { error } = await supabase
      .from('card_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId);

    if (error) throw error;
  }

  static async isCardBookmarked(userId: string, cardId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('card_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  static async getLikeCount(cardId: string): Promise<number> {
    const { count, error } = await supabase
      .from('card_likes')
      .select('*', { count: 'exact', head: true })
      .eq('card_id', cardId);

    if (error) throw error;
    return count || 0;
  }

  static async getBookmarkCount(cardId: string): Promise<number> {
    const { count, error } = await supabase
      .from('card_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('card_id', cardId);

    if (error) throw error;
    return count || 0;
  }
}
