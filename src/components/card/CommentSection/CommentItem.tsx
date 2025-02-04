import React from 'react';
import { Link } from 'react-router-dom';
import { Comment } from '../../../types/comment';

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string) => void;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
  isReply?: boolean;
  isAuthenticated: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onUnlike,
  isReply = false,
  isAuthenticated
}) => {
  return (
    <div className={`group ${isReply ? 'mt-1' : ''}`}>
      <div className="flex gap-3">
        <div className={`${isReply ? 'h-6 w-6' : 'h-7 w-7'} rounded-full bg-gray-100 ring-[1.5px] ring-gray-100 ring-offset-1 flex-shrink-0 overflow-hidden`}>
          {comment.profile_image_path ? (
            <img
              src={comment.profile_image_path}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <svg 
                className={`${isReply ? 'w-4 h-4' : 'w-6 h-6'} text-gray-600`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start">
            <Link
              to={`/profile/${comment.user_id}`}
              className={`font-semibold hover:text-gray-500 transition-colors mr-1.5 ${isReply ? 'text-[13px]' : 'text-[14px]'}`}
            >
              {comment.username}
            </Link>
            <p className={`text-gray-900 flex-1 break-words ${isReply ? 'text-[13px] leading-[18px]' : 'text-[14px] leading-[18px]'}`}>
              {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-gray-500 ${isReply ? 'text-[10px]' : 'text-[11px]'}`}>
              {new Date(comment.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => (comment.is_liked_by_user ?? false) ? onUnlike(comment.id) : onLike(comment.id)}
                  className={`flex items-center gap-1 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                    (comment.is_liked_by_user ?? false) ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                <svg
                  className={`w-3.5 h-3.5 ${(comment.is_liked_by_user ?? false) ? 'fill-current' : 'stroke-current fill-none'}`}
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{comment.likes_count ?? 0}</span>
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-1 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-900"
                >
                  <svg
                    className="w-3.5 h-3.5 stroke-current fill-none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{comment.likes_count ?? 0}</span>
                </Link>
              )}
              {!isReply && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-[12px] font-medium text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-900"
                >
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
