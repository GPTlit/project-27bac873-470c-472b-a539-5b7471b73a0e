import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromoBlock {
  id: string;
  title: string | null;
  subtitle: string | null;
  media_type: 'image' | 'video' | 'youtube' | 'books';
  media_url: string | null;
  youtube_url: string | null;
  link_url: string | null;
  link_label: string | null;
  book_ids: string[];
  thumb_size: 'small' | 'medium' | 'large';
  slot: number;
  enabled: boolean;
  sort_order: number;
}

export const usePromoBlocks = () => {
  return useQuery({
    queryKey: ['promo_blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_blocks')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PromoBlock[];
    },
    staleTime: 1000 * 60,
  });
};
