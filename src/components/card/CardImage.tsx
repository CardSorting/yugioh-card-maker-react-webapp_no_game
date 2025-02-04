import React from 'react';
import { DBCard } from '../../types/card';

interface CardImageProps {
  card: DBCard;
}

export const CardImage: React.FC<CardImageProps> = ({ card }) => {
  return (
    <div className="lg:flex lg:items-center lg:justify-center bg-white border-r border-gray-200">
      <img
        src={card.card_image_path}
        alt={card.cardTitle}
        className="w-full h-[600px] object-contain"
      />
    </div>
  );
};
