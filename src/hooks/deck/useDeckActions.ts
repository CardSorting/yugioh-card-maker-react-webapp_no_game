import { useState, useCallback } from 'react';
import { 
  DeckDetails, 
  DeckCard, 
  CreateDeckInput,
  UpdateDeckInput,
  AddCardToDeckInput,
  UpdateDeckCardInput,
  GetDecksParams
} from '../../types/deck';
import { DeckService } from '../../services/deck/deckService';
import { useAuth } from '../../context/AuthContext';

export const useDeckActions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDeck = useCallback(async (input: CreateDeckInput): Promise<DeckDetails | null> => {
    setLoading(true);
    setError(null);
    try {
      const deck = await DeckService.createDeck(input);
      if (!deck) {
        setError('Failed to create deck');
        return null;
      }
      return deck;
    } catch (err) {
      setError('An error occurred while creating the deck');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDeck = useCallback(async (id: string, input: UpdateDeckInput): Promise<DeckDetails | null> => {
    setLoading(true);
    setError(null);
    try {
      const deck = await DeckService.updateDeck(id, input);
      if (!deck) {
        setError('Failed to update deck');
        return null;
      }
      return deck;
    } catch (err) {
      setError('An error occurred while updating the deck');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDeck = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await DeckService.deleteDeck(id);
      return true;
    } catch (err) {
      setError('An error occurred while deleting the deck');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeckDetails = useCallback(async (id: string): Promise<DeckDetails | null> => {
    setLoading(true);
    setError(null);
    try {
      const deck = await DeckService.getDeckDetails(id);
      if (!deck) {
        setError('Failed to fetch deck details');
        return null;
      }
      return deck;
    } catch (err) {
      setError('An error occurred while fetching deck details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserDecks = useCallback(async (params?: GetDecksParams): Promise<DeckDetails[]> => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setError('User must be logged in');
        return [];
      }
      const decks = await DeckService.getUserDecks({ ...params, userId: user.id });
      return decks;
    } catch (err) {
      setError('An error occurred while fetching user decks');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleDeckPublic = useCallback(async (deckId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await DeckService.toggleDeckPublic(deckId);
      return true;
    } catch (err) {
      setError('An error occurred while toggling deck public status');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleDeckBookmark = useCallback(async (deckId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setError('User must be logged in');
        return false;
      }
      await DeckService.toggleDeckBookmark(deckId, user.id);
      return true;
    } catch (err) {
      setError('An error occurred while toggling deck bookmark');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const addCardToDeck = useCallback(async (input: AddCardToDeckInput): Promise<DeckCard | null> => {
    setLoading(true);
    setError(null);
    try {
      const deckCard = await DeckService.addCardToDeck(input);
      if (!deckCard) {
        setError('Failed to add card to deck');
        return null;
      }
      return deckCard;
    } catch (err) {
      setError('An error occurred while adding card to deck');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCardFromDeck = useCallback(async (deckId: string, cardId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await DeckService.removeCardFromDeck(deckId, cardId);
      return true;
    } catch (err) {
      setError('An error occurred while removing card from deck');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDeckCard = useCallback(async (
    deckId: string,
    cardId: string,
    input: UpdateDeckCardInput
  ): Promise<DeckCard | null> => {
    setLoading(true);
    setError(null);
    try {
      const deckCard = await DeckService.updateDeckCard(deckId, cardId, input);
      if (!deckCard) {
        setError('Failed to update deck card');
        return null;
      }
      return deckCard;
    } catch (err) {
      setError('An error occurred while updating deck card');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderDeckCards = useCallback(async (
    deckId: string,
    cardIds: string[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await DeckService.reorderDeckCards(deckId, cardIds);
      return true;
    } catch (err) {
      setError('An error occurred while reordering deck cards');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createDeck,
    updateDeck,
    deleteDeck,
    getDeckDetails,
    getUserDecks,
    toggleDeckPublic,
    toggleDeckBookmark,
    addCardToDeck,
    removeCardFromDeck,
    updateDeckCard,
    reorderDeckCards
  };
};
