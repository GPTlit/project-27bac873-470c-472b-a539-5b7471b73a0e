import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Upload as UploadIcon, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { PromoBlock } from '@/hooks/usePromoBlocks';

const MEDIA_TYPES = [
  { id: 'image', label: 'صورة' },
  { id: 'video', label: 'فيديو' },
  { id: 'youtube', label: 'يوتيوب' },
  { id: 'books', label: 'كتب' },
] as const;

const SLOTS = [
  { id: 1, label: 'بعد الكتب المختارة' },
  { id: 2, label: 'بعد التصنيفات' },
  { id: 3, label: 'بعد أُضيف حديثاً' },
  { id: 4, label: 'أسفل الصفحة' },
];

const SIZES = [
  { id: 'small', label: 'صغير' },
  { id: 'medium', label: 'متوسط' },
  { id: 'large', label: 'كبير' },
] as const;

const emptyForm = {
  title: '',
  subtitle: '',
  media_type: 'image' as PromoBlock['media_type'],
  media_url: '',
  youtube_url: '',
  link_url: '',
  link_label: '',
  book_ids: [] as string[],
  thumb_size: 'medium' as PromoBlock['thumb_size'],
  slot: 1,
  enabled: true,
  sort_order: 0,
};

export const PromoBlocksManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const [bookSearch, setBookSearch] = useState('');

  const { data: blocks, isLoading } = useQuery({
    queryKey: ['promo_blocks', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_blocks')
        .select('*')
        .order('slot')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as PromoBlock[];
    },
  });

  const { data: books } = useQuery({
    queryKey: ['promo_books_picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('id,title,cover_url')
        .order('created_at', { ascending: false })
        .limit(400);
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('promo_blocks').insert({
        title: form.title || null,
        subtitle: form.subtitle || null,
        media_type: form.media_type,
        media_url: form.media_url || null,
        youtube_url: form.youtube_url || null,
        link_url: form.link_url || null,
        link_label: form.link_label || null,
        book_ids: form.book_ids,
        thumb_size: form.thumb_size,
        slot: form.slot,
        enabled: form.enabled,
        sort_order: form.sort_order,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo_blocks'] });
      qc.invalidateQueries({ queryKey: ['promo_blocks', 'admin'] });
      setForm({ ...emptyForm });
      toast({ title: 'تم إضافة اللوحة' });
    },
    onError: (e: Error) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('promo_blocks').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo_blocks'] });
      qc.invalidateQueries({ queryKey: ['promo_blocks', 'admin'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo_blocks'] });
      qc.invalidateQueries({ queryKey: ['promo_blocks', 'admin'] });
      toast({ title: 'تم الحذف' });
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `promo/${crypto.randomUUID()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('covers').getPublicUrl(path);
      setForm((f) => ({ ...f, media_url: data.publicUrl }));
      toast({ title: 'تم رفع الملف' });
    } catch (e) {
      toast({ title: 'فشل الرفع', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const filteredBooks = (books ?? []).filter((b) =>
    bookSearch ? b.title.toLowerCase().includes(bookSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">لوحات إعلانية بين الأقسام</h3>
        <p className="text-sm text-muted-foreground">
          صور، فيديو، روابط يوتيوب، كتب من مكتبتك، أو رابط حدث/منتج — وتحدّد مكانها في الصفحة.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>العنوان</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>العنوان الفرعي</Label>
            <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">نوع المحتوى</Label>
          <div className="flex flex-wrap gap-2">
            {MEDIA_TYPES.map((m) => (
              <Button
                key={m.id}
                type="button"
                size="sm"
                variant={form.media_type === m.id ? 'default' : 'outline'}
                onClick={() => setForm({ ...form, media_type: m.id })}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>

        {(form.media_type === 'image' || form.media_type === 'video') && (
          <div className="space-y-2">
            <Label>الملف</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept={form.media_type === 'image' ? 'image/*' : 'video/*'}
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {form.media_url && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3" /> تم الرفع
              </p>
            )}
          </div>
        )}

        {form.media_type === 'youtube' && (
          <div>
            <Label>رابط يوتيوب</Label>
            <Input
              dir="ltr"
              placeholder="https://youtu.be/..."
              value={form.youtube_url}
              onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
            />
          </div>
        )}

        {form.media_type === 'books' && (
          <div className="space-y-2">
            <Label>اختر الكتب</Label>
            <Input
              placeholder="ابحث عن كتاب..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
            />
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {filteredBooks.map((b) => {
                const selected = form.book_ids.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        book_ids: selected ? f.book_ids.filter((x) => x !== b.id) : [...f.book_ids, b.id],
                      }))
                    }
                    className={`flex w-full items-center gap-2 rounded-md p-1.5 text-right text-sm transition-colors ${
                      selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-secondary">
                      {b.cover_url && <img src={b.cover_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <span className="line-clamp-1 flex-1">{b.title}</span>
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            <div>
              <Label className="mb-2 block">حجم الأغلفة</Label>
              <div className="flex gap-2">
                {SIZES.map((s) => (
                  <Button
                    key={s.id}
                    type="button"
                    size="sm"
                    variant={form.thumb_size === s.id ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, thumb_size: s.id })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>رابط (حدث / منتج / صفحة)</Label>
            <Input
              dir="ltr"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            />
          </div>
          <div>
            <Label>نص الزر</Label>
            <Input value={form.link_label} onChange={(e) => setForm({ ...form, link_label: e.target.value })} />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">مكان اللوحة في الصفحة</Label>
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={form.slot === s.id ? 'default' : 'outline'}
                onClick={() => setForm({ ...form, slot: s.id })}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            <Label>مُفعّلة</Label>
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            إضافة اللوحة
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {(blocks ?? []).map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-medium text-foreground">{b.title || '(بدون عنوان)'}</p>
              <p className="text-xs text-muted-foreground">
                {MEDIA_TYPES.find((m) => m.id === b.media_type)?.label} ·{' '}
                {SLOTS.find((s) => s.id === b.slot)?.label ?? `موضع ${b.slot}`}
                {b.media_type === 'books' ? ` · ${b.book_ids.length} كتاب` : ''}
              </p>
            </div>
            <Switch checked={b.enabled} onCheckedChange={(v) => toggle.mutate({ id: b.id, enabled: v })} />
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(b.id)} aria-label="حذف">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
