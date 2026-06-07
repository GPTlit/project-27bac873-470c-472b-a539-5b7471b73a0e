import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BookStat {
  book_id: string;
  likes: number;
  recentLikes: number;
  avgRating: number;
  ratingCount: number;
}

export const useBookStats = () => {
  return useQuery({
    queryKey: ['book-stats'],
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, BookStat>> => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [likesRes, ratingsRes] = await Promise.all([
        supabase.from('book_likes').select('book_id, created_at'),
        supabase.from('book_ratings').select('book_id, rating'),
      ]);
      const map = new Map<string, BookStat>();
      const ensure = (id: string) => {
        if (!map.has(id))
          map.set(id, { book_id: id, likes: 0, recentLikes: 0, avgRating: 0, ratingCount: 0 });
        return map.get(id)!;
      };
      (likesRes.data || []).forEach((l: any) => {
        const s = ensure(l.book_id);
        s.likes += 1;
        if (l.created_at && l.created_at >= since) s.recentLikes += 1;
      });
      const ratingAgg = new Map<string, { sum: number; n: number }>();
      (ratingsRes.data || []).forEach((r: any) => {
        const cur = ratingAgg.get(r.book_id) || { sum: 0, n: 0 };
        cur.sum += r.rating;
        cur.n += 1;
        ratingAgg.set(r.book_id, cur);
      });
      ratingAgg.forEach((v, id) => {
        const s = ensure(id);
        s.avgRating = v.sum / v.n;
        s.ratingCount = v.n;
      });
      return map;
    },
  });
};