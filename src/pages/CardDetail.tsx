import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCardDetail } from '../hooks/card/useCardDetail';
import { useCardComments } from '../hooks/card/useCardComments';
import { useCardActions } from '../hooks/card/useCardActions';
import {
  CardImage,
  CardHeader,
  CardActions,
  CardInfo,
  CommentList
} from '../components/card';
import { DBCard } from '../types/card';

export default function CardDetail() {
  const { cardId } = useParams();
  const { user } = useAuth();
  const { card, loading, error, setCard } = useCardDetail(cardId || '');
  const {
    comments,
    commentReplies,
    loading: commentsLoading,
    addComment,
    likeComment,
    unlikeComment
  } = useCardComments(cardId || '');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

  const { handleLikeToggle, handleBookmarkToggle, loading: actionsLoading } = useCardActions(
    card as DBCard,
    user?.id,
    setCard
  );

  if (loading || commentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Card not found'}
          </h2>
          <Link to="/" className="text-blue-500 hover:text-blue-600">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const handleAddComment = async (content: string) => {
    if (!user?.id) return;
    await addComment(user.id, content, null);
    // Update card comments count
    setCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        comments_count: prev.comments_count + 1
      };
    });
  };

  const handleAddReply = async (content: string, parentId: string) => {
    if (!user?.id) return;
    await addComment(user.id, content, parentId);
    setReplyingToCommentId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-[935px] mx-auto bg-white rounded-sm shadow-sm">
        <div className="lg:grid lg:grid-cols-[600px,335px] lg:gap-0">
          {/* Left Column - Card Image */}
          <CardImage card={card as DBCard} />

          {/* Right Column - Info and Comments */}
          <div className="flex flex-col h-[600px] bg-white border-t lg:border-t-0 border-gray-200">
            <CardHeader card={card as DBCard} />
            <div className="p-3.5">
              <CardActions
                card={card as DBCard}
                onLikeToggle={handleLikeToggle}
                onBookmarkToggle={handleBookmarkToggle}
                disabled={actionsLoading}
              />
              <CardInfo card={card as DBCard} />
            </div>

            <CommentList
              comments={comments}
              commentReplies={commentReplies}
              onAddComment={handleAddComment}
              onAddReply={handleAddReply}
              onLikeComment={async (commentId) => {
                if (!user) {
                  // Redirect to auth page if not logged in
                  window.location.href = '/auth';
                  return;
                }
                await likeComment(commentId);
              }}
              onUnlikeComment={async (commentId) => {
                if (!user) {
                  // Redirect to auth page if not logged in
                  window.location.href = '/auth';
                  return;
                }
                await unlikeComment(commentId);
              }}
              replyingTo={replyingToCommentId}
              onReplyClick={setReplyingToCommentId}
              onCancelReply={() => setReplyingToCommentId(null)}
              isAuthenticated={!!user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
