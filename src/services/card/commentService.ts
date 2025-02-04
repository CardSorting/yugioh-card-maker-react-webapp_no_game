import { supabase } from '../../supabaseClient';
import { Comment, CommentFormData } from '../../types/comment';

export class CommentService {
  static async likeComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('comment_likes')
        .insert([{ 
          comment_id: commentId,
          user_id: user.id
        }]);

      if (error) throw error;
    } catch (error) {
      console.error("Error in likeComment:", error);
      throw error;
    }
  }

  static async unlikeComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error in unlikeComment:", error);
      throw error;
    }
  }

  static async getCardComments(cardId: string): Promise<Comment[]> {
    try {
      // First try to get from comment_details view
      let { data, error } = await supabase
        .from('comment_details')
        .select('*')
        .eq('card_id', cardId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching from comment_details view", error);
        
        // Fallback to direct table query with joins
        const { data: directData, error: directError } = await supabase
          .from('card_comments')
          .select(`
            *,
            user:profiles!user_id (
              id,
              username,
              updated_at,
              profile_image_path,
              bio
            )
          `)
          .eq('card_id', cardId)
          .is('parent_comment_id', null)
          .order('created_at', { ascending: false });

        if (directError) {
          console.error("Error fetching from card_comments table", directError);
          return [];
        }

        data = directData;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getCardComments:", error);
      return [];
    }
  }

  static async getCommentReplies(commentId: string): Promise<Comment[]> {
    try {
      // First try to get from comment_details view
      let { data, error } = await supabase
        .from('comment_details')
        .select('*')
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching from comment_details view", error);
        
        // Fallback to direct table query with joins
        const { data: directData, error: directError } = await supabase
          .from('card_comments')
          .select(`
            *,
            user:profiles!user_id (
              id,
              username,
              updated_at,
              profile_image_path,
              bio
            )
          `)
          .eq('parent_comment_id', commentId)
          .order('created_at', { ascending: true });

        if (directError) {
          console.error("Error fetching from card_comments table", directError);
          return [];
        }

        data = directData;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getCommentReplies:", error);
      return [];
    }
  }

  static async addComment(
    userId: string,
    cardId: string,
    content: string,
    parentId: string | null = null
  ): Promise<Comment | null> {
    try {
      // Insert the comment
      const { data: newComment, error: insertError } = await supabase
        .from('card_comments')
        .insert([
          {
            user_id: userId,
            card_id: cardId,
            content,
            parent_comment_id: parentId
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting comment", insertError);
        return null;
      }

      // Fetch the comment with user details
      const { data: commentWithDetails, error: detailsError } = await supabase
        .from('card_comments')
        .select(`
          *,
          user:profiles!user_id (
            id,
            username,
            updated_at,
            profile_image_path,
            bio
          )
        `)
        .eq('id', newComment.id)
        .single();

      if (detailsError) {
        console.error("Error fetching comment details", detailsError);
        return null;
      }

      return commentWithDetails;
    } catch (error) {
      console.error("Error in addComment:", error);
      return null;
    }
  }

  static async deleteComment(commentId: string): Promise<void> {
    try {
      // Delete comment likes first
      const { error: likesError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId);

      if (likesError) {
        console.error("Error deleting comment likes", likesError);
        throw likesError;
      }

      // Delete the comment
      const { error } = await supabase
        .from('card_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error("Error in deleteComment:", error);
      throw error;
    }
  }
}
