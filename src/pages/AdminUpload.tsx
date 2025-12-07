import { useState } from 'react';
import { Shield, Upload, FileText, Image, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { categories } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const AdminUpload = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    featured: false,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.author || !formData.category || !pdfFile) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate upload (in production, this would upload to Supabase/Firebase)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: 'تم الرفع بنجاح',
      description: 'تم إضافة الكتاب للمكتبة',
    });

    // Reset form
    setFormData({
      title: '',
      author: '',
      description: '',
      category: '',
      featured: false,
    });
    setPdfFile(null);
    setCoverFile(null);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-library section-padding">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-6">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            لوحة تحكم المشرف
          </h1>
          <p className="text-muted-foreground">
            رفع كتاب جديد للمكتبة
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div className="card-cozy p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الكتاب *</Label>
              <Input
                id="title"
                placeholder="أدخل عنوان الكتاب"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">اسم المؤلف *</Label>
              <Input
                id="author"
                placeholder="أدخل اسم المؤلف"
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">وصف الكتاب</Label>
              <Textarea
                id="description"
                placeholder="أدخل وصفاً للكتاب..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">التصنيف *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cover Upload */}
            <div className="space-y-2">
              <Label htmlFor="cover">صورة الغلاف</Label>
              <div className="relative">
                <input
                  type="file"
                  id="cover"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="cover"
                  className="flex items-center justify-center gap-3 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                >
                  {coverFile ? (
                    <div className="flex items-center gap-3">
                      <Image className="h-6 w-6 text-primary" />
                      <span className="text-foreground font-medium">
                        {coverFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <span className="text-sm text-muted-foreground">
                        اضغط لرفع صورة الغلاف
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* PDF Upload */}
            <div className="space-y-2">
              <Label htmlFor="pdf">ملف PDF *</Label>
              <div className="relative">
                <input
                  type="file"
                  id="pdf"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="pdf"
                  className="flex items-center justify-center gap-3 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                >
                  {pdfFile ? (
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-primary" />
                      <span className="text-foreground font-medium">
                        {pdfFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <span className="text-sm text-muted-foreground">
                        اضغط لرفع ملف PDF
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="featured">كتاب مميز</Label>
                <p className="text-sm text-muted-foreground">
                  سيظهر في قسم الكتب المميزة
                </p>
              </div>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked })
                }
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="gold"
            size="xl"
            className="w-full gap-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                حفظ الكتاب
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminUpload;
