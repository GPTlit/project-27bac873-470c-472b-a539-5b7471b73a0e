ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS cover_wide_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_tall_url TEXT;