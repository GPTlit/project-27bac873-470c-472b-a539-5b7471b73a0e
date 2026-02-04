import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useComments, useAddComment, useDeleteComment, useToggleCommentLike, Comment } from '@/hooks/useComments';
import { useFeature } from '@/hooks/useAppConfig';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, Heart, Loader2, Send, Reply, X, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS, fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CommentsSectionProps {
  bookId: string;
}

interface CommentItemProps {
  comment: Comment;
  bookId: string;
  user: any;
  commentLikesEnabled: boolean;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
  onDelete: (commentId: string) => void;
  onToggleLike: (commentId: string, isLiked: boolean) => void;
  isDeleting: boolean;
  depth?: number;
}

const CommentItem = ({
  comment,
  bookId,
  user,
  commentLikesEnabled,
  onReply,
  replyingTo,
  onCancelReply,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  isSubmitting,
  onDelete,
  onToggleLike,
  isDeleting,
  depth = 0,
}: CommentItemProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const isReplyingToThis = replyingTo === comment.id;
  const maxDepth = 2;
  const isOwner = user && user.id === comment.user_id;

  const getLocale = () => {
    switch (language) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    
    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent })
        .eq('id', comment.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['comments', bookId] });
      setIsEditing(false);
      toast({
        title: t('success'),
        description: 'تم تحديث التعليق',
      });
    } catch {
      toast({
        title: t('error'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className={`space-y-3 ${depth > 0 ? 'mr-6 pr-4 border-r-2 border-primary/20' : ''}`}>
      <div className="p-4 bg-card border rounded-lg space-y-3">
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
                locale: getLocale()
              })}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {user && depth < maxDepth && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="gap-1 text-xs"
              >
                <Reply className="h-3 w-3" />
                {t('reply')}
              </Button>
            )}

            {commentLikesEnabled && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleLike(comment.id, comment.user_liked || false)}
                className="gap-1"
                disabled={!user}
              >
                <Heart
                  className={`h-4 w-4 ${comment.user_liked ? 'fill-red-500 text-red-500' : ''}`}
                />
                {comment.likes_count || 0}
              </Button>
            )}

            {isOwner && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setEditContent(comment.content);
                    setIsEditing(true);
                  }}>
                    <Pencil className="h-4 w-4 ml-2" />
                    {t('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    {t('delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || isSavingEdit}
              >
                {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-foreground">{comment.content}</p>
        )}

        {/* Reply form */}
        {isReplyingToThis && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('reply')}</span>
              <Button variant="ghost" size="sm" onClick={onCancelReply}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={replyContent}
              onChange={(e) => onReplyContentChange(e.target.value)}
              placeholder={t('writeComment')}
              className="min-h-[80px]"
            />
            <Button
              onClick={onSubmitReply}
              disabled={!replyContent.trim() || isSubmitting}
              size="sm"
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t('sendComment')}
            </Button>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              bookId={bookId}
              user={user}
              commentLikesEnabled={commentLikesEnabled}
              onReply={onReply}
              replyingTo={replyingTo}
              onCancelReply={onCancelReply}
              replyContent={replyContent}
              onReplyContentChange={onReplyContentChange}
              onSubmitReply={onSubmitReply}
              isSubmitting={isSubmitting}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
              isDeleting={isDeleting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentsSection = ({ bookId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
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

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyingTo) return;
    
    try {
      await addComment.mutateAsync({ bookId, content: replyContent, parentId: replyingTo });
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add reply:', error);
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

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent('');
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold">{t('comments')}</h3>
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
            placeholder={t('writeComment')}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || addComment.isPending}
            className="gap-2"
          >
            {addComment.isPending && !replyingTo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t('sendComment')}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
          {t('loginToComment')}
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
            <CommentItem
              key={comment.id}
              comment={comment}
              bookId={bookId}
              user={user}
              commentLikesEnabled={commentLikesEnabled}
              onReply={handleReply}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              onSubmitReply={handleSubmitReply}
              isSubmitting={addComment.isPending}
              onDelete={handleDelete}
              onToggleLike={handleToggleLike}
              isDeleting={deleteComment.isPending}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          {t('noComments')}
        </p>
      )}
    </div>
  );
};
