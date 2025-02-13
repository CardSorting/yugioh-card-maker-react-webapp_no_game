import client from '../../client';
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
    const { data } = await client.get('/feed', {
      params: {
        page,
        pageSize,
        sortBy,
        userId,
        deckSortBy
      }
    });
    return data;
  } catch (error) {
    console.error('Error in getFeedCards:', error);
    return { cards: [], decks: [], hasMore: false };
  }
};
