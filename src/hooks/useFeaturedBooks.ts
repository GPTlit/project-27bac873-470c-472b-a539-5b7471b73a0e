import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const KEY = 'featured_books';

export const useFeaturedBookIds = () => {
  return useQuery({
    queryKey: ['app_config', KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', KEY)
        .maybeSingle();
      if (error) throw error;
      const v: any = data?.value;
      const ids: string[] = Array.isArray(v?.ids) ? v.ids : [];
      return ids;
    },
  });
};

export const useSetFeaturedBookIds = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: existing } = await supabase
        .from('app_config')
        .select('id')
        .eq('key', KEY)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await supabase
          .from('app_config')
          .update({ value: { ids } })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_config')
          .insert({ key: KEY, value: { ids }, description: 'Admin-curated featured book IDs' });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_config', KEY] }),
  });
};
