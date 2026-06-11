import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStory, useStoryParts, useUpdateStory, useDeleteStory, useCreatePart, useUpdatePart, uploadStoryMedia } from '@/hooks/useStories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Send, Trash2, ArrowRight, Upload as UploadIcon, ImageOff, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function WriteStory() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: story, isLoading } = useStory(id);
  const { data: parts = [] } = useStoryParts(id);
  const update = useUpdateStory();
  const del = useDeleteStory();
  const createPart = useCreatePart();
  const updatePart = useUpdatePart();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', description: '', cover_url: '', language: 'ar',
    copyright: '', tags: '' as string, category: '',
  });
  const [body, setBody] = useState('');
  const ensuredRef = useRef(false);

  useEffect(() => {
    if (story) {
      setForm({
        title: story.title, description: story.description ?? '',
        cover_url: story.cover_url ?? '', language: story.language ?? 'ar',
        copyright: story.copyright ?? '',
        tags: (story.tags ?? []).join(', '), category: story.category ?? '',
      });
    }
  }, [story?.id]);

  // Ensure a single "body" part exists, hydrate body textarea
  useEffect(() => {
    if (!story) return;
    if (parts.length === 0 && !ensuredRef.current) {
      ensuredRef.current = true;
      createPart.mutate({ storyId: story.id, orderIndex: 0, title: story.title || 'القصة' });
    } else if (parts[0]) {
      setBody(parts[0].content || '');
    }
  }, [story?.id, parts.length]);

  if (isLoading || !story) return <Layout><div className="container-library py-12">جاري التحميل...</div></Layout>;

  const save = async (extra?: Partial<typeof story>) => {
    await update.mutateAsync({
      id: story.id,
      title: form.title || 'قصة بلا عنوان',
      description: form.description || null,
      cover_url: form.cover_url || null,
      language: form.language || 'ar',
      copyright: form.copyright || null,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      category: form.category || null,
      ...extra,
    });
    if (parts[0]) {
      await updatePart.mutateAsync({ id: parts[0].id, content: body, title: form.title || 'القصة', published: true });
    }
    toast({ title: 'تم الحفظ' });
  };

  const publish = async () => {
    await save({ status: 'published' });
    toast({ title: 'تم نشر القصة' });
  };

  const unpublish = async () => { await save({ status: 'draft' }); };

  const onPickCover = async (f: File, input: HTMLInputElement | null) => {
    if (!user) return;
    try {
      const url = await uploadStoryMedia(f, user.id, 'cover');
      setForm(p => ({ ...p, cover_url: url }));
      await update.mutateAsync({ id: story.id, cover_url: url });
      toast({ title: 'تم رفع الغلاف' });
    } catch (e: any) { toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' }); }
    finally { if (input) input.value = ''; }
  };

  return (
    <Layout>
      <div className="container-library py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/write" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowRight className="h-4 w-4" /> قصصي
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save()} disabled={update.isPending}>
              <Save className="h-4 w-4" /> حفظ
            </Button>
            {story.status === 'published' ? (
              <Button variant="secondary" onClick={unpublish}>إلغاء النشر</Button>
            ) : (
              <Button onClick={publish} disabled={update.isPending}>
                <Send className="h-4 w-4" /> نشر
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-5 bg-card border border-border rounded-2xl p-5">
          <div className="grid sm:grid-cols-[140px_1fr] gap-4">
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const input = e.target; const f = input.files?.[0]; if (f) onPickCover(f, input); }} />
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center relative">
                {form.cover_url ? (
                  <>
                    <img src={form.cover_url} alt="" className="w-full h-full object-cover" />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => { setForm(p => ({ ...p, cover_url: '' })); update.mutate({ id: story.id, cover_url: null }); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <ImageOff className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => fileRef.current?.click()}>
                <UploadIcon className="h-4 w-4" /> غلاف
              </Button>
            </div>

            <div className="space-y-3">
              <div><Label>العنوان</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>التصنيف</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="رواية, شعر..." /></div>
                <div><Label>اللغة</Label><Input value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} placeholder="ar / en / fr" /></div>
              </div>
              <div><Label>الوسوم (مفصولة بفاصلة)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="رومانسية, خيال, مغامرة" /></div>
              <div><Label>حقوق النشر</Label><Input value={form.copyright} onChange={e => setForm(p => ({ ...p, copyright: e.target.value }))} placeholder="© جميع الحقوق محفوظة للمؤلف" /></div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Label className="text-base font-semibold">القصة كاملة</Label>
          <p className="text-xs text-muted-foreground mb-2">اكتب القصة هنا. سيتم تقسيمها إلى صفحات تلقائياً عند القراءة.</p>
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="ابدأ بسرد قصتك..."
            className="min-h-[480px] text-base leading-loose"
          />
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <Button variant="destructive" onClick={async () => { if (confirm('حذف القصة نهائياً؟')) { await del.mutateAsync(story.id); nav('/write'); } }}>
            <Trash2 className="h-4 w-4" /> حذف القصة
          </Button>
        </div>
      </div>
    </Layout>
  );
}