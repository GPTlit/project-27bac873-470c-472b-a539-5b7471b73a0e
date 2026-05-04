
-- Highlights
CREATE TABLE public.book_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL,
  user_id uuid NOT NULL,
  page integer NOT NULL,
  text text NOT NULL,
  color text DEFAULT 'yellow',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.book_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read highlights" ON public.book_highlights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own highlights" ON public.book_highlights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own highlights" ON public.book_highlights FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_highlights_book ON public.book_highlights(book_id, created_at DESC);

-- Reading sessions (presence)
CREATE TABLE public.reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL,
  user_id uuid NOT NULL,
  city text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sessions" ON public.reading_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users upsert own session" ON public.reading_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own session" ON public.reading_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own session" ON public.reading_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_sessions_book_seen ON public.reading_sessions(book_id, last_seen_at DESC);

-- Reading journeys (guestbook)
CREATE TABLE public.reading_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL,
  user_id uuid NOT NULL,
  started_at date,
  finished_at date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);
ALTER TABLE public.reading_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read journeys" ON public.reading_journeys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own journey" ON public.reading_journeys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own journey" ON public.reading_journeys FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own journey" ON public.reading_journeys FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_journeys_updated BEFORE UPDATE ON public.reading_journeys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Book layers (curated content per book)
CREATE TABLE public.book_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL,
  layer_type text NOT NULL CHECK (layer_type IN ('quotes','summary','analysis','secrets')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, layer_type)
);
ALTER TABLE public.book_layers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read layers" ON public.book_layers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage layers" ON public.book_layers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Layer unlocks
CREATE TABLE public.book_layer_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL,
  user_id uuid NOT NULL,
  layer_type text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id, layer_type)
);
ALTER TABLE public.book_layer_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own unlocks" ON public.book_layer_unlocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own unlocks" ON public.book_layer_unlocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Ambient preferences
CREATE TABLE public.ambient_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid,
  sound_key text NOT NULL,
  volume numeric DEFAULT 0.4,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);
ALTER TABLE public.ambient_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ambient" ON public.ambient_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_highlights;
