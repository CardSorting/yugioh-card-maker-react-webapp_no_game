import { useState, useEffect, useCallback } from 'react';
import { Profile, Card, ProfileStats } from '../types/profile';
import { ProfileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';

export const useProfile = (userId?: string) => {
  const { session } = useAuth();
  const profileId = userId || session?.user?.id;

  // Group all useState declarations together at the top
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [bookmarkedCards, setBookmarkedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    cardsCount: 0,
    followersCount: 0,
    followingCount: 0
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
    if (!session?.user?.id || !profileId) return;
    
    const success = await ProfileService.followUser(session.user.id, profileId);
    if (success) {
      setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount + 1,
        isFollowing: true
      }));
    }
  }, [session?.user?.id, profileId]);

  const unfollowUser = useCallback(async () => {
    if (!session?.user?.id || !profileId) return;
    
    const success = await ProfileService.unfollowUser(session.user.id, profileId);
    if (success) {
      setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount - 1,
        isFollowing: false
      }));
    }
  }, [session?.user?.id, profileId]);

  const likeCard = useCallback(async (cardId: string) => {
    if (!session?.user?.id) return;

    const success = await ProfileService.likeCard(session.user.id, cardId);
    if (success) {
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, likes_count: card.likes_count + 1, isLiked: true }
          : card
      ));
    }
  }, [session?.user?.id]);

  const unlikeCard = useCallback(async (cardId: string) => {
    if (!session?.user?.id) return;

    const success = await ProfileService.unlikeCard(session.user.id, cardId);
    if (success) {
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, likes_count: card.likes_count - 1, isLiked: false }
          : card
      ));
    }
  }, [session?.user?.id]);

  const addComment = useCallback(async (cardId: string, content: string) => {
    if (!session?.user?.id) return;

    const comment = await ProfileService.addComment(session.user.id, cardId, content);
    if (comment) {
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, comments_count: card.comments_count + 1 }
          : card
      ));
    }
  }, [session?.user?.id]);

  const loadProfile = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      const [profileData, userCards, bookmarks, profileStats] = await Promise.all([
        ProfileService.getProfile(profileId),
        ProfileService.getUserCards(profileId, session?.user?.id),
        ProfileService.getUserBookmarks(profileId, session?.user?.id),
        ProfileService.getProfileStats(profileId, session?.user?.id)
      ]);
      
      if (!profileData && session?.user) {
        // Create new profile if none exists and this is the current user
        const username = session.user.email?.split('@')[0] || 'user';
        const newProfile = await ProfileService.createProfile(session.user.id, username);
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
  }, [profileId, session]);

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
    isOwnProfile: session?.user?.id === profileId
  };
};
