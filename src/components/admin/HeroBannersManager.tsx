import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Plus, Trash2, Upload as UploadIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { HeroBanner } from '@/hooks/useHeroBanners';

const emptyForm = {
  title: '',
  subtitle: '',
  image_url: '',
  cta_label: '',
  cta_url: '',
  book_id: '',
  starts_at: '',
  ends_at: '',
  sort_order: 0,
  enabled: true,
  book_ids: [] as string[],
  thumb_size: 'medium' as 'small' | 'medium' | 'large',
};

const SIZES: { id: 'small' | 'medium' | 'large'; label: string; cls: string }[] = [
  { id: 'small', label: 'صغير', cls: 'w-10' },
  { id: 'medium', label: 'متوسط', cls: 'w-14' },
  { id: 'large', label: 'كبير', cls: 'w-20' },
];

// Framing formats for the showcase mode (النمط الثاني): each shape has a
// recommended upload size so the image fits its frame without cropping.
const FRAMES = [
  { id: 'wide', label: 'عريض (شاشة كاملة)', ratio: '16 / 9', w: 1920, h: 1080 },
  { id: 'panorama', label: 'بانورامي (شريط إعلان)', ratio: '21 / 9', w: 1920, h: 820 },
  { id: 'square', label: 'مربّع', ratio: '1 / 1', w: 1200, h: 1200 },
  { id: 'portrait', label: 'طولي (غلاف)', ratio: '2 / 3', w: 1000, h: 1500 },
] as const;

type FrameId = (typeof FRAMES)[number]['id'];

