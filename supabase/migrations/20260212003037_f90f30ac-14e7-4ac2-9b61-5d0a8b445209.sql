
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
ON public.notifications FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Function to notify all users when a new book is added
CREATE OR REPLACE FUNCTION public.notify_users_new_book()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  SELECT ur.user_id, 'كتاب جديد', 'تمت إضافة كتاب جديد: ' || NEW.title, 'new_book',
    jsonb_build_object('book_id', NEW.id, 'book_title', NEW.title)
  FROM public.user_roles ur;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_book_notify
AFTER INSERT ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_new_book();

-- Function to notify all users when a new store product is added
CREATE OR REPLACE FUNCTION public.notify_users_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  SELECT ur.user_id, 'منتج جديد في المتجر', 'تمت إضافة منتج جديد: ' || NEW.title, 'new_product',
    jsonb_build_object('product_id', NEW.id, 'product_title', NEW.title)
  FROM public.user_roles ur;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_product_notify
AFTER INSERT ON public.store_products
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_new_product();

-- Admin broadcast function
CREATE OR REPLACE FUNCTION public.send_admin_notification(_title TEXT, _message TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT ur.user_id, _title, _message, 'admin_broadcast'
  FROM public.user_roles ur;
END;
$$;
