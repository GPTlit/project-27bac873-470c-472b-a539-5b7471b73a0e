import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  book_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  enabled: boolean;
}

export const useHeroBanners = () => {
  return useQuery({
    queryKey: ['hero_banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeroBanner[];
    },
  });
};

export const useAllHeroBanners = () => {
  return useQuery({
    queryKey: ['hero_banners', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeroBanner[];
    },
  });
};