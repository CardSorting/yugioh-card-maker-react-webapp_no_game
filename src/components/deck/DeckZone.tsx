import { useDrop } from 'react-dnd';
import { DeckCard as DeckCardComponent } from './DeckCard';
import { DeckCard, DeckType } from '../../types/deck';
import { DBCard } from '../../types/card';

interface DeckZoneProps {
  title: string;
  type: DeckType;
  cards: DeckCard[];
  count: number;
  maxCount: number;
  onAddCard: (card: DBCard & { social?: any }, deckType: DeckType) => void;
  onRemoveCard: (card: DeckCard) => void;
  onMoveCard: (card: DeckCard, newDeckType: DeckType) => void;
  readOnly?: boolean;
}

export const DeckZone: React.FC<DeckZoneProps> = ({
  title,
  type,
  cards,
  count,
  maxCount,
  onAddCard,
  onRemoveCard,
  onMoveCard,
  readOnly = false
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    canDrop: () => !readOnly,
    accept: ['CARD', 'DECK_CARD'],
    drop: (item: (DBCard & { social?: any }) | DeckCard, monitor) => {
      if (count >= maxCount) return;
      
      if ('deck_type' in item) {
        // Item is a DeckCard - move between zones
        if (item.deck_type !== type) {
          onMoveCard(item, type);
        }
      } else {
        // Item is a DBCard - add to deck
        onAddCard(item, type);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getProgressColor = () => {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const validCards = cards.filter(card => card.card !== undefined && card.card !== null);
  
  const sortedCards = [...validCards].sort((a, b) => {
    const cardA = a.card!;
    const cardB = b.card!;
    
    // Sort by card type first
    if (cardA.cardType !== cardB.cardType) {
      const typeOrder = {
        Monster: 1,
        Spell: 2,
        Trap: 3
      };
      return typeOrder[cardA.cardType] - typeOrder[cardB.cardType];
    }
    // Then by card name
    return cardA.cardTitle.localeCompare(cardB.cardTitle);
  });

  return (
    <div
      ref={drop}
      className={`h-full flex flex-col rounded-lg border-2 transition-all duration-200 ${
        isOver ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.01]' : 'border-gray-200'
      }`}
    >
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className={`text-sm px-2 py-1 rounded ${count >= maxCount ? 'bg-red-100 text-red-700' : 'text-gray-600'}`}>
            {count}/{maxCount}
          </span>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${(count / maxCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sortedCards.map((card) => (
            <DeckCardComponent
              key={card.id}
              deckCard={card}
              onRemove={onRemoveCard}
              onMove={onMoveCard}
              readOnly={readOnly}
              className={`transform transition-all duration-200 ${
                isOver ? 'hover:scale-105' : 'hover:scale-102'
              }`}
            />
          ))}
          {!readOnly && count < maxCount && (
            <div 
              className={`aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 
                flex flex-col items-center justify-center text-gray-400 transition-all duration-200
                ${isOver ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm text-center">
                Drop card here<br />
                {maxCount - count} slots remaining
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
