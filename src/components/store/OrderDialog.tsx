import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StoreProduct } from '@/hooks/useStoreProducts';
import { PaymentMethodSelector, PaymentMethod } from './PaymentMethodSelector';
import { ReceiptUploader } from './ReceiptUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Loader2, ShoppingCart, CheckCircle, ArrowLeft } from 'lucide-react';

interface OrderFormData {
  customerName: string;
  customerPhone: string;
  whatsappNumber: string;
  customerAddress: string;
  notes: string;
  quantity: number;
  paymentMethod: PaymentMethod | null;
  receiptUrl: string | null;
}

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: StoreProduct | null;
}

export const OrderDialog = ({ open, onOpenChange, product }: OrderDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'payment' | 'info' | 'success'>('payment');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerPhone: '',
    whatsappNumber: '',
    customerAddress: '',
    notes: '',
    quantity: 1,
    paymentMethod: null,
    receiptUrl: null,
  });

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      whatsappNumber: '',
      customerAddress: '',
      notes: '',
      quantity: 1,
      paymentMethod: null,
      receiptUrl: null,
    });
    setStep('payment');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const handleNextStep = () => {
    if (!formData.paymentMethod) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار طريقة الدفع',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.receiptUrl) {
      toast({
        title: 'خطأ',
        description: 'يرجى رفع صورة إيصال الدفع',
        variant: 'destructive',
      });
      return;
    }
    setStep('info');
  };

  const handleSubmit = async () => {
    if (!product) return;

    if (!formData.customerName.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسمك الكامل',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رقم هاتفك',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.whatsappNumber.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رقم الواتساب',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('store_orders')
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: formData.quantity,
          total_price: product.price * formData.quantity,
          customer_name: formData.customerName.trim(),
          customer_phone: formData.customerPhone.trim(),
          customer_address: formData.customerAddress.trim(),
          notes: formData.notes.trim(),
          payment_method: formData.paymentMethod,
          receipt_url: formData.receiptUrl,
          whatsapp_number: formData.whatsappNumber.trim(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Get a signed URL for the receipt to share with the admin
      let receiptDisplayUrl = formData.receiptUrl;
      if (formData.receiptUrl && !formData.receiptUrl.startsWith('http')) {
        // It's a file path, create a long-lived signed URL for admin access
        const { data: signedData, error: signError } = await supabase.storage
          .from('payment-receipts')
          .createSignedUrl(formData.receiptUrl, 86400 * 7); // 7 days expiry for admin review
        
        if (!signError && signedData) {
          receiptDisplayUrl = signedData.signedUrl;
        }
      }

      // Send WhatsApp notification to library owner
      const whatsappMessage = `📦 طلب جديد من المتجر:

📚 الكتاب: ${product.title}
${product.author ? `✍️ المؤلف: ${product.author}` : ''}
💰 السعر: ${product.price * formData.quantity} MRU
📊 الكمية: ${formData.quantity}

👤 معلومات العميل:
الاسم: ${formData.customerName}
📱 الهاتف: ${formData.customerPhone}
📲 واتساب: ${formData.whatsappNumber}
${formData.customerAddress ? `📍 العنوان: ${formData.customerAddress}` : ''}

💳 طريقة الدفع: ${getPaymentMethodName(formData.paymentMethod!)}
🧾 إيصال الدفع: ${receiptDisplayUrl}
${formData.notes ? `📝 ملاحظات: ${formData.notes}` : ''}`;

      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/22226749039?text=${encodedMessage}`;

      // Open WhatsApp in background (the library will receive notification)
      window.open(whatsappUrl, '_blank');

      setStep('success');
    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال الطلب',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentMethodName = (method: PaymentMethod): string => {
    const names: Record<PaymentMethod, string> = {
      bankily: 'بنكيلي',
      sedad: 'السداد',
      masrivi: 'مصرفي',
      bimbank: 'بيم بنك',
    };
    return names[method];
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'payment' && 'طلب كتاب - الدفع'}
            {step === 'info' && 'طلب كتاب - المعلومات'}
            {step === 'success' && 'تم الطلب بنجاح'}
          </DialogTitle>
          <DialogDescription>
            {step === 'payment' && 'اختر طريقة الدفع وارفع صورة الإيصال للمتابعة'}
            {step === 'info' && 'أدخل معلومات التواصل لإتمام الطلب'}
            {step === 'success' && 'شكراً لك على طلبك'}
          </DialogDescription>
        </DialogHeader>

        {/* Product Info */}
        {step !== 'success' && (
          <div className="flex gap-4 p-3 bg-muted rounded-lg">
            {product.cover_url ? (
              <img
                src={product.cover_url}
                alt={product.title}
                className="w-16 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-20 bg-background rounded flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-2">{product.title}</h3>
              {product.author && (
                <p className="text-sm text-muted-foreground">{product.author}</p>
              )}
              <p className="text-primary font-bold mt-1">
                {product.price * formData.quantity} MRU
              </p>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <div className="space-y-4">
            <PaymentMethodSelector
              selected={formData.paymentMethod}
              onSelect={(method) => setFormData({ ...formData, paymentMethod: method })}
            />

            <ReceiptUploader
              receiptUrl={formData.receiptUrl}
              onUpload={(url) => setFormData({ ...formData, receiptUrl: url })}
              onRemove={() => setFormData({ ...formData, receiptUrl: null })}
            />

            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <div className={`h-3 w-3 rounded-full ${formData.paymentMethod ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
              <span className={formData.paymentMethod ? 'text-foreground' : 'text-muted-foreground'}>
                {formData.paymentMethod ? '✓ تم اختيار طريقة الدفع' : 'اختر طريقة الدفع'}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <div className={`h-3 w-3 rounded-full ${formData.receiptUrl ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
              <span className={formData.receiptUrl ? 'text-foreground' : 'text-muted-foreground'}>
                {formData.receiptUrl ? '✓ تم رفع صورة الإيصال' : 'ارفع صورة إيصال الدفع'}
              </span>
            </div>

            <Button
              variant="gold"
              className="w-full gap-2"
              onClick={handleNextStep}
              disabled={!formData.paymentMethod || !formData.receiptUrl}
            >
              <ArrowLeft className="h-4 w-4" />
              التالي - إدخال المعلومات
            </Button>
          </div>
        )}

        {/* Info Step */}
        {step === 'info' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">الاسم الكامل *</Label>
              <Input
                id="customerName"
                placeholder="أدخل اسمك الكامل"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">رقم الهاتف *</Label>
              <Input
                id="customerPhone"
                placeholder="أدخل رقم هاتفك"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">رقم الواتساب *</Label>
              <Input
                id="whatsappNumber"
                placeholder="أدخل رقم الواتساب"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">العنوان</Label>
              <Input
                id="customerAddress"
                placeholder="أدخل عنوانك للتوصيل"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                placeholder="أي ملاحظات إضافية..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">الإجمالي:</span>
                <span className="text-xl font-bold text-primary">
                  {product.price * formData.quantity} MRU
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('payment')}
              >
                رجوع
              </Button>
              <Button
                variant="gold"
                className="flex-1 gap-2"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                تأكيد الطلب
              </Button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">تم استلام طلبك بنجاح!</h3>
              <p className="text-muted-foreground text-sm">
                سنتواصل معك قريباً عبر الواتساب لتأكيد الطلب والتنسيق معك.
              </p>
            </div>
            <Button
              variant="gold"
              className="w-full"
              onClick={handleClose}
            >
              حسناً
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
