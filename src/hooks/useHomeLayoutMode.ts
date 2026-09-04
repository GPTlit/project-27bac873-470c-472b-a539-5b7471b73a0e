import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HomeLayoutMode = 'classic' | 'ads_first';

const KEY = 'home_layout_mode';

export const useHomeLayoutMode = () => {
  return useQuery({
    queryKey: ['home-layout-mode'],
    queryFn: async (): Promise<HomeLayoutMode> => {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', KEY)
        .maybeSingle();
      const v = data?.value as any;
      const mode = typeof v === 'string' ? v : v?.mode;
      return mode === 'ads_first' ? 'ads_first' : 'classic';
    },
    staleTime: 1000 * 60,
  });
};

export const useSetHomeLayoutMode = () => {
  const qc = useQueryClient();
  return async (mode: HomeLayoutMode) => {
    const { error } = await supabase.from('app_config').upsert(
      { key: KEY, value: mode as any, description: 'Home page layout mode' },
      { onConflict: 'key' },
    );
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ['home-layout-mode'] });
  };
};
