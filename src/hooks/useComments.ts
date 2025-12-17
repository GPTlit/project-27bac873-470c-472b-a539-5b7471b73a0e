import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Comment {
  id: string;
  book_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  likes_count?: number;
  user_liked?: boolean;
  replies?: Comment[];
}

export const useComments = (bookId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comments', bookId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get like counts for each comment
      const commentsWithLikes = await Promise.all(
        (comments || []).map(async (comment) => {
          const { count } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          let userLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userLiked = !!likeData;
          }

          return {
            ...comment,
            likes_count: count || 0,
            user_liked: userLiked,
          };
        })
      );

      // Organize into threaded structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      commentsWithLikes.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      commentsWithLikes.forEach((comment) => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          commentMap.get(comment.parent_id)!.replies!.push(commentWithReplies);
        } else if (!comment.parent_id) {
          rootComments.push(commentWithReplies);
        }
      });

      // Sort replies by date (oldest first for readability)
      rootComments.forEach((comment) => {
        comment.replies?.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      return rootComments as Comment[];
    },
    enabled: !!bookId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ bookId, content, parentId }: { bookId: string; content: string; parentId?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('comments')
        .insert({ 
          book_id: bookId, 
          user_id: user.id, 
          content,
          parent_id: parentId || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.bookId] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, bookId }: { commentId: string; bookId: string }) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.bookId] });
    },
  });
};

export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, bookId, isLiked }: { commentId: string; bookId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      if (isLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.bookId] });
    },
  });
};
