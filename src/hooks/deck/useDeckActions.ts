import { useState, useCallback } from 'react';
import { 
  DeckDetails, 
  DeckWithCards, 
  DeckCard, 
  CreateDeckInput,
  UpdateDeckInput,
  AddCardToDeckInput,
  UpdateDeckCardInput,
  GetDecksParams
} from '../../types/deck';
import * as deckService from '../../services/deck/deckService';

export const useDeckActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDeck = useCallback(async (input: CreateDeckInput): Promise<DeckDetails | null> => {
    setLoading(true);
    setError(null);
    try {
      const deck = await deckService.createDeck(input);
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
      const deck = await deckService.updateDeck(id, input);
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
      const success = await deckService.deleteDeck(id);
      if (!success) {
        setError('Failed to delete deck');
        return false;
      }
      return true;
    } catch (err) {
      setError('An error occurred while deleting the deck');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeckDetails = useCallback(async (id: string): Promise<DeckWithCards | null> => {
    setLoading(true);
    setError(null);
    try {
      const deck = await deckService.getDeckDetails(id);
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
      const decks = await deckService.getUserDecks(params);
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
      const result = await deckService.toggleDeckPublic(deckId);
      if (typeof result === 'string') {
        setError(result); // Set the error message from deckService
        return false;
      }
      return result; // It's true if successful
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
      const success = await deckService.toggleDeckBookmark(deckId);
      if (!success) {
        setError('Failed to toggle deck bookmark');
        return false;
      }
      return true;
    } catch (err) {
      setError('An error occurred while toggling deck bookmark');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCardToDeck = useCallback(async (input: AddCardToDeckInput): Promise<DeckCard | null> => {
    setLoading(true);
    setError(null);
    try {
      const deckCard = await deckService.addCardToDeck(input);
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
      const success = await deckService.removeCardFromDeck(deckId, cardId);
      if (!success) {
        setError('Failed to remove card from deck');
        return false;
      }
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
      const deckCard = await deckService.updateDeckCard(deckId, cardId, input);
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
      const success = await deckService.reorderDeckCards(deckId, cardIds);
      if (!success) {
        setError('Failed to reorder deck cards');
        return false;
      }
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
