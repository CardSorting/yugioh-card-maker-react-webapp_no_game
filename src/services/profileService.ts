import { supabase } from '../supabaseClient';
import { Card, Profile, ProfileStats, Comment } from '../types/profile';

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      // Get all profile fields in a single query
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, updated_at, profile_image_path, bio')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        ...data,
        profile_image_path: data.profile_image_path || null,
        bio: data.bio || null
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  }

  static async createProfile(userId: string, username: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select('id, username, updated_at, profile_image_path, bio')
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from profile creation');
      }

      return {
        ...data,
        profile_image_path: data.profile_image_path || null,
        bio: data.bio || null
      };
    } catch (error) {
      console.error('Error in createProfile:', error);
      return null;
    }
  }

  static async updateProfile(profile: Partial<Profile>): Promise<Profile | null> {
    try {
      if (!profile.id) {
        throw new Error('Profile ID is required for update');
      }

      if (profile.username === '') {
        throw new Error('Username cannot be empty');
      }

      const updateData = Object.fromEntries(
        Object.entries(profile).filter(([_, value]) => value !== undefined)
      );

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select('id, username, updated_at, profile_image_path, bio')
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from profile update');
      }

      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }

  // Rest of the methods remain unchanged
  static async getUserCards(userId: string, currentUserId?: string): Promise<Card[]> {
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);

    if (cardsError) {
      console.error('Error fetching user cards:', cardsError);
      return [];
    }

    const cardIds = cards.map(card => card.id);
    const { data: likes } = await supabase
      .from('card_likes')
      .select('card_id')
      .in('card_id', cardIds);

    const { data: comments } = await supabase
      .from('card_comments')
      .select('card_id')
      .in('card_id', cardIds);

    let userLikes: Record<string, boolean> = {};
    if (currentUserId) {
      const { data: userLikesData } = await supabase
        .from('card_likes')
        .select('card_id')
        .eq('user_id', currentUserId)
        .in('card_id', cardIds);

      userLikes = (userLikesData || []).reduce((acc: Record<string, boolean>, like: { card_id: string }) => ({
        ...acc,
        [like.card_id]: true
      }), {});
    }

    const likesMap = (likes || []).reduce((acc: Record<string, number>, item: { card_id: string }) => ({
      ...acc,
      [item.card_id]: (acc[item.card_id] || 0) + 1
    }), {});

    const commentsMap = (comments || []).reduce((acc: Record<string, number>, item: { card_id: string }) => ({
      ...acc,
      [item.card_id]: (acc[item.card_id] || 0) + 1
    }), {});

    return cards.map(card => ({
      ...card,
      likes_count: likesMap[card.id] || 0,
      comments_count: commentsMap[card.id] || 0,
      isLiked: !!userLikes[card.id]
    }));
  }

  static async getProfileStats(userId: string, currentUserId?: string): Promise<ProfileStats> {
    const [cardsCount, followersCount, followingCount, isFollowing] = await Promise.all([
      supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .then(({ count }) => count || 0),
      
      supabase
        .from('user_follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', userId)
        .then(({ count }) => count || 0),
      
      supabase
        .from('user_follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', userId)
        .then(({ count }) => count || 0),
      
      currentUserId ? 
        supabase
          .from('user_follows')
          .select('*', { head: true })
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .then(({ data }) => !!data)
        : Promise.resolve(undefined)
    ]);

    return {
      cardsCount,
      followersCount,
      followingCount,
      isFollowing
    };
  }

  static async followUser(followerId: string, followingId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: followerId, following_id: followingId });

    if (error) {
      console.error('Error following user:', error);
      return false;
    }

    return true;
  }

  static async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }

    return true;
  }

  static async likeCard(userId: string, cardId: string): Promise<boolean> {
    const { error } = await supabase
      .from('card_likes')
      .insert({ user_id: userId, card_id: cardId });

    if (error) {
      console.error('Error liking card:', error);
      return false;
    }

    return true;
  }

  static async unlikeCard(userId: string, cardId: string): Promise<boolean> {
    const { error } = await supabase
      .from('card_likes')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId);

    if (error) {
      console.error('Error unliking card:', error);
      return false;
    }

    return true;
  }

  static async addComment(userId: string, cardId: string, content: string, parentCommentId: string | null = null): Promise<Comment | null> {
    const { data, error } = await supabase
      .from('card_comments')
      .insert({ user_id: userId, card_id: cardId, content, parent_comment_id: parentCommentId })
      .select('*, user:profiles!user_id(id, username, updated_at, profile_image_path, bio)')
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }

    return data;
  }

  static async getUserBookmarks(userId: string, currentUserId?: string): Promise<Card[]> {
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('card_bookmarks')
      .select('card_id')
      .eq('user_id', userId);

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
      return [];
    }

    const cardIds = bookmarks.map(bookmark => bookmark.card_id);
    if (cardIds.length === 0) return [];

    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .in('id', cardIds);

    if (cardsError) {
      console.error('Error fetching bookmarked cards:', cardsError);
      return [];
    }

    const { data: likes } = await supabase
      .from('card_likes')
      .select('card_id')
      .in('card_id', cardIds);

    const { data: comments } = await supabase
      .from('card_comments')
      .select('card_id')
      .in('card_id', cardIds);

    let userLikes: Record<string, boolean> = {};
    if (currentUserId) {
      const { data: userLikesData } = await supabase
        .from('card_likes')
        .select('card_id')
        .eq('user_id', currentUserId)
        .in('card_id', cardIds);

      userLikes = (userLikesData || []).reduce((acc: Record<string, boolean>, like: { card_id: string }) => ({
        ...acc,
        [like.card_id]: true
      }), {});
    }

    const likesMap = (likes || []).reduce((acc: Record<string, number>, item: { card_id: string }) => ({
      ...acc,
      [item.card_id]: (acc[item.card_id] || 0) + 1
    }), {});

    const commentsMap = (comments || []).reduce((acc: Record<string, number>, item: { card_id: string }) => ({
      ...acc,
      [item.card_id]: (acc[item.card_id] || 0) + 1
    }), {});

    return cards.map(card => ({
      ...card,
      likes_count: likesMap[card.id] || 0,
      comments_count: commentsMap[card.id] || 0,
      isLiked: !!userLikes[card.id]
    }));
  }

  static async getCardComments(cardId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('card_comments')
      .select('*, user:profiles!user_id(id, username, updated_at, profile_image_path, bio)')
      .eq('card_id', cardId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    return data || [];
  }

  static async getCommentReplies(commentId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('card_comments')
      .select('*, user:profiles!user_id(id, username, updated_at, profile_image_path, bio)')
      .eq('parent_comment_id', commentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comment replies:', error);
      return [];
    }

    return data || [];
  }
}
