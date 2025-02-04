import { useState, useEffect, useCallback } from 'react';
import { getFeedCards, FeedSortOption } from '../../services/card/feedService';
import { DBCard } from '../../types/card';
import { Card } from '../../types/profile';
import { useAuth } from '../../context/AuthContext';

interface UseFeedResult {
  cards: Card[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  sortBy: FeedSortOption;
  setSortBy: (option: FeedSortOption) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFeed = (initialSort: FeedSortOption = 'latest'): UseFeedResult => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<FeedSortOption>(initialSort);
  
  const { session } = useAuth();
  const PAGE_SIZE = 12;

  const fetchCards = useCallback(async (pageNum: number, replace: boolean = false) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await getFeedCards({
        page: pageNum,
        pageSize: PAGE_SIZE,
        sortBy,
        userId: session?.user?.id
      });

      setHasMore(result.hasMore);
      const transformedCards: Card[] = result.cards.map(card => ({
        id: card.id,
        card_title: card.cardTitle,
        card_image_path: card.card_image_path,
        likes_count: card.likes_count,
        comments_count: card.comments_count,
        user_id: card.user_id,
        isLiked: card.isLiked,
        created_at: card.created_at
      }));
      setCards(prev => replace ? transformedCards : [...prev, ...transformedCards]);
    } catch (err) {
      setError('Failed to load cards');
      console.error('Error in useFeed:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, session?.user?.id]);

  // Initial load
  useEffect(() => {
    setPage(0);
    fetchCards(0, true);
  }, [sortBy, fetchCards]);

  const loadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchCards(nextPage);
    }
  };

  const refresh = async () => {
    setPage(0);
    await fetchCards(0, true);
  };

  return {
    cards,
    loading,
    error,
    hasMore,
    sortBy,
    setSortBy,
    loadMore,
    refresh
  };
};
