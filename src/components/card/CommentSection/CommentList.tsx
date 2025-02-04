import React, { useState } from 'react';
import { Comment } from '../../../types/comment';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Link } from 'react-router-dom';

interface CommentListProps {
  comments: Comment[];
  commentReplies: Record<string, Comment[]>;
  onAddComment: (content: string) => Promise<void>;
  onAddReply: (content: string, parentId: string) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
  onUnlikeComment: (commentId: string) => Promise<void>;
  replyingTo: string | null;
  onReplyClick: (commentId: string) => void;
  onCancelReply: () => void;
  isAuthenticated: boolean;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  commentReplies,
  onAddComment,
  onAddReply,
  onLikeComment,
  onUnlikeComment,
  replyingTo,
  onReplyClick,
  onCancelReply,
  isAuthenticated
}) => {
  const [error, setError] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});

  const handleAddComment = async (content: string) => {
    try {
      setError(null);
      await onAddComment(content);
    } catch (err) {
      setError('Failed to add comment. Please try again.');
      console.error('Error adding comment:', err);
    }
  };

  const handleAddReply = async (content: string, parentId: string) => {
    try {
      setError(null);
      await onAddReply(content, parentId);
    } catch (err) {
      setError('Failed to add reply. Please try again.');
      console.error('Error adding reply:', err);
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto border-t border-gray-100">
        {error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
            <p className="text-sm">No comments yet</p>
            {isAuthenticated ? (
              <p className="text-xs mt-1">Be the first to comment on this card</p>
            ) : (
              <Link to="/auth" className="text-xs mt-1 text-blue-500 hover:text-blue-600">
                Sign in to comment
              </Link>
            )}
          </div>
        ) : (
          <ul className="px-4 py-3 space-y-4">
            {comments.map((comment) => (
            <li key={comment.id}>
              <CommentItem 
                comment={comment} 
                onReply={onReplyClick}
                onLike={onLikeComment}
                onUnlike={onUnlikeComment}
                isAuthenticated={isAuthenticated}
              />

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <CommentForm
                  onSubmit={(content) => handleAddReply(content, comment.id)}
                  onCancel={onCancelReply}
                  isReply
                  autoFocus
                />
              )}

              {/* Replies */}
              {commentReplies[comment.id] && commentReplies[comment.id].length > 0 && (
                <div className="mt-1.5 ml-9 border-l border-gray-100 pl-4">
                  <button 
                    onClick={() => toggleReplies(comment.id)}
                    className="text-xs text-gray-500 hover:text-gray-900 font-medium mb-2"
                  >
                    {showReplies[comment.id] ? 'Hide' : 'View'} {commentReplies[comment.id].length} {commentReplies[comment.id].length === 1 ? 'reply' : 'replies'}
                  </button>
                  {showReplies[comment.id] && (
                    <ul className="space-y-3">
                      {commentReplies[comment.id].map(reply => (
                        <li key={reply.id}>
                          <CommentItem 
                            comment={reply} 
                            onReply={onReplyClick}
                            onLike={onLikeComment}
                            onUnlike={onUnlikeComment}
                            isReply
                            isAuthenticated={isAuthenticated}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="border-t mt-auto bg-white">
        <div className="px-4 py-3">
          {isAuthenticated ? (
            <CommentForm onSubmit={handleAddComment} />
          ) : (
            <Link 
              to="/auth" 
              className="block text-center text-sm text-blue-500 hover:text-blue-600 py-2 border border-blue-500 rounded-md"
            >
              Sign in to leave a comment
            </Link>
          )}
        </div>
      </div>
    </>
  );
};
