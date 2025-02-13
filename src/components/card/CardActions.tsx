import React, { useState } from 'react';
import { DBCard } from '../../types/card';
import { useAuth } from '../../context/AuthContext';

interface CardActionsProps {
  card: DBCard;
  onLikeToggle: () => Promise<void>;
  onBookmarkToggle: () => Promise<void>;
  disabled?: boolean;
}

export const CardActions: React.FC<CardActionsProps> = ({
  card,
  onLikeToggle,
  onBookmarkToggle,
  disabled = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleLikeClick = async () => {
    if (!user) {
      setError('Please sign in to like cards');
      return;
    }
    try {
      setError(null);
      await onLikeToggle();
    } catch (err) {
      setError('Failed to update like');
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmarkClick = async () => {
    if (!user) {
      setError('Please sign in to bookmark cards');
      return;
    }
    try {
      setError(null);
      await onBookmarkToggle();
    } catch (err) {
      setError('Failed to update bookmark');
      console.error('Error toggling bookmark:', err);
    }
  };

  return (
    <div className="flex flex-col mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <button
              onClick={handleLikeClick}
              className="p-1 hover:opacity-60 transition-opacity"
              disabled={disabled}
            >
              {card.isLiked ? (
                <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              )}
            </button>
            <span className="text-sm text-gray-600">{card.likes_count}</span>
          </div>
          <div className="flex flex-col items-center">
            <button className="p-1 hover:opacity-60 transition-opacity" disabled={disabled}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </button>
            <span className="text-sm text-gray-600">{card.comments_count}</span>
          </div>
        </div>
        <button 
          onClick={handleBookmarkClick}
          className="p-1 hover:opacity-60 transition-opacity"
          disabled={disabled}
        >
          {card.isBookmarked ? (
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};
