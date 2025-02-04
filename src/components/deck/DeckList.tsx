import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DeckDetails } from '../../types/deck';
import { useDeckActions } from '../../hooks/deck/useDeckActions';

interface DeckListProps {
  decks: DeckDetails[];
  onCreateDeck?: () => void;
  onDeckDeleted?: () => void;
  onTogglePublic?: (deckId: string) => void;
  onToggleBookmark?: (deckId: string) => void;
  showActions?: boolean;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  onCreateDeck,
  onDeckDeleted,
  onTogglePublic,
  onToggleBookmark,
  showActions = true
}) => {
  const { loading, error, deleteDeck } = useDeckActions();

  const handleDeleteDeck = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      const success = await deleteDeck(id);
      if (success && onDeckDeleted) {
        onDeckDeleted();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center mt-5">
        <span className="text-gray-600">Loading decks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center mt-5">
        <span className="text-red-500">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Decks</h2>
        {showActions && onCreateDeck && (
          <button
            onClick={onCreateDeck}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create New Deck
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {decks.map((deck) => (
          <div
            key={deck.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden relative"
          >
            {/* Public Badge */}
            {deck.public && (
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                Public
              </div>
            )}
            
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {deck.name}
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Main Deck</span>
                  <span className={`font-medium ${
                    deck.main_deck_count > 60 ? 'text-red-500' : 'text-gray-900'
                  }`}>
                    {deck.main_deck_count}/60
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Extra Deck</span>
                  <span className={`font-medium ${
                    deck.extra_deck_count > 15 ? 'text-red-500' : 'text-gray-900'
                  }`}>
                    {deck.extra_deck_count}/15
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Side Deck</span>
                  <span className={`font-medium ${
                    deck.side_deck_count > 15 ? 'text-red-500' : 'text-gray-900'
                  }`}>
                    {deck.side_deck_count}/15
                  </span>
                </div>
                {/* Bookmark count */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Bookmarks</span>
                  <span className="font-medium text-gray-900">
                    {deck.bookmark_count}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link 
                  to={`/decks/${deck.id}`}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600 transition-colors"
                >
                  {showActions ? 'Edit' : 'View'}
                </Link>
                
                {showActions ? (
                  <>
                    <button 
                      onClick={() => handleDeleteDeck(deck.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                    {onTogglePublic && (
                      <button
                        onClick={() => onTogglePublic(deck.id)}
                        className={`px-4 py-2 rounded transition-colors ${
                          deck.public
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-500 hover:bg-gray-600'
                        } text-white`}
                      >
                        {deck.public ? 'Make Private' : 'Make Public'}
                      </button>
                    )}
                  </>
                ) : (
                  onToggleBookmark && (
                    <button
                      onClick={() => onToggleBookmark(deck.id)}
                      className={`px-4 py-2 rounded transition-colors ${
                        deck.is_bookmarked
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-gray-500 hover:bg-gray-600'
                      } text-white`}
                    >
                      {deck.is_bookmarked ? 'Unbookmark' : 'Bookmark'}
                    </button>
                  )
                )}
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
              Last updated: {new Date(deck.updated_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {decks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <span className="text-gray-500 text-lg">
            {showActions 
              ? 'No decks created yet. Start by creating a new deck!'
              : 'No decks found.'}
          </span>
        </div>
      )}
    </div>
  );
};
