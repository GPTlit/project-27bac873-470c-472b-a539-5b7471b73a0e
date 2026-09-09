import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { VerifiedBadge } from '@/components/VerifiedBadge';

export const VerifiedBadgeManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin_profiles_badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id,username,display_name,avatar_url,verified,reading_seconds,reader_id')
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setBadge = useMutation({
    mutationFn: async ({ userId, value }: { userId: string; value: boolean }) => {
      const { error } = await supabase.rpc('set_verified_badge', { _user_id: userId, _value: value });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_profiles_badges'] });
      toast({ title: 'تم تحديث الشارة' });
    },
    onError: (e: Error) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  const list = (profiles ?? []).filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.display_name ?? '').toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      String(p.reader_id ?? '').includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <VerifiedBadge /> شارة القارئ الموثّق
        </h3>
        <p className="text-sm text-muted-foreground">
          تُمنح تلقائياً بعد 10 ساعات قراءة، ويمكنك منحها أو سحبها يدوياً.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pr-9"
          placeholder="ابحث بالاسم أو رقم القارئ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}

      <div className="space-y-2">
        {list.map((p) => (
          <div key={p.user_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary">
              {p.avatar_url && <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 line-clamp-1 font-medium text-foreground">
                {p.display_name || p.username}
                {p.verified && <VerifiedBadge className="h-4 w-4" />}
              </p>
              <p className="text-xs text-muted-foreground">
                #{p.reader_id ?? '—'} · {Math.floor((p.reading_seconds ?? 0) / 3600)} ساعة قراءة
              </p>
            </div>
            <Switch
              checked={!!p.verified}
              onCheckedChange={(v) => setBadge.mutate({ userId: p.user_id, value: v })}
            />
          </div>
        ))}
        {!isLoading && !list.length && (
          <p className="text-sm text-muted-foreground">لا نتائج</p>
        )}
      </div>
    </div>
  );
};
