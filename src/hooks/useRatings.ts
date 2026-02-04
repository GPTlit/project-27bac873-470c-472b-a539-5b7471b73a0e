import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Book Ratings
export const useBookRating = (bookId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['book-rating', bookId],
    queryFn: async () => {
      // Get average rating
      const { data: ratings, error } = await supabase
        .from('book_ratings')
        .select('rating')
        .eq('book_id', bookId);

      if (error) throw error;

      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      // Get user's rating if logged in
      let userRating = 0;
      if (user) {
        const { data: userRatingData } = await supabase
          .from('book_ratings')
          .select('rating')
          .eq('book_id', bookId)
          .eq('user_id', user.id)
          .maybeSingle();
        userRating = userRatingData?.rating || 0;
      }

      return {
        averageRating: avgRating,
        totalRatings: ratings.length,
        userRating,
      };
    },
    enabled: !!bookId,
  });
};

export const useRateBook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ bookId, rating }: { bookId: string; rating: number }) => {
      if (!user) throw new Error('Must be logged in');

      const { data: existing } = await supabase
        .from('book_ratings')
        .select('id')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('book_ratings')
          .update({ rating })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('book_ratings')
          .insert({ book_id: bookId, user_id: user.id, rating });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['book-rating', variables.bookId] });
    },
  });
};

// Author Ratings
export const useAuthorRating = (authorName: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['author-rating', authorName],
    queryFn: async () => {
      const { data: ratings, error } = await supabase
        .from('author_ratings')
        .select('rating')
        .eq('author_name', authorName);

      if (error) throw error;

      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      let userRating = 0;
      if (user) {
        const { data: userRatingData } = await supabase
          .from('author_ratings')
          .select('rating')
          .eq('author_name', authorName)
          .eq('user_id', user.id)
          .maybeSingle();
        userRating = userRatingData?.rating || 0;
      }

      return {
        averageRating: avgRating,
        totalRatings: ratings.length,
        userRating,
      };
    },
    enabled: !!authorName,
  });
};

export const useRateAuthor = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ authorName, rating }: { authorName: string; rating: number }) => {
      if (!user) throw new Error('Must be logged in');

      const { data: existing } = await supabase
        .from('author_ratings')
        .select('id')
        .eq('author_name', authorName)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('author_ratings')
          .update({ rating })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('author_ratings')
          .insert({ author_name: authorName, user_id: user.id, rating });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['author-rating', variables.authorName] });
    },
  });
};
