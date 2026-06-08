
-- =========================================================
-- Wattpad-style stories platform
-- =========================================================

-- 1) STORIES
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  language TEXT DEFAULT 'ar',
  mature BOOLEAN NOT NULL DEFAULT false,
  copyright TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published stories" ON public.stories
  FOR SELECT USING (status = 'published' OR auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authors can insert their stories" ON public.stories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their stories" ON public.stories
  FOR UPDATE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authors can delete their stories" ON public.stories
  FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER stories_updated_at BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX stories_author_idx ON public.stories(author_id);
CREATE INDEX stories_status_idx ON public.stories(status, published_at DESC);

-- 2) STORY PARTS
CREATE TABLE public.story_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT 'الجزء الجديد',
  content TEXT NOT NULL DEFAULT '',
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.story_parts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_parts TO authenticated;
GRANT ALL ON public.story_parts TO service_role;
ALTER TABLE public.story_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published parts of published stories" ON public.story_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_parts.story_id
        AND (
          (s.status = 'published' AND story_parts.published = true)
          OR s.author_id = auth.uid()
          OR public.has_role(auth.uid(),'admin')
        )
    )
  );
CREATE POLICY "Authors insert their parts" ON public.story_parts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_id = auth.uid())
  );
CREATE POLICY "Authors update their parts" ON public.story_parts
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND (s.author_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Authors delete their parts" ON public.story_parts
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND (s.author_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

CREATE TRIGGER story_parts_updated_at BEFORE UPDATE ON public.story_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX story_parts_story_idx ON public.story_parts(story_id, order_index);

-- 3) STORY FOLLOWS
CREATE TABLE public.story_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, author_id)
);
GRANT SELECT ON public.story_follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.story_follows TO authenticated;
GRANT ALL ON public.story_follows TO service_role;
ALTER TABLE public.story_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are public" ON public.story_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.story_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.story_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE INDEX story_follows_author_idx ON public.story_follows(author_id);
CREATE INDEX story_follows_follower_idx ON public.story_follows(follower_id);

-- 4) STORY COMMENTS (threaded)
CREATE TABLE public.story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID NOT NULL REFERENCES public.story_parts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.story_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.story_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_comments TO authenticated;
GRANT ALL ON public.story_comments TO service_role;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads comments" ON public.story_comments FOR SELECT USING (true);
CREATE POLICY "Authed can comment" ON public.story_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner edits comment" ON public.story_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner or admin deletes" ON public.story_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER story_comments_updated_at BEFORE UPDATE ON public.story_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX story_comments_part_idx ON public.story_comments(part_id);

-- 5) STORY LIKES
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);
GRANT SELECT ON public.story_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.story_likes TO authenticated;
GRANT ALL ON public.story_likes TO service_role;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are public" ON public.story_likes FOR SELECT USING (true);
CREATE POLICY "Authed like" ON public.story_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner unlikes" ON public.story_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX story_likes_story_idx ON public.story_likes(story_id);

-- 6) READING PREFS
CREATE TABLE public.user_reading_prefs (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_mature BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_reading_prefs TO authenticated;
GRANT ALL ON public.user_reading_prefs TO service_role;
ALTER TABLE public.user_reading_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads prefs" ON public.user_reading_prefs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner upserts prefs" ON public.user_reading_prefs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates prefs" ON public.user_reading_prefs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER user_reading_prefs_updated_at BEFORE UPDATE ON public.user_reading_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Notify followers on publish
CREATE OR REPLACE FUNCTION public.notify_followers_new_story()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _author_name TEXT;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    SELECT COALESCE(display_name, username, 'كاتب') INTO _author_name
      FROM public.user_profiles WHERE user_id = NEW.author_id LIMIT 1;

    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    SELECT sf.follower_id,
           'قصة جديدة',
           COALESCE(_author_name,'كاتب') || ' نشر قصة جديدة: ' || NEW.title,
           'new_story',
           jsonb_build_object('story_id', NEW.id, 'story_title', NEW.title, 'author_id', NEW.author_id)
    FROM public.story_follows sf
    WHERE sf.author_id = NEW.author_id;

    IF NEW.published_at IS NULL THEN
      NEW.published_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER stories_notify_followers_ins
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_story();

CREATE TRIGGER stories_notify_followers_upd
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_story();

-- 8) Enable realtime on new tables (best-effort)
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_parts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_follows;
