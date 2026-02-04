-- Add page_count column to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS page_count integer;

-- Create user_notes table for personal notes feature
CREATE TABLE IF NOT EXISTS public.user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_notes
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notes
CREATE POLICY "Users can view their own notes" ON public.user_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" ON public.user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.user_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON public.user_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create book_ratings table for book ratings
CREATE TABLE IF NOT EXISTS public.book_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Enable RLS on book_ratings
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_ratings
CREATE POLICY "Anyone can view book ratings" ON public.book_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON public.book_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON public.book_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON public.book_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Create author_ratings table for author ratings
CREATE TABLE IF NOT EXISTS public.author_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(author_name, user_id)
);

-- Enable RLS on author_ratings
ALTER TABLE public.author_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for author_ratings
CREATE POLICY "Anyone can view author ratings" ON public.author_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create author ratings" ON public.author_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own author ratings" ON public.author_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own author ratings" ON public.author_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Add display_name and avatar_url to user_profiles if not exists
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS phone text;

-- Create storage bucket for user avatars if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_ratings_updated_at
  BEFORE UPDATE ON public.book_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_author_ratings_updated_at
  BEFORE UPDATE ON public.author_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();