import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DeckWithCards, DeckCard, DeckType } from '../../types/deck';
import { DBCard } from '../../types/card';
import { useDeckActions } from '../../hooks/deck/useDeckActions';
import { CardPool } from './CardPool';
import { DeckZone } from './DeckZone';
import { DeckStats } from './DeckStats';

interface DeckEditorProps {
  deckId: string;
  userCards: DBCard[];
}

interface CardWithSocial extends DBCard {
  social?: {
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    is_bookmarked: boolean;
    creator_username: string | null;
    creator_profile_image: string | null;
  };
}

export const DeckEditor: React.FC<DeckEditorProps> = ({ deckId, userCards = [] }) => {
  const [deck, setDeck] = useState<DeckWithCards | null>(null);
  const {
    loading,
    error,
    getDeckDetails,
    addCardToDeck,
    removeCardFromDeck,
    updateDeckCard
  } = useDeckActions();

  useEffect(() => {
    loadDeck();
  }, [deckId]);

  useEffect(() => {
    console.log('User cards updated:', userCards.length);
  }, [userCards]);

  const loadDeck = async () => {
    console.log('Loading deck details for:', deckId);
    const deckDetails = await getDeckDetails(deckId);
    console.log('Fetched deck details:', deckDetails);
    
    if (deckDetails) {
      console.log('Deck cards:', {
        main: deckDetails.main_deck?.length || 0,
        extra: deckDetails.extra_deck?.length || 0,
        side: deckDetails.side_deck?.length || 0
      });
      setDeck(deckDetails);
    }
  };

  const handleAddCard = async (card: CardWithSocial, deckType: DeckType) => {
    if (!deck) {
      console.error('Cannot add card - deck not loaded');
      return;
    }

    console.log('Adding card to deck:', {
      cardId: card.id,
      cardTitle: card.cardTitle,
      deckType,
      currentCounts: {
        main: deck.main_deck_count,
        extra: deck.extra_deck_count,
        side: deck.side_deck_count
      }
    });

    // Check deck size limits
    const maxCount = deckType === 'main' ? 60 : 15;
    const currentCount = deckType === 'main' 
      ? deck.main_deck_count 
      : deckType === 'extra' 
        ? deck.extra_deck_count 
        : deck.side_deck_count;

    if (currentCount >= maxCount) {
      console.warn(`${deckType} deck is at maximum capacity`);
      alert(`${deckType} deck is at maximum capacity`);
      return;
    }

    const position = deckType === 'main' 
      ? deck.main_deck.length 
      : deckType === 'extra' 
        ? deck.extra_deck.length 
        : deck.side_deck.length;

    console.log('Adding card at position:', position);

    const result = await addCardToDeck({
      deck_id: deckId,
      card_id: card.id,
      deck_type: deckType,
      position
    });

    if (result) {
      console.log('Card added successfully:', result);
      await loadDeck();
    } else {
      console.error('Failed to add card to deck');
    }
  };

  const handleRemoveCard = async (deckCard: DeckCard) => {
    console.log('Removing card from deck:', {
      deckCardId: deckCard.id,
      cardId: deckCard.card_id,
      deckType: deckCard.deck_type
    });

    const success = await removeCardFromDeck(deckId, deckCard.card_id);
    if (success) {
      console.log('Card removed successfully');
      await loadDeck();
    } else {
      console.error('Failed to remove card from deck');
    }
  };

  const handleMoveToDeck = async (deckCard: DeckCard, newDeckType: DeckType) => {
    if (!deck) {
      console.error('Cannot move card - deck not loaded');
      return;
    }

    console.log('Moving card between decks:', {
      cardId: deckCard.card_id,
      fromDeckType: deckCard.deck_type,
      toDeckType: newDeckType,
      currentCounts: {
        main: deck.main_deck_count,
        extra: deck.extra_deck_count,
        side: deck.side_deck_count
      }
    });

    // Check deck size limits
    const maxCount = newDeckType === 'main' ? 60 : 15;
    const currentCount = newDeckType === 'main' 
      ? deck.main_deck_count 
      : newDeckType === 'extra' 
        ? deck.extra_deck_count 
        : deck.side_deck_count;

    if (currentCount >= maxCount) {
      console.warn(`${newDeckType} deck is at maximum capacity`);
      alert(`${newDeckType} deck is at maximum capacity`);
      return;
    }

    const position = newDeckType === 'main' 
      ? deck.main_deck.length 
      : newDeckType === 'extra' 
        ? deck.extra_deck.length 
        : deck.side_deck.length;

    console.log('Moving card to position:', position);

    const result = await updateDeckCard(deckId, deckCard.card_id, {
      deck_type: newDeckType,
      position
    });

    if (result) {
      console.log('Card moved successfully:', result);
      await loadDeck();
    } else {
      console.error('Failed to move card between decks');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-center">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Error Loading Deck</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-gray-500 text-center">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Deck Not Found</h3>
            <p className="text-sm">The deck you're looking for doesn't exist or you don't have permission to view it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen bg-gray-100 p-4">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{deck.name}</h2>
            <p className="text-sm text-gray-600">
              {deck.main_deck_count} cards in main deck • {deck.extra_deck_count} in extra deck • {deck.side_deck_count} in side deck
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => loadDeck()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Card Pool */}
          <div className="col-span-3 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold">Card Pool ({userCards.length})</h3>
            </div>
            <CardPool
              cards={userCards}
              onAddCard={handleAddCard}
            />
          </div>

          {/* Deck Zones */}
          <div className="col-span-6 grid grid-rows-3 gap-4">
            <DeckZone
              title="Main Deck"
              type="main"
              cards={deck.main_deck}
              count={deck.main_deck_count}
              maxCount={60}
              onAddCard={handleAddCard}
              onRemoveCard={handleRemoveCard}
              onMoveCard={handleMoveToDeck}
            />
            <DeckZone
              title="Extra Deck"
              type="extra"
              cards={deck.extra_deck}
              count={deck.extra_deck_count}
              maxCount={15}
              onAddCard={handleAddCard}
              onRemoveCard={handleRemoveCard}
              onMoveCard={handleMoveToDeck}
            />
            <DeckZone
              title="Side Deck"
              type="side"
              cards={deck.side_deck}
              count={deck.side_deck_count}
              maxCount={15}
              onAddCard={handleAddCard}
              onRemoveCard={handleRemoveCard}
              onMoveCard={handleMoveToDeck}
            />
          </div>

          {/* Deck Stats */}
          <div className="col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <DeckStats deck={deck} />
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
              <div className="text-sm space-y-2">
                <p><kbd className="px-2 py-1 bg-gray-100 rounded">Drag</kbd> Move cards between zones</p>
                <p><kbd className="px-2 py-1 bg-gray-100 rounded">Double Click</kbd> Add card to main deck</p>
                <p><kbd className="px-2 py-1 bg-gray-100 rounded">Right Click</kbd> Show card options</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
