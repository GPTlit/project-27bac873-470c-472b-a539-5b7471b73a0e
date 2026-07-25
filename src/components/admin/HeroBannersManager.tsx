import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Upload as UploadIcon } from 'lucide-react';
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
};

export const HeroBannersManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);

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
      const ext = file.name.split('.').pop() || 'jpg';
      const name = `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('covers').upload(`banners/${name}`, file);
      if (error) throw error;
      const { data } = supabase.storage.from('covers').getPublicUrl(`banners/${name}`);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast({ title: 'تم رفع الصورة' });
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
            <Label>صورة اللافتة</Label>
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
              <img src={form.image_url} alt="preview" className="mt-2 max-h-32 rounded" />
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