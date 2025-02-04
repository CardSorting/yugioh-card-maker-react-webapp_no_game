import { useState, useEffect } from 'react';
import { getCardDetail } from '../../services/card/cardService';
import { DBCard } from '../../types/card';

interface UseCardDetailReturn {
  card: DBCard | null;
  loading: boolean;
  error: string | null;
  setCard: React.Dispatch<React.SetStateAction<DBCard | null>>;
}

export const useCardDetail = (id: string): UseCardDetailReturn => {
  const [card, setCard] = useState<DBCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCardDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedCard = await getCardDetail(id);
        setCard(fetchedCard);
      } catch (e: any) {
        setError(e.message || "Failed to load card detail");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCardDetail();
    } else {
      setLoading(false);
      setError("No card ID provided");
    }
  }, [id]);

  return { card, loading, error, setCard };
};
