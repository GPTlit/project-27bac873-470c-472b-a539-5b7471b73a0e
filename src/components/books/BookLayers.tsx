import { useEffect, useState } from 'react';
import { Lock, Unlock, Sparkles, Loader2, Quote, BookOpen, Brain, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

type LayerType = 'quotes' | 'summary' | 'analysis' | 'secrets';
const LAYERS: { key: LayerType; label: string; icon: any; level: number }[] = [
  { key: 'quotes', label: 'الاقتباسات', icon: Quote, level: 1 },
  { key: 'summary', label: 'الملخص', icon: BookOpen, level: 2 },
  { key: 'analysis', label: 'التحليل العميق', icon: Brain, level: 3 },
  { key: 'secrets', label: 'أسرار المؤلف', icon: KeyRound, level: 4 },
];

interface Props { bookId: string; bookTitle: string; author: string }

export const BookLayers = ({ bookId, bookTitle, author }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unlocked, setUnlocked] = useState<Set<LayerType>>(new Set());
  const [contents, setContents] = useState<Partial<Record<LayerType, string>>>({});
  const [loading, setLoading] = useState<LayerType | null>(null);
  const [open, setOpen] = useState<LayerType | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('book_layer_unlocks')
        .select('layer_type')
        .eq('book_id', bookId)
        .eq('user_id', user.id);
      if (data) setUnlocked(new Set(data.map((r: any) => r.layer_type)));
      const { data: stored } = await supabase
        .from('book_layers')
        .select('layer_type, content')
        .eq('book_id', bookId);
      if (stored) {
        const map: any = {};
        stored.forEach((r: any) => (map[r.layer_type] = r.content));
        setContents(map);
      }
    })();
  }, [bookId, user]);

  const unlock = async (layer: LayerType) => {
    if (!user) { toast({ title: 'سجل دخولك أولاً' }); return; }
    setLoading(layer);
    try {
      let content = contents[layer];
      if (!content) {
        const { data, error } = await supabase.functions.invoke('ask-the-book', {
          body: { mode: 'layer', bookTitle, author, layerType: layer },
        });
        if (error || !data?.content) throw new Error(error?.message || 'فشل التوليد');
        content = data.content;
        await supabase.from('book_layers').upsert({ book_id: bookId, layer_type: layer, content }, { onConflict: 'book_id,layer_type' });
        setContents((c) => ({ ...c, [layer]: content }));
      }
      await supabase.from('book_layer_unlocks').insert({ book_id: bookId, user_id: user.id, layer_type: layer });
      setUnlocked((u) => new Set(u).add(layer));
      setOpen(layer);
    } catch (e: any) {
      toast({ title: 'خطأ', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">طبقات الكتاب الخفية</h3>
      </div>
      <p className="text-sm text-muted-foreground">افتح طبقات أعمق من المعرفة حول هذا الكتاب</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {LAYERS.map((L) => {
          const isUnlocked = unlocked.has(L.key);
          const isOpen = open === L.key;
          const Icon = L.icon;
          return (
            <div key={L.key} className="border border-border rounded-xl overflow-hidden bg-card">
              <button
                onClick={() => isUnlocked ? setOpen(isOpen ? null : L.key) : unlock(L.key)}
                disabled={loading === L.key}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{L.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">طبقة {L.level}</span>
                  </div>
                </div>
                {loading === L.key ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : isUnlocked ? (
                  <Unlock className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isOpen && contents[L.key] && (
                <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{contents[L.key]!}</ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};