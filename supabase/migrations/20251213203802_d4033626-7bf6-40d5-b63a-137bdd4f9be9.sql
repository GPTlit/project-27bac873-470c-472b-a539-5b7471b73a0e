-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy for users to read their own roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create books table
CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cover_url TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT DEFAULT 'pdf',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Everyone can read books (public library)
CREATE POLICY "Anyone can read books"
ON public.books
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert books
CREATE POLICY "Admins can insert books"
ON public.books
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update books
CREATE POLICY "Admins can update books"
ON public.books
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete books
CREATE POLICY "Admins can delete books"
ON public.books
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create user submissions table
CREATE TABLE public.book_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    file_url TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on submissions
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;

-- Users can create submissions
CREATE POLICY "Authenticated users can submit books"
ON public.book_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can see their own submissions
CREATE POLICY "Users can see their own submissions"
ON public.book_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for book files
INSERT INTO storage.buckets (id, name, public) VALUES ('books', 'books', true);

-- Create storage bucket for covers
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);

-- Create storage bucket for user submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true);

-- Storage policies for books bucket
CREATE POLICY "Anyone can read book files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'books');

CREATE POLICY "Admins can upload book files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for covers bucket
CREATE POLICY "Anyone can read covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Admins can upload covers"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for submissions bucket
CREATE POLICY "Authenticated users can upload submissions"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can read submissions"
ON storage.objects
FOR SELECT
USING (bucket_id = 'submissions');

-- Function to auto-create user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for books timestamp
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();