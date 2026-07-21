
-- Reader ID, XP, badges
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS reader_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_rank INT NOT NULL DEFAULT 1;

-- Assign a random 8-digit reader_id, admin gets 1
CREATE OR REPLACE FUNCTION public.assign_reader_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id BIGINT;
  _tries INT := 0;
BEGIN
  IF NEW.reader_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(NEW.user_id, 'admin') THEN
    NEW.reader_id := 1;
    RETURN NEW;
  END IF;
  LOOP
    _id := 10000000 + floor(random() * 89999999)::BIGINT;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE reader_id = _id);
    _tries := _tries + 1;
    IF _tries > 30 THEN
      RAISE EXCEPTION 'Could not assign unique reader_id';
    END IF;
  END LOOP;
  NEW.reader_id := _id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_reader_id ON public.user_profiles;
CREATE TRIGGER trg_assign_reader_id
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_reader_id();

-- Backfill existing rows
DO $$
DECLARE
  r RECORD;
  _id BIGINT;
BEGIN
  FOR r IN SELECT id, user_id FROM public.user_profiles WHERE reader_id IS NULL LOOP
    IF public.has_role(r.user_id, 'admin') THEN
      UPDATE public.user_profiles SET reader_id = 1 WHERE id = r.id;
    ELSE
      LOOP
        _id := 10000000 + floor(random() * 89999999)::BIGINT;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE reader_id = _id);
      END LOOP;
      UPDATE public.user_profiles SET reader_id = _id WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- Book quizzes
CREATE TABLE IF NOT EXISTS public.book_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL UNIQUE REFERENCES public.books(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.book_quizzes TO authenticated;
GRANT ALL ON public.book_quizzes TO service_role;
ALTER TABLE public.book_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes readable to authed"
  ON public.book_quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "quizzes admin insert"
  ON public.book_quizzes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "quizzes admin update"
  ON public.book_quizzes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "quizzes admin delete"
  ON public.book_quizzes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_book_quizzes_updated
  BEFORE UPDATE ON public.book_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total INT NOT NULL DEFAULT 10,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attempts self select"
  ON public.quiz_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "attempts self insert"
  ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_attempts_user_book ON public.quiz_attempts (user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_attempts_verified ON public.quiz_attempts (user_id) WHERE verified = true;

-- XP thresholds → badge_rank
CREATE OR REPLACE FUNCTION public.compute_badge_rank(_xp INT)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _xp >= 60000 THEN 20
    WHEN _xp >= 51000 THEN 19
    WHEN _xp >= 43000 THEN 18
    WHEN _xp >= 36000 THEN 17
    WHEN _xp >= 30000 THEN 16
    WHEN _xp >= 25000 THEN 15
    WHEN _xp >= 20500 THEN 14
    WHEN _xp >= 16500 THEN 13
    WHEN _xp >= 13000 THEN 12
    WHEN _xp >= 10000 THEN 11
    WHEN _xp >= 7500  THEN 10
    WHEN _xp >= 5500  THEN 9
    WHEN _xp >= 4000  THEN 8
    WHEN _xp >= 2750  THEN 7
    WHEN _xp >= 1750  THEN 6
    WHEN _xp >= 1000  THEN 5
    WHEN _xp >= 500   THEN 4
    WHEN _xp >= 250   THEN 3
    WHEN _xp >= 100   THEN 2
    ELSE 1
  END;
$$;

-- Award RPC
CREATE OR REPLACE FUNCTION public.award_quiz_result(
  _book_id UUID,
  _score INT,
  _answers JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _pages INT;
  _xp_gain INT := 0;
  _verified BOOLEAN := (_score >= 10);
  _already_verified BOOLEAN;
  _new_xp INT;
  _new_rank INT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  -- Ensure profile exists
  INSERT INTO public.user_profiles (user_id, username)
  VALUES (_uid, COALESCE((SELECT split_part(email,'@',1) FROM auth.users WHERE id = _uid), 'reader_' || substr(_uid::text,1,8)))
  ON CONFLICT (user_id) DO NOTHING;

  SELECT page_count INTO _pages FROM public.books WHERE id = _book_id;
  IF _verified THEN
    _xp_gain := CASE
      WHEN _pages IS NULL THEN 100
      WHEN _pages < 100 THEN 50
      WHEN _pages < 300 THEN 100
      ELSE 200
    END;

    SELECT EXISTS (
      SELECT 1 FROM public.quiz_attempts
      WHERE user_id = _uid AND book_id = _book_id AND verified = true
    ) INTO _already_verified;

    IF _already_verified THEN _xp_gain := 0; END IF;
  END IF;

  INSERT INTO public.quiz_attempts (user_id, book_id, score, answers, verified)
  VALUES (_uid, _book_id, _score, _answers, _verified);

  IF _xp_gain > 0 THEN
    UPDATE public.user_profiles
    SET xp = xp + _xp_gain,
        badge_rank = public.compute_badge_rank(xp + _xp_gain),
        updated_at = now()
    WHERE user_id = _uid
    RETURNING xp, badge_rank INTO _new_xp, _new_rank;
  ELSE
    SELECT xp, badge_rank INTO _new_xp, _new_rank
    FROM public.user_profiles WHERE user_id = _uid;
  END IF;

  RETURN jsonb_build_object(
    'verified', _verified,
    'score', _score,
    'xp_gain', _xp_gain,
    'xp', COALESCE(_new_xp, 0),
    'badge_rank', COALESCE(_new_rank, 1)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_quiz_result(UUID, INT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_badge_rank(INT) TO authenticated, anon;
