import React from 'react';
import { Link } from 'react-router-dom';
import { DBCard } from '../../types/card';

interface CardHeaderProps {
  card: DBCard;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ card }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full ring-[2px] ring-gray-100 ring-offset-1 flex-shrink-0 overflow-hidden bg-gray-100">
          {card.creator_profile_image && (
            <img
              src={card.creator_profile_image}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <Link
          to={`/profile/${card.user_id}`}
          className="ml-3 font-medium text-[14px] hover:text-gray-500 transition-colors"
        >
          {card.creator_username || 'User'}
        </Link>
      </div>
      <button className="text-gray-900 hover:text-gray-600 transition-colors">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
      </button>
    </div>
  );
};
