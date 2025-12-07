import { useState } from 'react';
import { Upload as UploadIcon, Send, FileText, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const Upload = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    note: '',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
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

    // Simulate submission (in production, this would upload to storage and send to WhatsApp)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset form after showing success
    setTimeout(() => {
      setFormData({ title: '', author: '', category: '', note: '' });
      setPdfFile(null);
      setIsSuccess(false);
    }, 5000);
  };

  if (isSuccess) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-library max-w-xl">
            <div className="text-center py-16 animate-scale-in">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                شكراً لمساهمتك!
              </h1>
              <p className="text-muted-foreground text-lg">
                سيتم مراجعة كتابك ونشره خلال 24 ساعة.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library max-w-xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gold-gradient mb-6">
              <UploadIcon className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              أرسل كتاباً
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              شارك معرفتك مع الآخرين. أرسل كتاباً وسنقوم بمراجعته ونشره خلال 24 ساعة.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                        <UploadIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <span className="text-sm text-muted-foreground">
                          اضغط لرفع ملف PDF
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note">ملاحظة (اختياري)</Label>
                <Textarea
                  id="note"
                  placeholder="أضف ملاحظة أو وصف للكتاب..."
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  rows={3}
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
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  إرسال الكتاب
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Upload;
