import { useState } from 'react';
import { CardActionService } from '../../services/card/cardActionService';
import { DBCard } from '../../types/card';

interface UseCardActionsReturn {
  handleLikeToggle: () => Promise<void>;
  handleBookmarkToggle: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useCardActions = (
  card: DBCard | null, 
  userId: string | undefined,
  onCardUpdate: (card: DBCard) => void
): UseCardActionsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLikeToggle = async () => {
    if (!card || !userId) return;
    
    try {
      setLoading(true);
      setError(null);

      if (card.isLiked) {
        await CardActionService.unlikeCard(userId, card.id);
      } else {
        await CardActionService.likeCard(userId, card.id);
      }

      // Get updated like count from server
      const updatedLikeCount = await CardActionService.getLikeCount(card.id);
      const isLiked = await CardActionService.isCardLiked(userId, card.id);

      onCardUpdate({
        ...card,
        likes_count: updatedLikeCount,
        isLiked: isLiked
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling like');
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!card || !userId) return;
    
    try {
      setLoading(true);
      setError(null);

      if (card.isBookmarked) {
        await CardActionService.removeBookmark(userId, card.id);
      } else {
        await CardActionService.bookmarkCard(userId, card.id);
      }

      // Get updated bookmark status from server
      const isBookmarked = await CardActionService.isCardBookmarked(userId, card.id);

      onCardUpdate({
        ...card,
        isBookmarked: isBookmarked
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling bookmark');
      console.error('Error toggling bookmark:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLikeToggle,
    handleBookmarkToggle,
    loading,
    error
  };
};
