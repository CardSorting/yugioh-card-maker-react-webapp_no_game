import React from 'react';
import { Link } from 'react-router-dom';
import { DBCard } from '../../types/card';

interface CardInfoProps {
  card: DBCard;
}

export const CardInfo: React.FC<CardInfoProps> = ({ card }) => {
  return (
    <div>
      {/* Likes Section */}
      <div className="mb-2">
        <span className="font-semibold text-[14px]">
          {card.likes_count?.toLocaleString()} likes
        </span>
      </div>

      {/* Caption Section */}
      <div className="space-y-1">
        <div className="flex items-start">
          <Link
            to={`/profile/${card.user_id}`}
            className="font-semibold text-[14px] hover:text-gray-500 transition-colors mr-1.5"
          >
            {card.creator_username || 'User'}
          </Link>
          <span className="text-[14px] leading-[18px] text-gray-900">{card.cardTitle}</span>
        </div>

        {/* View all comments link (if there are comments) */}
        {card.comments_count > 0 && (
          <button className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">
            View all {card.comments_count?.toLocaleString()} comments
          </button>
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">
          {card.created_at && new Date(card.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  );
};
