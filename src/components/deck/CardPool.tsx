import { useMemo, useState } from 'react';
import { DBCard } from '../../types/card';
import { Menu } from '@headlessui/react';
import { useDrag } from 'react-dnd';

interface CardPoolProps {
  cards: DBCard[];
  onAddCard: (card: DBCard, deckType: 'main' | 'extra' | 'side') => void;
  readOnly?: boolean;
}

interface CardItemProps {
  card: DBCard;
  onAddCard: (card: DBCard, deckType: 'main' | 'extra' | 'side') => void;
  readOnly?: boolean;
}

const CardItem: React.FC<CardItemProps> = ({ card, onAddCard, readOnly = false }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: card,
    canDrag: !readOnly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`relative group ${readOnly ? '' : 'cursor-move'} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <img
          src={card.card_image_path}
          alt={card.cardTitle}
          className="w-full h-full object-cover"
        />
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
          <div className="text-white text-sm font-medium mb-2 truncate">
            {card.cardTitle}
          </div>
          {!readOnly && (
            <Menu as="div" className="relative">
              <Menu.Button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Add to Deck
              </Menu.Button>
              <Menu.Items className="absolute bottom-full left-0 w-full mb-1 bg-white rounded shadow-lg py-1 z-10">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-blue-50' : ''
                    } w-full text-left text-xs px-3 py-1`}
                    onClick={() => onAddCard(card, 'main')}
                  >
                    Main Deck
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-blue-50' : ''
                    } w-full text-left text-xs px-3 py-1`}
                    onClick={() => onAddCard(card, 'extra')}
                  >
                    Extra Deck
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-blue-50' : ''
                    } w-full text-left text-xs px-3 py-1`}
                    onClick={() => onAddCard(card, 'side')}
                  >
                    Side Deck
                  </button>
                )}
              </Menu.Item>
              </Menu.Items>
            </Menu>
          )}
        </div>
      </div>
    </div>
  );
};

export const CardPool: React.FC<CardPoolProps> = ({ cards, onAddCard, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cardType, setCardType] = useState<'all' | 'monster' | 'spell' | 'trap'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'recent'>('name');
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredAndSortedCards = useMemo(() => {
    // Filter cards
    const filtered = cards.filter((card) => {
      const matchesSearch = card.cardTitle?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        cardType === 'all' ||
        (cardType === 'monster' && card.cardType === 'Monster') ||
        (cardType === 'spell' && card.cardType === 'Spell') ||
        (cardType === 'trap' && card.cardType === 'Trap');
      
      return matchesSearch && matchesType;
    });

    // Sort cards
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.cardTitle.localeCompare(b.cardTitle);
        case 'type':
          if (a.cardType === b.cardType) {
            return a.cardTitle.localeCompare(b.cardTitle);
          }
          return a.cardType.localeCompare(b.cardType);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [cards, searchTerm, cardType, sortBy]);

  const cardTypeStats = useMemo(() => {
    return {
      monster: cards.filter(card => card.cardType === 'Monster').length,
      spell: cards.filter(card => card.cardType === 'Spell').length,
      trap: cards.filter(card => card.cardType === 'Trap').length,
    };
  }, [cards]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`w-full px-3 py-2 pl-10 rounded-lg border transition-all duration-200 ${
              searchFocused
                ? 'border-blue-500 ring-2 ring-blue-100'
                : 'border-gray-300'
            }`}
          />
          <svg
            className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
              searchFocused ? 'text-blue-500' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCardType('all')}
              className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                cardType === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              All ({cards.length})
            </button>
            <button
              onClick={() => setCardType('monster')}
              className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                cardType === 'monster'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Monsters ({cardTypeStats.monster})
            </button>
            <button
              onClick={() => setCardType('spell')}
              className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                cardType === 'spell'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Spells ({cardTypeStats.spell})
            </button>
            <button
              onClick={() => setCardType('trap')}
              className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                cardType === 'trap'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Traps ({cardTypeStats.trap})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'type' | 'recent')}
            className="text-sm border rounded-lg px-2 py-1 bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {filteredAndSortedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {cards.length === 0 ? (
              <>
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-lg font-medium">No Cards Available</p>
                <p className="text-sm text-center max-w-sm">You need to create some cards before you can add them to your deck.</p>
              </>
            ) : (
              <>
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">No cards found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredAndSortedCards.map((card) => (
              <CardItem key={card.id} card={card} onAddCard={onAddCard} readOnly={readOnly} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
