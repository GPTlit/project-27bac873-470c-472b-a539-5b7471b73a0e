import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useComments, useAddComment, useDeleteComment, useToggleCommentLike } from '@/hooks/useComments';
import { useFeature } from '@/hooks/useAppConfig';
import { MessageSquare, Heart, Trash2, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CommentsSectionProps {
  bookId: string;
}

export const CommentsSection = ({ bookId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  
  const commentsEnabled = useFeature('comments');
  const commentLikesEnabled = useFeature('comment_likes');

  const { data: comments, isLoading } = useComments(bookId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const toggleLike = useToggleCommentLike();

  if (!commentsEnabled) return null;

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    try {
      await addComment.mutateAsync({ bookId, content: newComment });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId, bookId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleToggleLike = async (commentId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      await toggleLike.mutateAsync({ commentId, bookId, isLiked });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold">التعليقات</h3>
        {comments && comments.length > 0 && (
          <span className="text-sm text-muted-foreground">({comments.length})</span>
        )}
      </div>

      {/* Add comment form */}
      {user ? (
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="اكتب تعليقك هنا..."
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || addComment.isPending}
            className="gap-2"
          >
            {addComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            إرسال التعليق
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
          سجل دخولك لإضافة تعليق
        </p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-card border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {comment.user_id.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { 
                      addSuffix: true, 
                      locale: ar 
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {commentLikesEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleLike(comment.id, comment.user_liked || false)}
                      className="gap-1"
                      disabled={!user}
                    >
                      <Heart
                        className={`h-4 w-4 ${comment.user_liked ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {comment.likes_count || 0}
                    </Button>
                  )}

                  {user && user.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteComment.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          لا توجد تعليقات بعد. كن أول من يعلق!
        </p>
      )}
    </div>
  );
};
