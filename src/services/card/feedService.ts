import { supabase } from '../../supabaseClient';
import { DBCard } from '../../types/card';
import { DeckDetails } from '../../types/deck';

export type FeedSortOption = 'latest' | 'popular' | 'following' | 'decks';
export type DeckSortOption = 'latest' | 'bookmarks';

interface FeedParams {
  page: number;
  pageSize: number;
  sortBy: FeedSortOption;
  userId?: string;
  deckSortBy?: DeckSortOption;
}

interface FeedResponse {
  cards: DBCard[];
  decks: DeckDetails[];
  hasMore: boolean;
}

export const getFeedCards = async ({ page, pageSize, sortBy, userId, deckSortBy = 'bookmarks' }: FeedParams): Promise<FeedResponse> => {
  try {
    // Initialize response
    let response: FeedResponse = {
      cards: [],
      decks: [],
      hasMore: false
    };

    // For decks tab, fetch public decks
    if (sortBy === 'decks') {
      // Validate page and pageSize
      if (page < 0 || pageSize <= 0) {
        return response;
      }

      const query = supabase
        .from('deck_details')
        .select('*')
        .eq('public', true)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (deckSortBy === 'bookmarks') {
        query.order('bookmark_count', { ascending: false });
      } else {
        query.order('created_at', { ascending: false });
      }

      const { data: decks, error } = await query;

      if (error) {
        console.error('Error fetching public decks:', error);
        return { cards: [], decks: [], hasMore: false };
      }

      return {
        cards: [],
        decks: decks || [],
        hasMore: (decks?.length || 0) === pageSize
      };
    }

    // For other tabs, fetch cards
    let query = supabase
      .from('card_details')
      .select('*', { count: 'exact' })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Add proper sorting based on option
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

      const { data: cards, error } = await query;

      if (error) {
        console.error('Error fetching feed cards:', error);
        return response;
      }

      // Early return if no cards
      if (!cards?.length) {
        return response;
      }

      // If user is logged in, fetch their interactions in parallel
      if (userId) {
      const cardIds = cards.map(card => card.id);

      // Fetch likes and bookmarks in parallel
      const [likesResult, bookmarksResult] = await Promise.all([
        supabase
          .from('card_likes')
          .select('card_id')
          .eq('user_id', userId)
          .in('card_id', cardIds),
        supabase
          .from('card_bookmarks')
          .select('card_id')
          .eq('user_id', userId)
          .in('card_id', cardIds)
      ]);

      const likedCardIds = new Set(likesResult.data?.map(like => like.card_id) || []);
      const bookmarkedCardIds = new Set(bookmarksResult.data?.map(bookmark => bookmark.card_id) || []);

      // Add interaction flags to each card immutably
      cards.forEach(card => {
        card.isLiked = likedCardIds.has(card.id);
        card.isBookmarked = bookmarkedCardIds.has(card.id);
      });
    }

    return {
      cards: cards || [],
      decks: [],
      hasMore: (cards?.length || 0) === pageSize
    };
  } catch (error) {
    console.error('Error in getFeedCards:', error);
    return { cards: [], decks: [], hasMore: false };
  }
};
