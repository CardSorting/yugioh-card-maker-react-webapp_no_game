import React, { useState } from 'react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isReply?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  isReply = false,
  onCancel,
  autoFocus = false
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`flex items-center ${isReply ? 'mt-4 ml-8' : ''}`}
    >
      
      <div className={`flex flex-1 items-center ${isReply ? 'gap-3' : ''}`}>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isReply ? "Reply to comment..." : "Add a comment..."}
            className={`w-full text-sm resize-none ${
              isReply 
                ? 'px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500' 
                : 'border-none focus:ring-0 focus:outline-none h-[18px] py-0 placeholder-gray-500'
            }`}
            rows={1}
            required
            autoFocus={autoFocus}
          />
        </div>

        {isReply ? (
          <div className="flex gap-2">
            <button
              type="submit"
              className="text-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={!content.trim() || isSubmitting}
            >
              Post Reply
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-600 font-semibold hover:text-gray-800 transition-colors text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <button
            type="submit"
            className={`text-blue-500 hover:text-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm ${content.trim() ? 'opacity-100' : 'opacity-50'}`}
            disabled={!content.trim() || isSubmitting}
          >
            Post
          </button>
        )}
      </div>
    </form>
  );
};
