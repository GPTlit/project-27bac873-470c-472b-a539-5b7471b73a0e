import { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Props { bookTitle: string; author: string; passage?: string; onClose: () => void }

const PRESETS = ['اشرحها ببساطة', 'ماذا يقصد المؤلف عاطفياً؟', 'أعطني مثالاً من الحياة الواقعية', 'ما هي الفكرة الفلسفية وراءها؟'];

export const AskTheBook = ({ bookTitle, author, passage, onClose }: Props) => {
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const { data, error } = await supabase.functions.invoke('ask-the-book', {
        body: { mode: 'ask', bookTitle, author, passage, question: q },
      });
      if (error || !data?.content) throw new Error(error?.message || data?.error || 'خطأ');
      setAnswer(data.content);
    } catch (e: any) {
      toast({ title: 'خطأ', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold">اسأل الكتاب</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3">
          {passage && (
            <div className="text-xs bg-amber-50 dark:bg-amber-950/20 border-r-2 border-amber-400 p-2 rounded text-foreground/80">
              "{passage.slice(0, 200)}{passage.length > 200 ? '…' : ''}"
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => ask(p)} disabled={loading} className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/70 transition-colors">
                {p}
              </button>
            ))}
          </div>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="اكتب سؤالك..." rows={2} />
          <Button onClick={() => ask(question)} disabled={loading || !question.trim()} variant="gold" className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            اسأل
          </Button>
          {answer && (
            <div className="prose prose-sm max-w-none dark:prose-invert pt-2 border-t border-border">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};