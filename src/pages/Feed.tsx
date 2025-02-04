import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeed } from '../hooks/card/useFeed';
import { ProfileGrid } from '../components/profile/ProfileGrid';
import type { Card } from '../types/profile';

const Feed = () => {
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const {
    cards,
    loading,
    error,
    hasMore,
    sortBy,
    setSortBy,
    loadMore
  } = useFeed();

  const handleCardClick = (card: Card) => {
    navigate(`/cards/${card.id}`);
  };

  // Infinite scroll setup
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore, loadMore]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  if (error) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Feed Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
          <div className="mt-4 flex gap-4">
            <button 
              onClick={() => setSortBy('latest')}
              className={`py-2 px-4 text-sm font-medium rounded-lg ${
                sortBy === 'latest' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Latest
            </button>
            <button 
              onClick={() => setSortBy('popular')}
              className={`py-2 px-4 text-sm font-medium rounded-lg ${
                sortBy === 'popular' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Popular
            </button>
            <button 
              onClick={() => setSortBy('following')}
              className={`py-2 px-4 text-sm font-medium rounded-lg ${
                sortBy === 'following' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Following
            </button>
          </div>
        </div>

        {/* Card Grid */}
        {cards.length > 0 ? (
          <div className="py-8">
            <ProfileGrid 
              cards={cards}
              onCardClick={handleCardClick}
            />
            <div ref={lastElementRef} />
          </div>
        ) : !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No cards found</p>
          </div>
        ) : null}

        {/* Loading Indicator */}
        {loading && (
          <div 
            ref={loadingRef}
            className="flex justify-center py-8"
          >
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
