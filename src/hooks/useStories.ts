import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Story {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  language: string | null;
  mature: boolean;
  copyright: string | null;
  status: 'draft' | 'published';
  tags: string[];
  category: string | null;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryPart {
  id: string;
  story_id: string;
  order_index: number;
  title: string;
  content: string;
  media: Array<{ type: 'image' | 'youtube'; url: string }>;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export const usePublishedStories = (opts?: { authorIds?: string[]; category?: string; search?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['stories', 'published', opts],
    queryFn: async () => {
      let q = supabase.from('stories').select('*').eq('status', 'published').order('published_at', { ascending: false });
      if (opts?.authorIds && opts.authorIds.length) q = q.in('author_id', opts.authorIds);
      if (opts?.category) q = q.eq('category', opts.category);
      if (opts?.search) q = q.ilike('title', `%${opts.search}%`);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Story[];
    },
  });
};

export const useMyStories = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stories', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return [] as Story[];
      const { data, error } = await supabase
        .from('stories').select('*').eq('author_id', user.id).order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Story[];
    },
    enabled: !!user,
  });
};

export const useStory = (id?: string) => {
  return useQuery({
    queryKey: ['story', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('stories').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as Story | null;
    },
    enabled: !!id,
  });
};

export const useStoryParts = (storyId?: string) => {
  return useQuery({
    queryKey: ['story-parts', storyId],
    queryFn: async () => {
      if (!storyId) return [] as StoryPart[];
      const { data, error } = await supabase
        .from('story_parts').select('*').eq('story_id', storyId).order('order_index', { ascending: true });
      if (error) throw error;
      return (data ?? []) as StoryPart[];
    },
    enabled: !!storyId,
  });
};

export const useStoryAuthors = (authorIds: string[]) => {
  return useQuery({
    queryKey: ['story-authors', authorIds.sort().join(',')],
    queryFn: async () => {
      if (!authorIds.length) return [] as any[];
      const { data, error } = await supabase
        .from('user_profiles').select('user_id, username, display_name, avatar_url')
        .in('user_id', authorIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: authorIds.length > 0,
  });
};

export const useCreateStory = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Story>) => {
      if (!user) throw new Error('Auth required');
      const { data, error } = await supabase.from('stories').insert({
        author_id: user.id,
        title: input.title || 'قصة جديدة',
        description: input.description ?? null,
        cover_url: input.cover_url ?? null,
        language: input.language ?? 'ar',
        mature: input.mature ?? false,
        copyright: input.copyright ?? null,
        tags: input.tags ?? [],
        category: input.category ?? null,
      }).select('*').single();
      if (error) throw error;
      return data as Story;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
};

export const useUpdateStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Story> & { id: string }) => {
      const { data, error } = await supabase.from('stories').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return data as Story;
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['story', s.id] });
    },
  });
};

export const useDeleteStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
};

export const useCreatePart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyId, orderIndex, title }: { storyId: string; orderIndex: number; title?: string }) => {
      const { data, error } = await supabase.from('story_parts').insert({
        story_id: storyId, order_index: orderIndex, title: title || 'الجزء الجديد', content: '', media: [],
      }).select('*').single();
      if (error) throw error;
      return data as StoryPart;
    },
    onSuccess: (p) => qc.invalidateQueries({ queryKey: ['story-parts', p.story_id] }),
  });
};

export const useUpdatePart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<StoryPart> & { id: string }) => {
      const { data, error } = await supabase.from('story_parts').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return data as StoryPart;
    },
    onSuccess: (p) => qc.invalidateQueries({ queryKey: ['story-parts', p.story_id] }),
  });
};

export const useDeletePart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storyId }: { id: string; storyId: string }) => {
      const { error } = await supabase.from('story_parts').delete().eq('id', id);
      if (error) throw error;
      return { storyId };
    },
    onSuccess: ({ storyId }) => qc.invalidateQueries({ queryKey: ['story-parts', storyId] }),
  });
};

export const uploadStoryMedia = async (file: File, userId: string, kind: 'cover' | 'inline' = 'cover') => {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `stories/${userId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
};