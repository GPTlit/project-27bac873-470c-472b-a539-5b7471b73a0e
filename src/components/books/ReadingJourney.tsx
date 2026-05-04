import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, Feather, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Entry {
  id: string; user_id: string; started_at: string | null; finished_at: string | null; note: string | null;
  profile?: { display_name: string | null; username: string };
}
interface Props { bookId: string }

export const ReadingJourney = ({ bookId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mine, setMine] = useState<Entry | null>(null);
  const [start, setStart] = useState('');
  const [finish, setFinish] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data } = await supabase
      .from('reading_journeys')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });
    if (!data) return;
    const userIds = data.map((d: any) => d.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, username')
      .in('user_id', userIds);
    const pmap: Record<string, any> = {};
    profiles?.forEach((p: any) => (pmap[p.user_id] = p));
    const enriched = data.map((d: any) => ({ ...d, profile: pmap[d.user_id] }));
    setEntries(enriched);
    if (user) {
      const m = enriched.find((e: Entry) => e.user_id === user.id) || null;
      setMine(m);
      if (m) {
        setStart(m.started_at || '');
        setFinish(m.finished_at || '');
        setNote(m.note || '');
      }
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [bookId, user?.id]);

  const save = async () => {
    if (!user) { toast({ title: 'سجل دخولك أولاً' }); return; }
    setSaving(true);
    const payload: any = { book_id: bookId, user_id: user.id, started_at: start || null, finished_at: finish || null, note: note || null };
    const { error } = await supabase.from('reading_journeys').upsert(payload, { onConflict: 'book_id,user_id' });
    setSaving(false);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم حفظ مسارك في هذا الكتاب' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Feather className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">سجل القراء</h3>
      </div>

      {user && (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-amber-50/50 to-rose-50/30 dark:from-amber-950/10 dark:to-rose-950/10 p-5 shadow-inner" style={{ fontFamily: 'cursive' }}>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <label className="text-sm">
              <span className="block text-muted-foreground mb-1">بدأت في</span>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="block text-muted-foreground mb-1">انتهيت في</span>
              <Input type="date" value={finish} onChange={(e) => setFinish(e.target.value)} />
            </label>
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب رأيك أو ذكرى عن هذا الكتاب..."
            rows={3}
            className="bg-transparent"
          />
          <Button onClick={save} disabled={saving} variant="gold" className="mt-3 gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mine ? 'حدّث ملاحظتك' : 'وقّع في السجل'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((e) => {
          const name = e.profile?.display_name || e.profile?.username || 'قارئ';
          const isOpen = expanded.has(e.id);
          return (
            <div key={e.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-semibold">{name}</span>
                  <span className="text-muted-foreground"> — {e.started_at || '؟'} → {e.finished_at || 'يقرأ'}</span>
                </div>
                {e.note && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    const n = new Set(expanded); isOpen ? n.delete(e.id) : n.add(e.id); setExpanded(n);
                  }}>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              {isOpen && e.note && (
                <p className="mt-2 pt-2 border-t border-border text-sm text-foreground/80 italic">"{e.note}"</p>
              )}
            </div>
          );
        })}
        {!entries.length && <p className="text-sm text-muted-foreground text-center py-4">كن أول من يوقّع في سجل هذا الكتاب</p>}
      </div>
    </div>
  );
};