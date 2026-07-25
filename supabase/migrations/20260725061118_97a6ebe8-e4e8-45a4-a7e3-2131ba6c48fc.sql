
CREATE TABLE public.hero_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  cta_label TEXT,
  cta_url TEXT,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hero_banners TO authenticated;
GRANT ALL ON public.hero_banners TO service_role;

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled banners"
  ON public.hero_banners FOR SELECT
  USING (
    enabled = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "Admins can view all banners"
  ON public.hero_banners FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert banners"
  ON public.hero_banners FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banners"
  ON public.hero_banners FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners"
  ON public.hero_banners FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_hero_banners_updated_at
  BEFORE UPDATE ON public.hero_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
