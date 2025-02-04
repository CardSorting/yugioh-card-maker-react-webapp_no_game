import { useParams } from 'react-router-dom';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileGrid } from '../components/profile/ProfileGrid';
import { useProfile } from '../hooks/useProfile';
import type { Card } from '../types/profile';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type TabType = 'cards' | 'bookmarks';

const Profile = () => {
  // Group all hooks at the top
  const navigate = useNavigate();
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('cards');
  const {
    profile,
    cards,
    bookmarkedCards,
    stats,
    loading,
    error,
    updateProfile,
    followUser,
    unfollowUser,
    likeCard,
    unlikeCard,
    isOwnProfile
  } = useProfile(userId);

  const handleCardClick = (card: Card) => {
    // Navigate to card detail view
    navigate(`/cards/${card.id}`);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 max-w-md w-full">
          <div className="animate-pulse space-y-6">
            {/* Profile Header Skeleton */}
            <div className="flex items-center space-x-6">
              <div className="rounded-full bg-gray-200 w-20 h-20"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
            {/* Stats Skeleton */}
            <div className="flex justify-around border-y border-gray-200 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-5 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            {/* Grid Skeleton */}
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  if (!profile) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileHeader 
          profile={profile}
          stats={stats}
          onEditProfile={updateProfile}
          onFollow={!isOwnProfile ? followUser : undefined}
          onUnfollow={!isOwnProfile ? unfollowUser : undefined}
          isOwnProfile={isOwnProfile}
        />

        {/* Navigation */}
        <div className="border-t border-gray-200">
          <div className="flex justify-center">
            <button 
              onClick={() => setActiveTab('cards')}
              className={`py-3 px-4 text-xs font-semibold ${
                activeTab === 'cards' 
                  ? 'text-blue-500 border-t border-blue-500' 
                  : 'text-gray-500'
              } -mt-px flex items-center gap-1`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              CARDS
            </button>
            <button 
              onClick={() => setActiveTab('bookmarks')}
              className={`py-3 px-4 text-xs font-semibold ${
                activeTab === 'bookmarks' 
                  ? 'text-blue-500 border-t border-blue-500' 
                  : 'text-gray-500'
              } -mt-px flex items-center gap-1`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              BOOKMARKS
            </button>
          </div>
        </div>
        
        <ProfileGrid 
          cards={activeTab === 'cards' ? cards : bookmarkedCards}
          onCardClick={handleCardClick}
          onLike={!isOwnProfile ? likeCard : undefined}
          onUnlike={!isOwnProfile ? unlikeCard : undefined}
        />
      </div>
    </div>
  );
};

export default Profile;
