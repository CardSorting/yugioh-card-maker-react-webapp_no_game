export interface Profile {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
}

export interface ProfileStats {
  cardsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface Card {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  comments_count?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

import { Comment } from './comment';

export interface ProfileComment extends Omit<Comment, 'parent_comment_id'> {
  parent_comment_id: string | null;
  replies?: ProfileComment[];
}
