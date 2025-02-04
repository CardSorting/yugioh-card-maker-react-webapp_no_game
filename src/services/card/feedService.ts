import { supabase } from '../../supabaseClient';
import { DBCard } from '../../types/card';

export type FeedSortOption = 'latest' | 'popular' | 'following';

interface FeedParams {
  page: number;
  pageSize: number;
  sortBy: FeedSortOption;
  userId?: string;
}

export const getFeedCards = async ({ page, pageSize, sortBy, userId }: FeedParams): Promise<{
  cards: DBCard[];
  hasMore: boolean;
}> => {
  try {
    let query = supabase
      .from('card_details')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Add sorting based on option
    switch (sortBy) {
      case 'popular':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'following':
        if (userId) {
          const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);
          
          const followingIds = following?.map(f => f.following_id) || [];
          query = query.in('user_id', followingIds)
            .order('created_at', { ascending: false });
        }
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: cards, error, count } = await query;

    if (error) {
      console.error('Error fetching feed cards:', error);
      return { cards: [], hasMore: false };
    }

    // If user is logged in, fetch their likes/bookmarks
    if (userId && cards?.length) {
      const cardIds = cards.map(card => card.id);

      // Get user's likes for these cards
      const { data: likes } = await supabase
        .from('card_likes')
        .select('card_id')
        .eq('user_id', userId)
        .in('card_id', cardIds);

      // Get user's bookmarks for these cards
      const { data: bookmarks } = await supabase
        .from('card_bookmarks')
        .select('card_id')
        .eq('user_id', userId)
        .in('card_id', cardIds);

      const likedCardIds = new Set(likes?.map(like => like.card_id) || []);
      const bookmarkedCardIds = new Set(bookmarks?.map(bookmark => bookmark.card_id) || []);

      // Add isLiked and isBookmarked flags to each card
      cards.forEach(card => {
        card.isLiked = likedCardIds.has(card.id);
        card.isBookmarked = bookmarkedCardIds.has(card.id);
      });
    }

    return {
      cards: cards || [],
      hasMore: (cards?.length || 0) === pageSize
    };
  } catch (error) {
    console.error('Error in getFeedCards:', error);
    return { cards: [], hasMore: false };
  }
};
