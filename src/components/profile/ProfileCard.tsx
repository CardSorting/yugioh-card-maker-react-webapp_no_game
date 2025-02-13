import React from 'react';
import { Card } from '../../types/profile';

interface ProfileCardProps {
  card: Card;
  onCardClick: (card: Card) => void;
  onLike?: (cardId: string) => Promise<void>;
  onUnlike?: (cardId: string) => Promise<void>;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  card,
  onCardClick,
  onLike,
  onUnlike
}) => {
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onLike || !onUnlike) return;
    
    if (card.isLiked) {
      await onUnlike(card.id);
    } else {
      await onLike(card.id);
    }
  };

  return (
    <div
      onClick={() => onCardClick(card)}
      className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Card Image */}
      <img
        src={card.image_url}
        alt={card.title}
        className="w-full h-full object-cover"
      />
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-4 text-white">
          {/* Like Button */}
          {(onLike || onUnlike) && (
            <button
              onClick={handleLikeClick}
              className="flex items-center gap-1 hover:scale-110 transition-transform"
            >
              <svg
                className={`w-6 h-6 ${card.isLiked ? 'text-red-500 fill-current' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{card.likes_count}</span>
            </button>
          )}

          {/* Comments Count */}
          <div className="flex items-center gap-1">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{card.comments_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
