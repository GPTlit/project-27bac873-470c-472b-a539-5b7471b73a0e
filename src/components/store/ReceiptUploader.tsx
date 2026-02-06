import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReceiptUploaderProps {
  receiptUrl: string | null; // This is now the file path, not a public URL
  onUpload: (path: string) => void;
  onRemove: () => void;
}

export const ReceiptUploader = ({ receiptUrl, onUpload, onRemove }: ReceiptUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get signed URL for display when receiptUrl (file path) changes
  useEffect(() => {
    const getSignedUrl = async () => {
      if (!receiptUrl) {
        setSignedUrl(null);
        return;
      }

      // If it's already a full URL (legacy data), use it directly
      if (receiptUrl.startsWith('http')) {
        setSignedUrl(receiptUrl);
        return;
      }

      // Create a signed URL for the private file
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(receiptUrl, 3600); // 1 hour expiry

      if (error) {
        console.error('Error getting signed URL:', error);
        return;
      }

      setSignedUrl(data.signedUrl);
    };

    getSignedUrl();
  }, [receiptUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صورة فقط',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store just the file path (not a public URL) since bucket is now private
      // The path will be used to create signed URLs when displaying
      onUpload(fileName);
      toast({
        title: 'تم الرفع',
        description: 'تم رفع صورة الإيصال بنجاح',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء رفع الصورة',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">صورة إيصال الدفع</p>
      
      {receiptUrl && signedUrl ? (
        <div className="relative">
          <img
            src={signedUrl}
            alt="إيصال الدفع"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">جاري الرفع...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">انقر لرفع صورة الإيصال</p>
              <p className="text-xs text-muted-foreground">PNG, JPG حتى 5MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};