import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureToggles, useActiveTheme, useInvalidateConfig } from '@/hooks/useAppConfig';
import { useBooks, Book } from '@/hooks/useBooks';
import { allCategories } from '@/hooks/useCategories';
import { Bot, Send, Loader2, Settings, Palette, ToggleLeft, Sparkles, Upload, FileText, Image, Save, Trash2, Pencil, X } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AdminPanel = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const invalidateConfig = useInvalidateConfig();

  // Book upload state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    categories: [] as string[],
  });
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { data: books, refetch: refetchBooks } = useBooks();

  // Edit state
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    author: '',
    description: '',
    categories: [] as string[],
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: features, refetch: refetchFeatures } = useFeatureToggles();
  const { data: theme, refetch: refetchTheme } = useActiveTheme();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseAndExecuteActions = async (aiMessage: string) => {
    const actionRegex = /```action\n([\s\S]*?)\n```/g;
    let match;
    const actions: any[] = [];

    while ((match = actionRegex.exec(aiMessage)) !== null) {
      try {
        const action = JSON.parse(match[1]);
        actions.push(action);
      } catch (e) {
        console.error('Failed to parse action:', e);
      }
    }

    for (const action of actions) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ executeAction: action }),
          }
        );

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: 'تم التنفيذ',
            description: result.message,
          });
          invalidateConfig();
          refetchFeatures();
          refetchTheme();
        } else {
          toast({
            title: 'خطأ',
            description: result.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Action execution failed:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: ChatMessage = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, aiMessage]);

      await parseAndExecuteActions(data.message);

    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء التواصل مع المساعد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_toggles')
        .update({ enabled })
        .eq('feature_key', featureKey);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: `تم ${enabled ? 'تفعيل' : 'تعطيل'} الميزة`,
      });

      refetchFeatures();
      invalidateConfig();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatMessage = (content: string) => {
    return content.replace(/```action\n[\s\S]*?\n```/g, '').trim();
  };

  const toggleCategory = (categoryName: string, isEdit = false) => {
    if (isEdit) {
      setEditFormData(prev => ({
        ...prev,
        categories: prev.categories.includes(categoryName)
          ? prev.categories.filter(c => c !== categoryName)
          : [...prev.categories, categoryName]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.includes(categoryName)
          ? prev.categories.filter(c => c !== categoryName)
          : [...prev.categories, categoryName]
      }));
    }
  };

  // Book upload handlers
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.author || formData.categories.length === 0 || !bookFile) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة واختيار تصنيف واحد على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const bookFileName = `${Date.now()}-${bookFile.name}`;
      const { error: bookUploadError } = await supabase.storage
        .from('books')
        .upload(bookFileName, bookFile);

      if (bookUploadError) throw bookUploadError;

      const { data: bookUrlData } = supabase.storage
        .from('books')
        .getPublicUrl(bookFileName);

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

      const fileType = bookFile.name.split('.').pop()?.toLowerCase() || 'pdf';

      const { error: insertError } = await supabase
        .from('books')
        .insert({
          title: formData.title,
          author: formData.author,
          description: formData.description || null,
          category: formData.categories[0], // Keep first category for backward compatibility
          categories: formData.categories,
          cover_url: coverUrl,
          file_url: bookUrlData.publicUrl,
          file_type: fileType,
        });

      if (insertError) throw insertError;

      toast({
        title: 'تم الرفع بنجاح',
        description: 'تم إضافة الكتاب للمكتبة',
      });

      setFormData({ title: '', author: '', description: '', categories: [] });
      setBookFile(null);
      setCoverFile(null);
      refetchBooks();
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
      refetchBooks();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الكتاب',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setEditFormData({
      title: book.title,
      author: book.author,
      description: book.description || '',
      categories: book.categories || (book.category ? [book.category] : []),
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingBook) return;

    if (!editFormData.title || !editFormData.author || editFormData.categories.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('books')
        .update({
          title: editFormData.title,
          author: editFormData.author,
          description: editFormData.description || null,
          category: editFormData.categories[0],
          categories: editFormData.categories,
        })
        .eq('id', editingBook.id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات الكتاب بنجاح',
      });

      setIsEditDialogOpen(false);
      setEditingBook(null);
      refetchBooks();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الكتاب',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">لوحة التحكم الذكية</h1>
            <p className="text-muted-foreground">إدارة التطبيق بمساعدة الذكاء الاصطناعي</p>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 h-auto p-2 bg-muted">
            <TabsTrigger value="upload" className="flex items-center gap-2 px-4 py-2">
              <Upload className="h-4 w-4" />
              رفع الكتب
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2 px-4 py-2">
              <Bot className="h-4 w-4" />
              المساعد الذكي
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2 px-4 py-2">
              <ToggleLeft className="h-4 w-4" />
              الميزات
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2 px-4 py-2">
              <Palette className="h-4 w-4" />
              المظهر
            </TabsTrigger>
          </TabsList>

          {/* Book Upload Tab */}
          <TabsContent value="upload">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>رفع كتاب جديد</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookSubmit} className="space-y-6">
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

                    <div className="space-y-2">
                      <Label>التصنيفات * (اختر واحد أو أكثر)</Label>
                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {allCategories.map((cat) => (
                            <div key={cat.id} className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id={`cat-${cat.id}`}
                                checked={formData.categories.includes(cat.name)}
                                onCheckedChange={() => toggleCategory(cat.name)}
                              />
                              <label
                                htmlFor={`cat-${cat.id}`}
                                className="text-sm cursor-pointer flex items-center gap-1"
                              >
                                <span>{cat.icon}</span>
                                <span>{cat.nameAr}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      {formData.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.categories.map(catName => {
                            const cat = allCategories.find(c => c.name === catName);
                            return cat ? (
                              <Badge key={catName} variant="secondary" className="gap-1">
                                {cat.icon} {cat.nameAr}
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(catName)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

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

                    <Button
                      type="submit"
                      className="w-full gap-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الكتب الموجودة ({books?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {books?.map((book) => (
                        <div key={book.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{book.title}</p>
                            <p className="text-sm text-muted-foreground">{book.author}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(book.categories || [book.category]).filter(Boolean).slice(0, 3).map(cat => {
                                const category = allCategories.find(c => c.name === cat);
                                return (
                                  <Badge key={cat} variant="outline" className="text-xs">
                                    {category?.icon} {category?.nameAr || cat}
                                  </Badge>
                                );
                              })}
                              {(book.categories?.length || 0) > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(book.categories?.length || 0) - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary hover:text-primary"
                              onClick={() => openEditDialog(book)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(book.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(!books || books.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">لا توجد كتب بعد</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  مساعد الإدارة الذكي
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <Bot className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">مرحباً بك في لوحة التحكم الذكية</h3>
                      <p className="text-muted-foreground max-w-md">
                        يمكنني مساعدتك في تعديل التطبيق. جرّب أن تقول:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => setInput('فعّل ميزة التعليقات')}>
                          فعّل ميزة التعليقات
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => setInput('غيّر اللون الرئيسي إلى أزرق داكن')}>
                          غيّر اللون الرئيسي
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => setInput('أضف قسم التقييمات لصفحة الكتاب')}>
                          أضف قسم التقييمات
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{formatMessage(msg.content)}</p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-end">
                          <div className="bg-muted rounded-2xl px-4 py-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="اكتب أمراً للمساعد الذكي..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>الميزات المتاحة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features?.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{getFeatureLabel(feature.feature_key)}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={(checked) => toggleFeature(feature.feature_key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المظهر</CardTitle>
              </CardHeader>
              <CardContent>
                {theme && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4">الألوان الحالية</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(theme.colors || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div
                              className="w-10 h-10 rounded-lg border"
                              style={{ backgroundColor: `hsl(${value})` }}
                            />
                            <div>
                              <p className="font-medium">{getColorLabel(key)}</p>
                              <p className="text-xs text-muted-foreground">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">الخطوط</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(theme.fonts || {}).map(([key, value]) => (
                          <div key={key} className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">{key === 'heading' ? 'العناوين' : 'النص'}</p>
                            <p className="font-medium" style={{ fontFamily: value }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      استخدم المساعد الذكي لتغيير الألوان والخطوط. مثال: "غيّر اللون الرئيسي إلى أخضر"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Book Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل الكتاب</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">عنوان الكتاب *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-author">اسم المؤلف *</Label>
                <Input
                  id="edit-author"
                  value={editFormData.author}
                  onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">وصف الكتاب</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>التصنيفات *</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    {allCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`edit-cat-${cat.id}`}
                          checked={editFormData.categories.includes(cat.name)}
                          onCheckedChange={() => toggleCategory(cat.name, true)}
                        />
                        <label
                          htmlFor={`edit-cat-${cat.id}`}
                          className="text-sm cursor-pointer flex items-center gap-1"
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.nameAr}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'حفظ التعديلات'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

function getFeatureLabel(key: string): string {
  const labels: Record<string, string> = {
    comments: 'التعليقات',
    book_likes: 'الإعجاب بالكتب',
    comment_likes: 'الإعجاب بالتعليقات',
    premium_content: 'المحتوى المميز',
    audiobooks: 'الكتب الصوتية',
    ratings: 'التقييمات',
    related_books: 'الكتب ذات الصلة',
  };
  return labels[key] || key;
}

function getColorLabel(key: string): string {
  const labels: Record<string, string> = {
    primary: 'الرئيسي',
    secondary: 'الثانوي',
    accent: 'اللون المميز',
    background: 'الخلفية',
    foreground: 'النص',
  };
  return labels[key] || key;
}

export default AdminPanel;
