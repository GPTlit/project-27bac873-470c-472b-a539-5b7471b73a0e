import { Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminEditMenu, useSetAdminEditMenu } from '@/hooks/useAdminEditMenu';

export const AdminEditMenuToggle = () => {
  const { data: enabled = false } = useAdminEditMenu();
  const setEnabled = useSetAdminEditMenu();
  const { toast } = useToast();

  const onChange = async (v: boolean) => {
    try {
      await setEnabled(v);
      toast({
        title: v ? 'تم التفعيل' : 'تم الإخفاء',
        description: v
          ? 'زر التعديل (ثلاث نقاط) ظاهر الآن على الكتب'
          : 'زر التعديل مخفي الآن للاستخدام العادي',
      });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div dir="rtl" className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
      <div>
        <Label className="flex items-center gap-2 font-semibold">
          <Pencil className="h-4 w-4 text-primary" />
          زر تعديل الكتب على الأغلفة
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          فعّله عندما تريد تعديل الكتب، وأطفئه للاستخدام العادي.
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
  );
};