export const HeroBannersManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [frame, setFrame] = useState<FrameId>('wide');
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const activeFrame = FRAMES.find((f) => f.id === frame)!;


  const { data: banners, isLoading } = useQuery({
    queryKey: ['hero_banners', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as HeroBanner[];
    },
  });

  const { data: allBooks } = useQuery({
    queryKey: ['hero_banners', 'books-picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, cover_url')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as { id: string; title: string; author: string; cover_url: string | null }[];
    },
  });

  const toggleBook = (id: string) =>
    setForm((f) => ({
      ...f,
      book_ids: f.book_ids.includes(id) ? f.book_ids.filter((x) => x !== id) : [...f.book_ids, id],
    }));

  const create = useMutation({
    mutationFn: async (payload: typeof form) => {
      const row: any = {
        title: payload.title,
        subtitle: payload.subtitle || null,
        image_url: payload.image_url || null,
        cta_label: payload.cta_label || null,
        cta_url: payload.cta_url || null,
        book_id: payload.book_id || null,
        starts_at: payload.starts_at || null,
        ends_at: payload.ends_at || null,
        sort_order: Number(payload.sort_order) || 0,
        enabled: payload.enabled,
        book_ids: payload.book_ids,
        thumb_size: payload.thumb_size,
      };
      const { error } = await supabase.from('hero_banners').insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم', description: 'تمت إضافة اللافتة' });
      qc.invalidateQueries({ queryKey: ['hero_banners'] });
      setForm({ ...emptyForm });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف' });
      qc.invalidateQueries({ queryKey: ['hero_banners'] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('hero_banners').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hero_banners'] }),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          resolve({ w: img.naturalWidth, h: img.naturalHeight });
          URL.revokeObjectURL(url);
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
      const ext = file.name.split('.').pop() || 'jpg';
      const name = `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('covers').upload(`banners/${name}`, file);
      if (error) throw error;
      const { data } = supabase.storage.from('covers').getPublicUrl(`banners/${name}`);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      setImageDims(dims);
      const target = activeFrame.w / activeFrame.h;
      if (dims && Math.abs(dims.w / dims.h - target) > 0.12) {
        toast({
          title: 'تم رفع الصورة',
          description: `أبعاد الصورة ${dims.w}×${dims.h} لا تطابق إطار «${activeFrame.label}» (المقاس المقترح ${activeFrame.w}×${activeFrame.h}) — قد تُقتطع أطرافها.`,
        });
      } else {
        toast({ title: 'تم رفع الصورة' });
      }
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-xl border p-4 space-y-3 bg-card">
        <h3 className="font-bold text-lg">إضافة لافتة جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>العنوان *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>نص فرعي</Label>
            <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>شكل إطار الصورة (النمط الثاني)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 mb-3">
              {FRAMES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrame(f.id)}
                  className={`rounded-lg border p-2 flex flex-col items-center gap-2 hover:bg-accent ${
                    frame === f.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div
                    className="w-full rounded bg-secondary border"
                    style={{ aspectRatio: f.ratio }}
                  />
                  <span className="text-[11px] text-center leading-tight">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {f.w}×{f.h}
                  </span>
                </button>
              ))}
            </div>
            <Label>صورة اللافتة</Label>
            <p className="text-xs text-muted-foreground mb-1">
              المقاس المقترح لهذا الإطار: {activeFrame.w}×{activeFrame.h} بكسل
            </p>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="رابط الصورة أو ارفع ملفاً"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <label className="inline-flex items-center gap-1 px-3 h-10 rounded-md border cursor-pointer hover:bg-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            </div>
            {form.image_url && (
              <div className="mt-2 max-w-sm">
                <div
                  className="w-full overflow-hidden rounded-lg border bg-secondary"
                  style={{ aspectRatio: activeFrame.ratio }}
                >
                  <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                </div>
                {imageDims && (
                  <p className="text-xs text-muted-foreground mt-1">
                    أبعاد الصورة الحالية: {imageDims.w}×{imageDims.h}
                  </p>
                )}
              </div>
            )}

          </div>
          <div>
            <Label>نص الزر</Label>
            <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} placeholder="اقرأ الآن" />
          </div>
          <div>
            <Label>رابط الزر (اختياري)</Label>
            <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
          </div>
          <div>
            <Label>معرّف كتاب مرتبط (اختياري)</Label>
            <Input value={form.book_id} onChange={(e) => setForm({ ...form, book_id: e.target.value })} placeholder="UUID" />
          </div>
          <div className="md:col-span-2">
            <Label>الكتب المرافقة للإعلان</Label>
            <Input
              placeholder="ابحث عن كتاب لإضافته..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              className="mb-2"
            />
            {!!form.book_ids.length && (
              <div className="flex gap-2 flex-wrap mb-2">
                {form.book_ids.map((id) => {
                  const b = allBooks?.find((x) => x.id === id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleBook(id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs"
                    >
                      <X className="h-3 w-3" />
                      <span className="max-w-[140px] truncate">{b?.title || id}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="max-h-44 overflow-y-auto rounded-md border divide-y">
              {(allBooks ?? [])
                .filter((b) =>
                  bookSearch.trim()
                    ? (b.title + ' ' + (b.author || '')).toLowerCase().includes(bookSearch.toLowerCase())
                    : true,
                )
                .slice(0, 40)
                .map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBook(b.id)}
                    className={`w-full flex items-center gap-2 p-2 text-right hover:bg-accent ${
                      form.book_ids.includes(b.id) ? 'bg-accent/60' : ''
                    }`}
                  >
                    {b.cover_url ? (
                      <img src={b.cover_url} alt="" className="h-10 w-7 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-7 rounded bg-secondary" />
                    )}
                    <span className="flex-1 min-w-0 truncate text-sm">{b.title}</span>
                    {form.book_ids.includes(b.id) && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>حجم صور الأغلفة في الإعلان</Label>
            <div className="flex gap-2 mt-1">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm({ ...form, thumb_size: s.id })}
                  className={`flex-1 rounded-lg border p-3 flex flex-col items-center gap-2 hover:bg-accent ${
                    form.thumb_size === s.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className={`${s.cls} aspect-[2/3] rounded bg-secondary border`} />
                  <span className="text-xs">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>الترتيب</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>يبدأ في</Label>
            <Input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </div>
          <div>
            <Label>ينتهي في</Label>
            <Input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            <Label>مفعّل</Label>
          </div>
        </div>
        <Button
          onClick={() => form.title && create.mutate(form)}
          disabled={!form.title || create.isPending}
          className="gap-2"
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          إضافة
        </Button>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3">اللافتات الحالية</h3>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : !banners?.length ? (
          <p className="text-muted-foreground text-sm">
            لا توجد لافتات بعد. سيتم عرض الكتب المختارة تلقائياً على الصفحة الرئيسية.
          </p>
        ) : (
          <div className="space-y-2">
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                {b.image_url && (
                  <img src={b.image_url} alt="" className="h-14 w-24 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{b.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{b.subtitle || '—'}</div>
                  <div className="text-xs text-muted-foreground">
                    {(b.book_ids?.length ?? 0) > 0
                      ? `${b.book_ids!.length} كتاب مرافق · حجم ${
                          b.thumb_size === 'small' ? 'صغير' : b.thumb_size === 'large' ? 'كبير' : 'متوسط'
                        }`
                      : 'بدون كتب مرافقة'}
                  </div>
                </div>
                <Switch
                  checked={b.enabled}
                  onCheckedChange={(v) => toggle.mutate({ id: b.id, enabled: v })}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => remove.mutate(b.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};