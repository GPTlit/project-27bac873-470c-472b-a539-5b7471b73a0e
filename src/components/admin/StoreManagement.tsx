import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAllStoreProducts, StoreProduct } from '@/hooks/useStoreProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { allCategories } from '@/hooks/useCategories';
import { Plus, Pencil, Trash2, Image, Loader2, ShoppingBag, Package } from 'lucide-react';

export const StoreManagement = () => {
  const { data: products, refetch } = useAllStoreProducts();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    price: '',
    stock_quantity: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      category: '',
      price: '',
      stock_quantity: '',
    });
    setCoverFile(null);
  };

  const handleAddProduct = async () => {
    if (!formData.title || !formData.category || !formData.price) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let coverUrl = null;
      
      if (coverFile) {
        const fileName = `${Date.now()}-${coverFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('store-covers')
          .upload(fileName, coverFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('store-covers')
          .getPublicUrl(fileName);

        coverUrl = urlData.publicUrl;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('store_products')
        .insert({
          title: formData.title,
          author: formData.author || null,
          description: formData.description || null,
          category: formData.category,
          price: parseFloat(formData.price),
          stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
          cover_url: coverUrl,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'تمت الإضافة',
        description: 'تم إضافة المنتج بنجاح',
      });

      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Add product error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إضافة المنتج',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    if (!formData.title || !formData.category || !formData.price) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let coverUrl = editingProduct.cover_url;
      
      if (coverFile) {
        const fileName = `${Date.now()}-${coverFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('store-covers')
          .upload(fileName, coverFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('store-covers')
          .getPublicUrl(fileName);

        coverUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('store_products')
        .update({
          title: formData.title,
          author: formData.author || null,
          description: formData.description || null,
          category: formData.category,
          price: parseFloat(formData.price),
          stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
          cover_url: coverUrl,
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المنتج بنجاح',
      });

      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Edit product error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث المنتج',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('store_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنتج بنجاح',
      });

      refetch();
    } catch (error) {
      console.error('Delete product error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف المنتج',
        variant: 'destructive',
      });
    }
  };

  const toggleAvailability = async (product: StoreProduct) => {
    try {
      const { error } = await supabase
        .from('store_products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: product.is_available ? 'تم إخفاء المنتج' : 'تم إظهار المنتج',
      });

      refetch();
    } catch (error) {
      console.error('Toggle availability error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث حالة المنتج',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (product: StoreProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      author: product.author || '',
      description: product.description || '',
      category: product.category,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryName = (categoryKey: string) => {
    const cat = allCategories.find(c => c.name === categoryKey);
    return cat ? `${cat.icon} ${cat.nameAr}` : categoryKey;
  };

  const ProductForm = ({ onSubmit }: { onSubmit: () => void }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">عنوان الكتاب *</Label>
        <Input
          id="title"
          placeholder="أدخل عنوان الكتاب"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author">اسم المؤلف</Label>
        <Input
          id="author"
          placeholder="أدخل اسم المؤلف"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">وصف الكتاب</Label>
        <Textarea
          id="description"
          placeholder="أدخل وصفاً للكتاب..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

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
            {allCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.icon} {cat.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">السعر (MRU) *</Label>
          <Input
            id="price"
            type="number"
            placeholder="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">الكمية المتاحة</Label>
          <Input
            id="stock"
            type="number"
            placeholder="0"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
          />
        </div>
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
            className="flex items-center justify-center gap-3 h-20 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            {coverFile ? (
              <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-primary" />
                <span className="text-sm">{coverFile.name}</span>
              </div>
            ) : (
              <div className="text-center">
                <Image className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <span className="text-xs text-muted-foreground">اضغط لرفع صورة الغلاف</span>
              </div>
            )}
          </label>
        </div>
      </div>

      <Button
        className="w-full gap-2"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          إدارة المتجر
        </h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Button>
      </div>

      {/* Products List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {products && products.length > 0 ? (
            products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-28 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {product.cover_url ? (
                        <img
                          src={product.cover_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                          {product.author && (
                            <p className="text-sm text-muted-foreground">{product.author}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {product.price} MRU
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(product.category)}
                        </Badge>
                        <Badge 
                          variant={product.is_available ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {product.is_available ? 'متاح' : 'غير متاح'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Switch
                          checked={product.is_available ?? true}
                          onCheckedChange={() => toggleAvailability(product)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {product.is_available ? 'متاح للبيع' : 'مخفي'}
                        </span>
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لم تتم إضافة منتجات بعد</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
          </DialogHeader>
          <ProductForm onSubmit={handleAddProduct} />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
          </DialogHeader>
          <ProductForm onSubmit={handleEditProduct} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
