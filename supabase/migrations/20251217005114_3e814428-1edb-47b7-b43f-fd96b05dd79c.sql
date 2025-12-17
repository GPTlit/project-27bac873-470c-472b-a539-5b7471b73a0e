-- Add parent_id column for threaded replies
ALTER TABLE public.comments ADD COLUMN parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create index for faster reply queries
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);