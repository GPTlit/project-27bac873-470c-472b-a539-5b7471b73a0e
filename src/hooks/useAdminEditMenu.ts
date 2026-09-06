import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const KEY = 'admin_book_edit_menu';

/** Whether the admin 3-dot edit menu is visible on book cards. */
export const useAdminEditMenu = () => {
  return useQuery({
    queryKey: ['admin-book-edit-menu'],
    queryFn: async (): Promise<boolean> => {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', KEY)
        .maybeSingle();
      const v = data?.value as any;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v === 'true';
      return v?.enabled === true;
    },
    staleTime: 1000 * 30,
  });
};

export const useSetAdminEditMenu = () => {
  const qc = useQueryClient();
  return async (enabled: boolean) => {
    const { error } = await supabase.from('app_config').upsert(
      { key: KEY, value: enabled as any, description: 'Show admin edit menu on book cards' },
      { onConflict: 'key' },
    );
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ['admin-book-edit-menu'] });
  };
};
