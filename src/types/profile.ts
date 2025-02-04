export interface Profile {
  id: string;
  username: string;
  updated_at: string;
  profile_image_path?: string | null;
  bio?: string | null;
}

export interface ProfileStats {
  cardsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface Card {
  id: string;
  card_title: string;
  card_image_path: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  isLiked?: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  card_id: string;
  created_at: string;
  user?: Profile;
  parent_comment_id: string | null;
  replies?: Comment[];
}
