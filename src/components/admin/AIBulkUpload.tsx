import { useState } from 'react';
import { Sparkles, Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { extractPdfSample, extractPdfFirstPageImage } from '@/lib/pdfExtract';
import { getPdfPageCount } from '@/lib/pdfExtract';

type Status = 'pending' | 'extracting' | 'analyzing' | 'uploading' | 'done' | 'error';

interface BookJob {
  file: File;
  status: Status;
  error?: string;
  metadata?: {
    title: string;
    author: string;
    description: string;
    categories: string[];
  };
}

const safeName = (ext: string) =>
  `book_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

export const AIBulkUpload = ({ onDone }: { onDone?: () => void }) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<BookJob[]>([]);
  const [running, setRunning] = useState(false);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    setJobs(files.map((file) => ({ file, status: 'pending' as Status })));
  };

  const updateJob = (idx: number, patch: Partial<BookJob>) => {
    setJobs((prev) => prev.map((j, i) => (i === idx ? { ...j, ...patch } : j)));
  };

  const processJob = async (idx: number, job: BookJob) => {
    try {
      updateJob(idx, { status: 'extracting' });
      const [sample, coverBlob, pageCount] = await Promise.all([
        extractPdfSample(job.file).catch(() => ''),
        extractPdfFirstPageImage(job.file).catch(() => null),
        getPdfPageCount(job.file).catch(() => null),
      ]);

      updateJob(idx, { status: 'analyzing' });
      const { data, error } = await supabase.functions.invoke('ai-book-metadata', {
        body: { filename: job.file.name, textSample: sample },
      });
      if (error || !data?.metadata) {
        throw new Error(error?.message || data?.error || 'فشل تحليل الكتاب');
      }
      const metadata = data.metadata;

      updateJob(idx, { status: 'uploading', metadata });

      const filename = safeName('pdf');
      const { error: upErr } = await supabase.storage
        .from('books')
        .upload(filename, job.file, { contentType: 'application/pdf', cacheControl: '3600' });
      if (upErr) throw new Error(`فشل رفع الملف: ${upErr.message}`);
      const { data: urlData } = supabase.storage.from('books').getPublicUrl(filename);

      let coverUrl: string | null = null;
      if (coverBlob) {
        const coverName = safeName('jpg');
        const { error: covErr } = await supabase.storage
          .from('covers')
          .upload(coverName, coverBlob, { contentType: 'image/jpeg', cacheControl: '3600' });
        if (!covErr) {
          coverUrl = supabase.storage.from('covers').getPublicUrl(coverName).data.publicUrl;
        }
      }

      const { error: insErr } = await supabase.from('books').insert({
        title: metadata.title,
        author: metadata.author,
        description: metadata.description,
        category: metadata.categories[0],
        categories: metadata.categories,
        file_url: urlData.publicUrl,
        file_type: 'pdf',
        cover_url: coverUrl,
        page_count: pageCount,
      });
      if (insErr) throw new Error(insErr.message);

      updateJob(idx, { status: 'done' });
    } catch (e: any) {
      updateJob(idx, { status: 'error', error: e?.message || 'خطأ غير معروف' });
    }
  };

  const startAll = async () => {
    if (!jobs.length) return;
    setRunning(true);
    // Process up to 3 in parallel for speed
    const concurrency = 3;
    let cursor = 0;
    const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
      while (true) {
        const i = cursor++;
        if (i >= jobs.length) break;
        await processJob(i, jobs[i]);
      }
    });
    await Promise.all(workers);
    setRunning(false);
    toast({ title: 'انتهى', description: `تمت معالجة ${jobs.length} كتاب` });
    onDone?.();
  };

  const statusLabel = (s: Status) =>
    ({ pending: 'بانتظار', extracting: 'قراءة', analyzing: 'تحليل AI', uploading: 'رفع', done: 'تم', error: 'خطأ' }[s]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          الرفع الذكي بالـ AI
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          اختر عدة ملفات PDF وسيقوم الذكاء الاصطناعي بتعبئة العنوان والمؤلف والوصف والتصنيفات تلقائياً ورفعها للمكتبة.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            id="bulk-pdf"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={onSelect}
            disabled={running}
          />
          <label
            htmlFor="bulk-pdf"
            className="flex items-center justify-center gap-3 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              اضغط لاختيار عدة ملفات PDF
            </span>
          </label>
        </div>

        {jobs.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {jobs.map((j, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {j.metadata?.title || j.file.name}
                  </p>
                  {j.metadata && (
                    <p className="text-xs text-muted-foreground truncate">
                      {j.metadata.author} · {j.metadata.categories.join(', ')}
                    </p>
                  )}
                  {j.error && <p className="text-xs text-destructive">{j.error}</p>}
                </div>
                <div className="shrink-0">
                  {j.status === 'done' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : j.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : j.status === 'pending' ? (
                    <Badge variant="outline">{statusLabel(j.status)}</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <Badge variant="secondary">{statusLabel(j.status)}</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={startAll}
          disabled={running || jobs.length === 0}
          className="w-full"
          variant="gold"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري المعالجة...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              ابدأ المعالجة التلقائية ({jobs.length})
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};