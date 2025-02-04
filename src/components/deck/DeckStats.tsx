import { useMemo } from 'react';
import { DeckWithCards } from '../../types/deck';
import { DBCard } from '../../types/card';

interface DeckStatsProps {
  deck: DeckWithCards;
}

export const DeckStats: React.FC<DeckStatsProps> = ({ deck }) => {
  const stats = useMemo(() => {
    const mainDeckStats = {
      total: deck.main_deck_count,
      monsters: 0,
      spells: 0,
      traps: 0,
      levels: {} as Record<number, number>,
      attributes: {} as Record<string, number>,
      types: {} as Record<string, number>,
    };

    deck.main_deck.forEach((deckCard) => {
      const card = deckCard.card;
      if (!card) return;

      // Count by card type
      if (card.cardType === 'Monster') {
        mainDeckStats.monsters++;
        // Track levels
        const level = parseInt(card.cardLevel) || 0;
        mainDeckStats.levels[level] = (mainDeckStats.levels[level] || 0) + 1;
        // Track attributes
        if (card.cardAttr) {
          mainDeckStats.attributes[card.cardAttr] = 
            (mainDeckStats.attributes[card.cardAttr] || 0) + 1;
        }
        // Track monster types
        if (card.cardRace) {
          mainDeckStats.types[card.cardRace] = 
            (mainDeckStats.types[card.cardRace] || 0) + 1;
        }
      } else if (card.cardType === 'Spell') {
        mainDeckStats.spells++;
      } else if (card.cardType === 'Trap') {
        mainDeckStats.traps++;
      }
    });

    return {
      mainDeck: mainDeckStats,
      extraDeck: deck.extra_deck_count,
      sideDeck: deck.side_deck_count,
    };
  }, [deck]);

  const renderDistributionBar = (value: number, total: number, color: string) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="h-2 bg-gray-200 rounded overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const getCardTypeColor = (type: string) => {
    switch (type) {
      case 'Monster': return 'bg-amber-500';
      case 'Spell': return 'bg-green-500';
      case 'Trap': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getAttributeColor = (attr: string) => {
    switch (attr.toLowerCase()) {
      case 'light': return 'bg-yellow-400';
      case 'dark': return 'bg-gray-800';
      case 'earth': return 'bg-amber-700';
      case 'water': return 'bg-blue-500';
      case 'fire': return 'bg-red-500';
      case 'wind': return 'bg-green-400';
      case 'divine': return 'bg-yellow-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-6">
      {/* Main Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold">{stats.mainDeck.total}</div>
          <div className="text-sm text-gray-600">Main Deck</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{stats.extraDeck}</div>
          <div className="text-sm text-gray-600">Extra Deck</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{stats.sideDeck}</div>
          <div className="text-sm text-gray-600">Side Deck</div>
        </div>
      </div>

      {/* Card Type Distribution */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Card Type Distribution
        </h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                Monsters
              </span>
              <span className="font-medium">{stats.mainDeck.monsters}</span>
            </div>
            {renderDistributionBar(stats.mainDeck.monsters, stats.mainDeck.total, 'bg-amber-500')}
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                Spells
              </span>
              <span className="font-medium">{stats.mainDeck.spells}</span>
            </div>
            {renderDistributionBar(stats.mainDeck.spells, stats.mainDeck.total, 'bg-green-500')}
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                Traps
              </span>
              <span className="font-medium">{stats.mainDeck.traps}</span>
            </div>
            {renderDistributionBar(stats.mainDeck.traps, stats.mainDeck.total, 'bg-purple-500')}
          </div>
        </div>
      </div>

      {/* Level Distribution */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Level Distribution
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(stats.mainDeck.levels)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([level, count]) => (
              <div key={level} className="text-center p-2 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-amber-600">★{level}</div>
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-gray-500">
                  {((count / stats.mainDeck.monsters) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Attribute Distribution */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          Attribute Distribution
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(stats.mainDeck.attributes).map(([attr, count]) => (
            <div key={attr} className="text-center p-2 rounded-lg bg-gray-50">
              <div className={`inline-block w-4 h-4 rounded-full ${getAttributeColor(attr)} mb-1`}></div>
              <div className="text-sm font-medium">{attr}</div>
              <div className="text-lg font-bold">{count}</div>
              <div className="text-xs text-gray-500">
                {((count / stats.mainDeck.monsters) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monster Types */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Monster Types
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stats.mainDeck.types)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => (
              <div key={type} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                <span className="text-sm font-medium">{type}</span>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
