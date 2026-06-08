import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StoryComment {
  id: string;
  part_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
}

export const useStoryComments = (partId?: string) => {
  return useQuery({
    queryKey: ['story-comments', partId],
    queryFn: async () => {
      if (!partId) return [] as StoryComment[];
      const { data, error } = await supabase
        .from('story_comments').select('*').eq('part_id', partId).order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as StoryComment[];
    },
    enabled: !!partId,
  });
};

export const useAddStoryComment = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ partId, content, parentId }: { partId: string; content: string; parentId?: string | null }) => {
      if (!user) throw new Error('Auth required');
      const { error } = await supabase.from('story_comments').insert({
        part_id: partId, user_id: user.id, content, parent_id: parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['story-comments', v.partId] }),
  });
};

export const useDeleteStoryComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; partId: string }) => {
      const { error } = await supabase.from('story_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['story-comments', v.partId] }),
  });
};