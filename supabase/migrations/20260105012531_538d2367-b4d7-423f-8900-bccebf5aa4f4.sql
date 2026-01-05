-- Add categories array column to books table (keeping existing category for backward compatibility)
ALTER TABLE public.books ADD COLUMN categories text[] DEFAULT '{}';

-- Migrate existing category data to categories array
UPDATE public.books SET categories = ARRAY[category] WHERE category IS NOT NULL AND category != '';

-- Create index for better performance on categories array queries
CREATE INDEX idx_books_categories ON public.books USING GIN(categories);