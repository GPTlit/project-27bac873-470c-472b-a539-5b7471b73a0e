ALTER TABLE public.hero_banners
  ADD COLUMN IF NOT EXISTS book_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS thumb_size text NOT NULL DEFAULT 'medium';

CREATE OR REPLACE FUNCTION public.validate_hero_banner_thumb_size()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.thumb_size NOT IN ('small','medium','large') THEN
    RAISE EXCEPTION 'thumb_size must be small, medium or large';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hero_banners_thumb_size ON public.hero_banners;
CREATE TRIGGER trg_hero_banners_thumb_size
BEFORE INSERT OR UPDATE ON public.hero_banners
FOR EACH ROW EXECUTE FUNCTION public.validate_hero_banner_thumb_size();