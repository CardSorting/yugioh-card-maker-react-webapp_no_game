import { useDrag } from 'react-dnd';
import { DeckCard as DeckCardType, DeckType } from '../../types/deck';

interface DeckCardProps {
  deckCard: DeckCardType;
  onRemove: (card: DeckCardType) => void;
  onMove: (card: DeckCardType, newDeckType: DeckType) => void;
  className?: string;
  readOnly?: boolean;
}

export const DeckCard: React.FC<DeckCardProps> = ({
  deckCard,
  onRemove,
  onMove,
  className = '',
  readOnly = false,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'DECK_CARD',
    item: deckCard,
    canDrag: !readOnly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleContextMenu = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const menu = document.createElement('div');
    menu.className = 'fixed bg-white rounded-lg shadow-lg py-2 z-50';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const addMenuItem = (text: string, onClick: () => void) => {
      const item = document.createElement('button');
      item.className = 'w-full px-4 py-2 text-left hover:bg-gray-100 text-sm';
      item.textContent = text;
      item.onclick = () => {
        onClick();
        document.body.removeChild(menu);
      };
      menu.appendChild(item);
    };

    // Add menu items
    addMenuItem('Remove from Deck', () => onRemove(deckCard));
    
    // Add move options based on current deck type
    if (deckCard.deck_type !== 'main') {
      addMenuItem('Move to Main Deck', () => onMove(deckCard, 'main'));
    }
    if (deckCard.deck_type !== 'extra') {
      addMenuItem('Move to Extra Deck', () => onMove(deckCard, 'extra'));
    }
    if (deckCard.deck_type !== 'side') {
      addMenuItem('Move to Side Deck', () => onMove(deckCard, 'side'));
    }

    // Add menu to body
    document.body.appendChild(menu);

    // Remove menu on click outside
    const removeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', removeMenu);
      }
    };
    document.addEventListener('click', removeMenu);
  };

  if (!deckCard.card) return null;

  const card = deckCard.card;
  const social = 'social' in card ? (card as any).social : null;

  return (
    <div
      ref={drag}
      onContextMenu={handleContextMenu}
      className={`relative group ${readOnly ? '' : 'cursor-move'} ${
        isDragging ? 'opacity-50' : ''
      } ${className}`}
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <img
          src={card.card_image_path}
          alt={card.cardTitle}
          className="w-full h-full object-cover"
        />
        
        {/* Social Features Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
          <div className="text-white text-sm font-medium mb-2 truncate">
            {card.cardTitle}
          </div>
          {social && (
            <div className="flex items-center space-x-2 text-xs text-white/80">
              <span>❤️ {social.likes_count}</span>
              <span>💬 {social.comments_count}</span>
              {social.creator_username && (
                <span className="truncate">👤 {social.creator_username}</span>
              )}
            </div>
          )}
          <div className="flex justify-between items-center mt-1">
          {!readOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(deckCard);
              }}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
            >
              Remove
            </button>
          )}
            <div className="text-xs text-white/80">
              {card.cardType} • {card.cardRace}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
