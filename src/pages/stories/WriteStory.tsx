import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStory, useStoryParts, useUpdateStory, useDeleteStory, useCreatePart, uploadStoryMedia } from '@/hooks/useStories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Send, Trash2, Plus, ArrowRight, Upload as UploadIcon, ImageOff, X } from 'lucide-react';
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', description: '', cover_url: '', language: 'ar', mature: false,
    copyright: '', tags: '' as string, category: '',
  });

  useEffect(() => {
    if (story) {
      setForm({
        title: story.title, description: story.description ?? '',
        cover_url: story.cover_url ?? '', language: story.language ?? 'ar',
        mature: story.mature, copyright: story.copyright ?? '',
        tags: (story.tags ?? []).join(', '), category: story.category ?? '',
      });
    }
  }, [story?.id]);

  if (isLoading || !story) return <Layout><div className="container-library py-12">جاري التحميل...</div></Layout>;

  const save = async (extra?: Partial<typeof story>) => {
    await update.mutateAsync({
      id: story.id,
      title: form.title || 'قصة بلا عنوان',
      description: form.description || null,
      cover_url: form.cover_url || null,
      language: form.language || 'ar',
      mature: form.mature,
      copyright: form.copyright || null,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      category: form.category || null,
      ...extra,
    });
    toast({ title: 'تم الحفظ' });
  };

  const publish = async () => {
    await save({ status: 'published' });
    toast({ title: 'تم نشر القصة' });
  };

  const unpublish = async () => { await save({ status: 'draft' }); };

  const onPickCover = async (f: File) => {
    if (!user) return;
    try {
      const url = await uploadStoryMedia(f, user.id, 'cover');
      setForm(p => ({ ...p, cover_url: url }));
      await update.mutateAsync({ id: story.id, cover_url: url });
    } catch (e: any) { toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' }); }
  };

  const addPart = async () => {
    const p = await createPart.mutateAsync({ storyId: story.id, orderIndex: parts.length });
    nav(`/write/${story.id}/parts/${p.id}`);
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
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onPickCover(f); e.currentTarget.value = ''; }} />
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
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><Label className="text-sm">محتوى للبالغين</Label><p className="text-xs text-muted-foreground">يظهر فقط لمن فعّل خيار +18</p></div>
                <Switch checked={form.mature} onCheckedChange={v => setForm(p => ({ ...p, mature: v }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">الأجزاء</h2>
            <Button onClick={addPart}><Plus className="h-4 w-4" /> جزء جديد</Button>
          </div>
          {parts.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد أجزاء بعد.</p>
          ) : (
            <ul className="space-y-2">
              {parts.map((p, i) => (
                <li key={p.id}>
                  <Link to={`/write/${story.id}/parts/${p.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:shadow-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                      <span className="font-medium">{p.title || 'بلا عنوان'}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{p.published ? 'منشور' : 'مسودة'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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