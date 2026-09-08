
CREATE TABLE public.promo_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  media_url TEXT,
  youtube_url TEXT,
  link_url TEXT,
  link_label TEXT,
  book_ids UUID[] NOT NULL DEFAULT '{}',
  thumb_size TEXT NOT NULL DEFAULT 'medium',
  slot INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_blocks TO authenticated;
GRANT ALL ON public.promo_blocks TO service_role;

ALTER TABLE public.promo_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view promo blocks" ON public.promo_blocks FOR SELECT USING (true);
CREATE POLICY "Admins can insert promo blocks" ON public.promo_blocks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update promo blocks" ON public.promo_blocks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete promo blocks" ON public.promo_blocks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_promo_blocks_updated_at BEFORE UPDATE ON public.promo_blocks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS reading_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION public.add_reading_time(_seconds INTEGER)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _total INTEGER;
  _verified BOOLEAN;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _seconds IS NULL OR _seconds <= 0 OR _seconds > 600 THEN
    _seconds := 0;
  END IF;

  INSERT INTO public.user_profiles (user_id, username)
  VALUES (_uid, COALESCE((SELECT split_part(email,'@',1) FROM auth.users WHERE id = _uid), 'reader'))
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_profiles
  SET reading_seconds = reading_seconds + _seconds,
      updated_at = now()
  WHERE user_id = _uid
  RETURNING reading_seconds, verified INTO _total, _verified;

  IF NOT _verified AND _total >= 36000 THEN
    UPDATE public.user_profiles
    SET verified = true, verified_at = now()
    WHERE user_id = _uid;
    _verified := true;
  END IF;

  RETURN jsonb_build_object('reading_seconds', COALESCE(_total,0), 'verified', COALESCE(_verified,false));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_verified_badge(_user_id UUID, _value BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.user_profiles
  SET verified = _value,
      verified_at = CASE WHEN _value THEN now() ELSE NULL END,
      updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

UPDATE public.user_profiles p
SET verified = true, verified_at = now()
WHERE public.has_role(p.user_id, 'admin') AND verified = false;
