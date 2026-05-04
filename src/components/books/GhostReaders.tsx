import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Highlighter, TrendingUp } from 'lucide-react';

interface Props { bookId: string }

export const GhostReaders = ({ bookId }: Props) => {
  const [count, setCount] = useState(0);
  const [recentHighlight, setRecentHighlight] = useState<{ text: string; minutesAgo: number } | null>(null);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: c } = await supabase
        .from('reading_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .gte('last_seen_at', cutoff);
      if (mounted) setCount(c || 0);

      const { data: hl } = await supabase
        .from('book_highlights')
        .select('text, created_at')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mounted && hl) {
        const mins = Math.max(1, Math.round((Date.now() - new Date(hl.created_at).getTime()) / 60000));
        if (mins < 60 * 24) setRecentHighlight({ text: hl.text, minutesAgo: mins });
      }

      const { data: cities } = await supabase
        .from('reading_sessions')
        .select('city')
        .eq('book_id', bookId)
        .not('city', 'is', null)
        .gte('last_seen_at', cutoff);
      if (mounted && cities && cities.length) {
        const counts: Record<string, number> = {};
        cities.forEach((r: any) => { if (r.city) counts[r.city] = (counts[r.city] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (top && top[1] >= 2) setCity(top[0]);
      }
    };
    refresh();
    const ch = supabase
      .channel(`ghost-${bookId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_sessions', filter: `book_id=eq.${bookId}` }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'book_highlights', filter: `book_id=eq.${bookId}` }, refresh)
      .subscribe();
    const interval = setInterval(refresh, 60_000);
    return () => { mounted = false; supabase.removeChannel(ch); clearInterval(interval); };
  }, [bookId]);

  if (!count && !recentHighlight && !city) return null;

  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur p-4 space-y-2 text-sm">
      {count > 0 && (
        <div className="flex items-center gap-2 text-foreground">
          <Eye className="h-4 w-4 text-primary" />
          <span><span className="font-semibold">{count}</span> {count === 1 ? 'شخص يقرأ' : 'أشخاص يقرؤون'} هذا الكتاب الآن</span>
        </div>
      )}
      {recentHighlight && (
        <div className="flex items-start gap-2 text-muted-foreground">
          <Highlighter className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <span>قام أحد القراء بتمييز سطر قبل {recentHighlight.minutesAgo} دقيقة</span>
        </div>
      )}
      {city && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>رائج في {city}</span>
        </div>
      )}
    </div>
  );
};