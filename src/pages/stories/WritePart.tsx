import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStoryParts, useUpdatePart, useDeletePart, useCreatePart, uploadStoryMedia } from '@/hooks/useStories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Image as ImageIcon, Youtube, Plus, Trash2, ArrowRight } from 'lucide-react';
import { MediaBlock, type Media } from '@/components/stories/MediaBlock';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function WritePart() {
  const { id: storyId, partId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: parts = [] } = useStoryParts(storyId);
  const update = useUpdatePart();
  const del = useDeletePart();
  const createPart = useCreatePart();
  const imgRef = useRef<HTMLInputElement>(null);

  const part = parts.find(p => p.id === partId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<Media[]>([]);

  useEffect(() => {
    if (part) {
      setTitle(part.title); setContent(part.content); setMedia(part.media ?? []);
    }
  }, [part?.id]);

  if (!part) return <Layout><div className="container-library py-12">جاري التحميل...</div></Layout>;

  const save = async (extra?: any) => {
    await update.mutateAsync({ id: part.id, title, content, media, ...extra });
    toast({ title: 'تم الحفظ' });
  };

  const publishPart = async () => { await save({ published: true }); toast({ title: 'تم نشر الجزء' }); };
  const unpublish = async () => { await save({ published: false }); };

  const addImage = async (f: File) => {
    if (!user) return;
    try {
      const url = await uploadStoryMedia(f, user.id, 'inline');
      setMedia(m => [...m, { type: 'image', url }]);
    } catch (e: any) { toast({ title: 'فشل الرفع', description: e.message, variant: 'destructive' }); }
  };

  const addYoutube = () => {
    const url = window.prompt('ضع رابط يوتيوب:');
    if (url) setMedia(m => [...m, { type: 'youtube', url }]);
  };

  const nextPart = async () => {
    await save();
    const next = parts.find(p => p.order_index === part.order_index + 1);
    if (next) nav(`/write/${storyId}/parts/${next.id}`);
    else {
      const p = await createPart.mutateAsync({ storyId: storyId!, orderIndex: parts.length });
      nav(`/write/${storyId}/parts/${p.id}`);
    }
  };

  return (
    <Layout>
      <div className="container-library py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/write/${storyId}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowRight className="h-4 w-4" /> رجوع للقصة
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save()}><Save className="h-4 w-4" /> حفظ</Button>
            {part.published ? (
              <Button variant="secondary" onClick={unpublish}>إلغاء النشر</Button>
            ) : (
              <Button onClick={publishPart}>نشر الجزء</Button>
            )}
          </div>
        </div>

        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الجزء" className="text-lg font-semibold mb-3" />

        {media.length > 0 && (
          <div className="space-y-3 mb-4">
            {media.map((m, i) => (
              <MediaBlock key={i} media={m} onRemove={() => setMedia(arr => arr.filter((_, idx) => idx !== i))} />
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <input ref={imgRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) addImage(f); e.currentTarget.value = ''; }} />
          <Button type="button" variant="outline" size="sm" onClick={() => imgRef.current?.click()}><ImageIcon className="h-4 w-4" /> صورة</Button>
          <Button type="button" variant="outline" size="sm" onClick={addYoutube}><Youtube className="h-4 w-4" /> يوتيوب</Button>
        </div>

        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="اكتب قصتك هنا... بلا حدود."
          className="min-h-[480px] text-base leading-loose"
        />

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button variant="ghost" className="text-destructive" onClick={async () => { if (confirm('حذف هذا الجزء؟')) { await del.mutateAsync({ id: part.id, storyId: storyId! }); nav(`/write/${storyId}`); } }}>
            <Trash2 className="h-4 w-4" /> حذف الجزء
          </Button>
          <Button onClick={nextPart}><Plus className="h-4 w-4" /> الجزء التالي</Button>
        </div>
      </div>
    </Layout>
  );
}