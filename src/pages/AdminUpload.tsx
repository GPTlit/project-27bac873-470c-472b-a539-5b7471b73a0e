import { useState } from 'react';
import { Shield, Upload, FileText, Image, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useBooks } from '@/hooks/useBooks';

const AdminUpload = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
  });
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { data: books, refetch } = useBooks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.author || !formData.category || !bookFile) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload book file
      const bookFileName = `${Date.now()}-${bookFile.name}`;
      const { error: bookUploadError } = await supabase.storage
        .from('books')
        .upload(bookFileName, bookFile);

      if (bookUploadError) throw bookUploadError;

      const { data: bookUrlData } = supabase.storage
        .from('books')
        .getPublicUrl(bookFileName);

      // Upload cover if provided
      let coverUrl = null;
      if (coverFile) {
        const coverFileName = `${Date.now()}-${coverFile.name}`;
        const { error: coverUploadError } = await supabase.storage
          .from('covers')
          .upload(coverFileName, coverFile);

        if (coverUploadError) throw coverUploadError;

        const { data: coverUrlData } = supabase.storage
          .from('covers')
          .getPublicUrl(coverFileName);

        coverUrl = coverUrlData.publicUrl;
      }

      // Get file extension
      const fileType = bookFile.name.split('.').pop()?.toLowerCase() || 'pdf';

      // Insert book record
      const { error: insertError } = await supabase
        .from('books')
        .insert({
          title: formData.title,
          author: formData.author,
          description: formData.description || null,
          category: formData.category,
          cover_url: coverUrl,
          file_url: bookUrlData.publicUrl,
          file_type: fileType,
        });

      if (insertError) throw insertError;

      toast({
        title: 'تم الرفع بنجاح',
        description: 'تم إضافة الكتاب للمكتبة',
      });

      // Reset form
      setFormData({ title: '', author: '', description: '', category: '' });
      setBookFile(null);
      setCoverFile(null);
      refetch();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء رفع الكتاب',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الكتاب بنجاح',
      });
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الكتاب',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-6">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              لوحة تحكم المشرف
            </h1>
            <p className="text-muted-foreground">
              رفع وإدارة كتب المكتبة
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="card-cozy p-6 space-y-6">
                <h2 className="text-xl font-bold text-foreground">رفع كتاب جديد</h2>
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الكتاب *</Label>
                  <Input
                    id="title"
                    placeholder="أدخل عنوان الكتاب"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                          <span className="text-foreground font-medium">{coverFile.name}</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Image className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">اضغط لرفع صورة الغلاف</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Book File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="bookFile">ملف الكتاب (PDF, TXT, EPUB) *</Label>
                  <div className="relative">
                    <input
                      type="file"
                      id="bookFile"
                      accept=".pdf,.txt,.epub,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="bookFile"
                      className="flex items-center justify-center gap-3 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                    >
                      {bookFile ? (
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-primary" />
                          <span className="text-foreground font-medium">{bookFile.name}</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">اضغط لرفع ملف الكتاب</span>
                        </div>
                      )}
                    </label>
                  </div>
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

            {/* Books List */}
            <div className="card-cozy p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">الكتب الموجودة ({books?.length || 0})</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {books?.map((book) => (
                  <div key={book.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{book.title}</p>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDelete(book.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!books || books.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">لا توجد كتب بعد</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUpload;
