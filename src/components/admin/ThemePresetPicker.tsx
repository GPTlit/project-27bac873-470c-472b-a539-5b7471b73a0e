import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PRESETS = [
  { id: null,        name: 'الافتراضي (داكن/فاتح)', swatch: ['#1a1a1a', '#f5e9d5', '#c89b3c'] },
  { id: 'royal',     name: 'الذهب الملكي',          swatch: ['#0f1330', '#1a2050', '#f5c842'] },
  { id: 'ramadan',   name: 'رمضان',                  swatch: ['#143228', '#2a8a5f', '#ecc14d'] },
  { id: 'sakura',    name: 'ساكورا',                 swatch: ['#fde7ef', '#e83e8c', '#b56cd8'] },
  { id: 'ocean',     name: 'المحيط',                 swatch: ['#0b2236', '#1eb6d4', '#2bd4c0'] },
  { id: 'sunset',    name: 'الغروب',                 swatch: ['#2a1410', '#ef6a2a', '#e84a8e'] },
] as const;

export const ThemePresetPicker = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: current } = useQuery({
    queryKey: ['active-theme-preset'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'active_theme_preset')
        .maybeSingle();
      const v = data?.value as any;
      return (typeof v === 'string' ? v : v?.preset) ?? null;
    },
  });

  const setPreset = async (id: string | null) => {
    const { error } = await supabase
      .from('app_config')
      .upsert(
        { key: 'active_theme_preset', value: id as any, description: 'Admin-selected UI preset' },
        { onConflict: 'key' },
      );
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم التحديث', description: 'تم تطبيق المظهر للجميع' });
    qc.invalidateQueries({ queryKey: ['active-theme-preset'] });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">مظاهر خاصة (مرئية للجميع)</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        اختر مظهراً لتطبيقه على واجهة جميع المستخدمين. ارجع للافتراضي لاستعادة الوضع الداكن/الفاتح.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PRESETS.map((p) => {
          const active = (current ?? null) === (p.id ?? null);
          return (
            <Card key={p.id ?? 'default'} className={`p-4 cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-primary' : ''}`} onClick={() => setPreset(p.id)}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">{p.name}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex gap-1">
                {p.swatch.map((c, i) => (
                  <div key={i} className="h-8 flex-1 rounded" style={{ background: c }} />
                ))}
              </div>
              <Button size="sm" variant={active ? 'default' : 'outline'} className="w-full mt-3" onClick={(e) => { e.stopPropagation(); setPreset(p.id); }}>
                {active ? 'مُطبَّق' : 'تطبيق'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};