-- Create aggregated view for public comment like counts (hides user_id for privacy)
CREATE VIEW public.comment_like_counts_public
WITH (security_invoker = on) AS
SELECT 
  comment_id, 
  COUNT(*) as like_count
FROM public.comment_likes
GROUP BY comment_id;

-- Grant access to the public view
GRANT SELECT ON public.comment_like_counts_public TO anon, authenticated;

-- Update comment_likes RLS - restrict raw table to authenticated users only
DROP POLICY IF EXISTS "Anyone can read comment likes" ON public.comment_likes;

CREATE POLICY "Authenticated users can read comment likes" 
ON public.comment_likes FOR SELECT 
TO authenticated 
USING (true);