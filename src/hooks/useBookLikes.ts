import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBookLikes = (bookId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['book-likes', bookId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('book_likes')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId);
      
      if (error) throw error;

      let userLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from('book_likes')
          .select('id')
          .eq('book_id', bookId)
          .eq('user_id', user.id)
          .maybeSingle();
        userLiked = !!likeData;
      }

      return {
        count: count || 0,
        userLiked,
      };
    },
    enabled: !!bookId,
  });
};

export const useToggleBookLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ bookId, isLiked }: { bookId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      if (isLiked) {
        const { error } = await supabase
          .from('book_likes')
          .delete()
          .eq('book_id', bookId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('book_likes')
          .insert({ book_id: bookId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['book-likes', variables.bookId] });
    },
  });
};
