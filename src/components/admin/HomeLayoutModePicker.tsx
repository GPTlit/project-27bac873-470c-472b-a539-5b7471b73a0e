import { Check, LayoutTemplate, Megaphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useHomeLayoutMode, useSetHomeLayoutMode, type HomeLayoutMode } from '@/hooks/useHomeLayoutMode';

const MODES: { id: HomeLayoutMode; name: string; desc: string; icon: typeof LayoutTemplate }[] = [
  {
    id: 'classic',
    name: 'الافتتاحية الكلاسيكية',
    desc: 'اسم المكتبة وشريط البحث وعدد الكتب أولاً، ثم شاشات الإعلانات.',
    icon: LayoutTemplate,
  },
  {
    id: 'ads_first',
    name: 'الإعلانات أولاً',
    desc: 'شاشات الإعلانات في الأعلى، ثم الافتتاحية وشريط البحث.',
    icon: Megaphone,
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
                {(m.id === 'classic'
                  ? ['title', 'search', 'stats', 'ad']
                  : ['ad', 'title', 'search', 'stats']
                ).map((block, i) => (
                  <div
                    key={i}
                    className={
                      block === 'ad'
                        ? 'h-8 rounded bg-primary/25'
                        : block === 'title'
                        ? 'h-3 w-1/2 mx-auto rounded bg-foreground/30'
                        : block === 'search'
                        ? 'h-4 rounded-full bg-card border border-border'
                        : 'h-3 w-2/3 mx-auto rounded bg-foreground/15'
                    }
                  />
                ))}
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
