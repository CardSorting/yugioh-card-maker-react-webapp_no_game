import { useState, useEffect } from 'react';
import { Comment } from '../../types/comment';
import { CommentService } from '../../services/card/commentService';

interface UseCardCommentsReturn {
  comments: Comment[];
  commentReplies: Record<string, Comment[]>;
  loading: boolean;
  error: string | null;
  addComment: (userId: string, content: string, parentId: string | null) => Promise<void>;
  refreshComments: () => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
}

export const useCardComments = (cardId: string): UseCardCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentReplies, setCommentReplies] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = async () => {
    if (!cardId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch parent comments
      const parentComments = await CommentService.getCardComments(cardId);
      
      if (parentComments.length > 0) {
        setComments(parentComments);

        // Fetch replies for each parent comment
        const repliesMap: Record<string, Comment[]> = {};
        for (const comment of parentComments) {
          const replies = await CommentService.getCommentReplies(comment.id);
          if (replies.length > 0) {
            repliesMap[comment.id] = replies;
          }
        }
        setCommentReplies(repliesMap);
      } else {
        setComments([]);
        setCommentReplies({});
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading comments';
      console.error('Error loading comments:', errorMessage);
      setError(errorMessage);
      setComments([]);
      setCommentReplies({});
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (userId: string, content: string, parentId: string | null = null) => {
    try {
      const comment = await CommentService.addComment(userId, cardId, content, parentId);
      
      if (!comment) {
        throw new Error('Failed to add comment');
      }

      if (parentId) {
        // Add reply to existing comment
        setCommentReplies(prev => {
          const existingReplies = prev[parentId] || [];
          return {
            ...prev,
            [parentId]: [...existingReplies, comment]
          };
        });
      } else {
        // Add new parent comment
        setComments(prev => [comment, ...prev]);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadComments();
  }, [cardId]);

  const likeComment = async (commentId: string) => {
    try {
      await CommentService.likeComment(commentId);
      
      // Update parent comments
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes_count: (comment.likes_count ?? 0) + 1, is_liked_by_user: true }
          : comment
      ));

      // Update replies
      setCommentReplies(prev => {
        const newReplies = { ...prev };
        Object.keys(newReplies).forEach(parentId => {
          newReplies[parentId] = newReplies[parentId].map(reply =>
            reply.id === commentId
              ? { ...reply, likes_count: (reply.likes_count ?? 0) + 1, is_liked_by_user: true }
              : reply
          );
        });
        return newReplies;
      });
    } catch (err) {
      console.error('Error liking comment:', err);
      throw err;
    }
  };

  const unlikeComment = async (commentId: string) => {
    try {
      await CommentService.unlikeComment(commentId);
      
      // Update parent comments
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes_count: (comment.likes_count ?? 1) - 1, is_liked_by_user: false }
          : comment
      ));

      // Update replies
      setCommentReplies(prev => {
        const newReplies = { ...prev };
        Object.keys(newReplies).forEach(parentId => {
          newReplies[parentId] = newReplies[parentId].map(reply =>
            reply.id === commentId
              ? { ...reply, likes_count: (reply.likes_count ?? 1) - 1, is_liked_by_user: false }
              : reply
          );
        });
        return newReplies;
      });
    } catch (err) {
      console.error('Error unliking comment:', err);
      throw err;
    }
  };

  return {
    comments,
    commentReplies,
    loading,
    error,
    addComment,
    refreshComments: loadComments,
    likeComment,
    unlikeComment
  };
};
