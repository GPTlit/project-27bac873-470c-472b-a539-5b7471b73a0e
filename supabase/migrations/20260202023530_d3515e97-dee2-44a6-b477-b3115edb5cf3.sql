-- Add payment method and receipt columns to store_orders
ALTER TABLE public.store_orders 
ADD COLUMN payment_method text,
ADD COLUMN receipt_url text,
ADD COLUMN whatsapp_number text;

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload receipts
CREATE POLICY "Users can upload receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

-- Allow users to view their own receipts
CREATE POLICY "Users can view their receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins to view all receipts
CREATE POLICY "Admins can view all receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-receipts' AND has_role(auth.uid(), 'admin'));