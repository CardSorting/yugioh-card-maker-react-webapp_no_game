import React from 'react';
import { Card } from '../../types/profile';
import { ProfileCard } from './ProfileCard';

interface ProfileGridProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  onLike?: (cardId: string) => Promise<void>;
  onUnlike?: (cardId: string) => Promise<void>;
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  cards,
  onCardClick,
  onLike,
  onUnlike
}) => {
  if (!cards.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No cards found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 py-8">
      {cards.map((card) => (
        <ProfileCard
          key={card.id}
          card={card}
          onCardClick={onCardClick}
          onLike={onLike}
          onUnlike={onUnlike}
        />
      ))}
    </div>
  );
};
