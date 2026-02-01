-- Create store_products table for books available for purchase
CREATE TABLE public.store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  category TEXT NOT NULL,
  cover_url TEXT,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MRU',
  stock_quantity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Anyone can view available products
CREATE POLICY "Anyone can view available products"
ON public.store_products
FOR SELECT
USING (is_available = true);

-- Admins can manage all products
CREATE POLICY "Admins can manage products"
ON public.store_products
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create orders table
CREATE TABLE public.store_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES public.store_products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.store_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create orders"
ON public.store_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all orders
CREATE POLICY "Admins can manage orders"
ON public.store_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_store_products_updated_at
BEFORE UPDATE ON public.store_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_orders_updated_at
BEFORE UPDATE ON public.store_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for store covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-covers', 'store-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for store covers
CREATE POLICY "Anyone can view store covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-covers');

CREATE POLICY "Admins can upload store covers"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'store-covers' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update store covers"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'store-covers' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete store covers"
ON storage.objects
FOR DELETE
USING (bucket_id = 'store-covers' AND has_role(auth.uid(), 'admin'));