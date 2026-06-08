import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useFollowers = (authorId?: string) => {
  return useQuery({
    queryKey: ['followers', authorId],
    queryFn: async () => {
      if (!authorId) return { count: 0, ids: [] as string[] };
      const { data, error, count } = await supabase
        .from('story_follows').select('follower_id', { count: 'exact' }).eq('author_id', authorId);
      if (error) throw error;
      return { count: count ?? 0, ids: (data ?? []).map((r: any) => r.follower_id) };
    },
    enabled: !!authorId,
  });
};

export const useFollowing = (followerId?: string) => {
  return useQuery({
    queryKey: ['following', followerId],
    queryFn: async () => {
      if (!followerId) return [] as string[];
      const { data, error } = await supabase.from('story_follows').select('author_id').eq('follower_id', followerId);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.author_id) as string[];
    },
    enabled: !!followerId,
  });
};

export const useIsFollowing = (authorId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-following', user?.id, authorId],
    queryFn: async () => {
      if (!user || !authorId) return false;
      const { data, error } = await supabase
        .from('story_follows').select('id').eq('follower_id', user.id).eq('author_id', authorId).maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!authorId,
  });
};

export const useToggleFollow = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ authorId, isFollowing }: { authorId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Auth required');
      if (isFollowing) {
        const { error } = await supabase.from('story_follows').delete().eq('follower_id', user.id).eq('author_id', authorId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('story_follows').insert({ follower_id: user.id, author_id: authorId });
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['is-following', user?.id, vars.authorId] });
      qc.invalidateQueries({ queryKey: ['followers', vars.authorId] });
      qc.invalidateQueries({ queryKey: ['following', user?.id] });
    },
  });
};