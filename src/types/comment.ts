import { Profile } from "./profile";

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  card_id: string;
  parent_comment_id: string | null;
  created_at: string;
  username?: string;
  profile_image_path?: string;
  profile_updated_at?: string;
  likes_count?: number;
  is_liked_by_user?: boolean;
}

export interface CommentFormData {
  content: string;
  parentId: string | null;
}
