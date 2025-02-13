import { useState, useEffect, useCallback } from 'react';
import { Profile, Card, ProfileStats } from '../types/profile';
import { ProfileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const profileId = userId || user?.id;

  // Group all useState declarations together at the top
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [bookmarkedCards, setBookmarkedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    cardsCount: 0,
    followersCount: 0,
    followingCount: 0,
    isFollowing: false
  });

  // Define all callbacks before using them
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile) {
      throw new Error('No profile found to update');
    }

    try {
      setError(null);
      const updatedProfile = await ProfileService.updateProfile({
        id: profile.id,
        ...updates,
        updated_at: new Date().toISOString()
      });
      
      // Since updateProfile now throws on error, if we get here it was successful
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [profile]);

  const followUser = useCallback(async () => {
    if (!user?.id || !profileId) return;
    
    await ProfileService.followUser(user.id, profileId);
    setStats(prev => ({
      ...prev,
      followersCount: prev.followersCount + 1,
      isFollowing: true
    }));
  }, [user?.id, profileId]);

  const unfollowUser = useCallback(async () => {
    if (!user?.id || !profileId) return;
    
    await ProfileService.unfollowUser(user.id, profileId);
    setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount - 1,
        isFollowing: false
      }));
  }, [user?.id, profileId]);

  const likeCard = useCallback(async (cardId: string) => {
    if (!user?.id) return;

    await ProfileService.likeCard(user.id, cardId);
    setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, likes_count: (card.likes_count || 0) + 1, isLiked: true }
          : card
      ));
  }, [user?.id]);

  const unlikeCard = useCallback(async (cardId: string) => {
    if (!user?.id) return;

    await ProfileService.unlikeCard(user.id, cardId);
    setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, likes_count: (card.likes_count || 0) - 1, isLiked: false }
          : card
      ));
  }, [user?.id]);

  const addComment = useCallback(async (cardId: string, content: string) => {
    if (!user?.id) return;

    const comment = await ProfileService.addComment(user.id, cardId, content);
    if (comment) {
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, comments_count: (card.comments_count || 0) + 1 }
          : card
      ));
    }
  }, [user?.id]);

  const loadProfile = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      const [profileData, userCards, bookmarks, profileStats] = await Promise.all([
        ProfileService.getProfile(profileId),
        ProfileService.getUserCards(profileId, user?.id),
        ProfileService.getUserBookmarks(profileId, user?.id),
        ProfileService.getProfileStats(profileId, user?.id)
      ]);
      
      if (!profileData && user) {
        // Create new profile if none exists and this is the current user
        const username = user.email?.split('@')[0] || 'user';
        const newProfile = await ProfileService.createProfile(user.id, username);
        if (newProfile) {
          setProfile(newProfile);
        }
      } else {
        setProfile(profileData);
      }

      setCards(userCards);
      setBookmarkedCards(bookmarks);
      setStats(profileStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [profileId, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
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
    addComment,
    isOwnProfile: user?.id === profileId
  };
};
