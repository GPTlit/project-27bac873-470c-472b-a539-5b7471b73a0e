import { Check, LayoutGrid, GalleryHorizontalEnd } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useHomeLayoutMode, useSetHomeLayoutMode, type HomeLayoutMode } from '@/hooks/useHomeLayoutMode';

const MODES: { id: HomeLayoutMode; name: string; desc: string; icon: typeof LayoutGrid }[] = [
  {
    id: 'classic',
    name: 'النمط الأول — الشبكة المربّعة',
    desc: 'الشكل الأصلي للمكتبة: الافتتاحية وشريط البحث، ثم أغلفة الكتب في شبكة متساوية ومربّعة.',
    icon: LayoutGrid,
  },
  {
    id: 'ads_first',
    name: 'النمط الثاني — العرض السينمائي',
    desc: 'شاشات الإعلانات في الأعلى، ثم صفوف أفقية بأحجام أغلفة متنوّعة.',
    icon: GalleryHorizontalEnd,
  },
];


export const HomeLayoutModePicker = () => {
  const { data: mode } = useHomeLayoutMode();
  const setMode = useSetHomeLayoutMode();
  const { toast } = useToast();

  const apply = async (id: HomeLayoutMode) => {
    try {
      await setMode(id);
      toast({ title: 'تم التحديث', description: 'تم تطبيق شكل الصفحة الرئيسية للجميع' });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <LayoutTemplate className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">شكل الصفحة الرئيسية</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        اختر ما يراه الزائر أولاً عند فتح المكتبة.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MODES.map((m) => {
          const active = mode === m.id;
          const Icon = m.icon;
          return (
            <Card
              key={m.id}
              onClick={() => apply(m.id)}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4 text-primary" />
                  {m.name}
                </span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </div>
              {/* Mini visual preview */}
              <div className="rounded-lg border border-border/60 bg-muted/40 p-2 space-y-1.5">
                {m.id === 'classic' ? (
                  <>
                    <div className="h-3 w-1/2 mx-auto rounded bg-foreground/30" />
                    <div className="h-4 rounded-full bg-card border border-border" />
                    <div className="grid grid-cols-4 gap-1.5">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded bg-foreground/15" />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-8 rounded bg-primary/25" />
                    <div className="h-3 w-1/2 mx-auto rounded bg-foreground/30" />
                    <div className="flex gap-1.5 items-end">
                      <div className="h-10 w-8 rounded bg-foreground/20" />
                      <div className="h-7 w-12 rounded bg-foreground/15" />
                      <div className="h-12 w-7 rounded bg-foreground/20" />
                      <div className="h-8 w-10 rounded bg-foreground/15" />
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-2">{m.desc}</p>
              <Button
                size="sm"
                variant={active ? 'default' : 'outline'}
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  apply(m.id);
                }}
              >
                {active ? 'مُطبَّق' : 'تطبيق'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
