import { useState, useEffect, useCallback } from 'react';
import { getFeedCards, FeedSortOption, DeckSortOption } from '../../services/card/feedService';
import { DBCard } from '../../types/card';
import { DeckDetails } from '../../types/deck';
import { Card } from '../../types/profile';
import { useAuth } from '../../context/AuthContext';

interface UseFeedResult {
  cards: Card[];
  decks: DeckDetails[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  sortBy: FeedSortOption;
  deckSortBy: DeckSortOption;
  setSortBy: (option: FeedSortOption) => void;
  setDeckSortBy: (option: DeckSortOption) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFeed = (initialSort: FeedSortOption = 'latest'): UseFeedResult => {
  // Authentication context first
  const { session } = useAuth();
  
  // Then all useState hooks grouped together
  const [sortBy, setSortBy] = useState<FeedSortOption>(initialSort);
  const [deckSortBy, setDeckSortBy] = useState<DeckSortOption>('bookmarks');
  const [page, setPage] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<DeckDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  const fetchContent = useCallback(async (pageNum: number, replace: boolean = false) => {
    // Reset error state at the start of each fetch
    setError(null);
    try {
      setError(null);
      setLoading(true);
      
      const result = await getFeedCards({
        page: pageNum,
        pageSize: PAGE_SIZE,
        sortBy,
        userId: session?.user?.id,
        deckSortBy
      });

      setHasMore(result.hasMore);

      // Process cards and decks in a stable order
      if (replace) {
        // Reset both states when replacing
        setCards(result.cards.map(card => ({
          id: card.id,
          card_title: card.cardTitle,
          card_image_path: card.card_image_path,
          likes_count: card.likes_count,
          comments_count: card.comments_count,
          user_id: card.user_id,
          isLiked: card.isLiked,
          created_at: card.created_at
        })));
        setDecks(result.decks);
      } else {
        // Append to existing data
        setCards(prev => [
          ...prev,
          ...result.cards.map(card => ({
            id: card.id,
            card_title: card.cardTitle,
            card_image_path: card.card_image_path,
            likes_count: card.likes_count,
            comments_count: card.comments_count,
            user_id: card.user_id,
            isLiked: card.isLiked,
            created_at: card.created_at
          }))
        ]);
        setDecks(prev => [...prev, ...result.decks]);
      }

    } catch (err) {
      setError('Failed to load content');
      console.error('Error in useFeed:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, deckSortBy, session?.user?.id]);

  // Initial load
  useEffect(() => {
    setPage(0);
    fetchContent(0, true);
  }, [sortBy, deckSortBy, fetchContent]);

  const loadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchContent(nextPage);
    }
  };

  const refresh = async () => {
    setPage(0);
    await fetchContent(0, true);
  };

  return {
    cards,
    decks,
    loading,
    error,
    hasMore,
    sortBy,
    deckSortBy,
    setSortBy,
    setDeckSortBy,
    loadMore,
    refresh
  };
};
