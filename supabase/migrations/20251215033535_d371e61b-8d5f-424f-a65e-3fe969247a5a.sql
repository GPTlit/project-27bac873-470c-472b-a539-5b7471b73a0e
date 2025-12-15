-- App Configuration table for storing dynamic settings
CREATE TABLE public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Feature toggles table
CREATE TABLE public.feature_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Theme configuration table
CREATE TABLE public.theme_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL DEFAULT 'default',
  colors JSONB DEFAULT '{"primary": "43 74% 49%", "secondary": "39 21% 88%", "accent": "36 100% 50%"}',
  fonts JSONB DEFAULT '{"heading": "Tajawal", "body": "Tajawal"}',
  spacing JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Navigation config table
CREATE TABLE public.navigation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position TEXT NOT NULL DEFAULT 'header',
  items JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Page sections config table
CREATE TABLE public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  section_key TEXT NOT NULL,
  section_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(page_key, section_key)
);

-- Comments table for books
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Likes table for books
CREATE TABLE public.book_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Comment likes table
CREATE TABLE public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Premium books flag (add column to books)
ALTER TABLE public.books ADD COLUMN is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.books ADD COLUMN premium_price DECIMAL(10,2) DEFAULT 0;

-- AI Admin chat history
CREATE TABLE public.admin_ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_config (admin only write, public read)
CREATE POLICY "Anyone can read app config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage app config" ON public.app_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for feature_toggles
CREATE POLICY "Anyone can read feature toggles" ON public.feature_toggles FOR SELECT USING (true);
CREATE POLICY "Admins can manage feature toggles" ON public.feature_toggles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for theme_config
CREATE POLICY "Anyone can read theme config" ON public.theme_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage theme config" ON public.theme_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for navigation_config
CREATE POLICY "Anyone can read navigation config" ON public.navigation_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage navigation config" ON public.navigation_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for page_sections
CREATE POLICY "Anyone can read page sections" ON public.page_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage page sections" ON public.page_sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for comments
CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for book_likes
CREATE POLICY "Anyone can read book likes" ON public.book_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like books" ON public.book_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike books" ON public.book_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE POLICY "Anyone can read comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for admin_ai_chats
CREATE POLICY "Admins can manage their AI chats" ON public.admin_ai_chats FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);

-- Insert default feature toggles
INSERT INTO public.feature_toggles (feature_key, enabled, description) VALUES
  ('comments', true, 'Enable comments on book pages'),
  ('book_likes', true, 'Enable likes on books'),
  ('comment_likes', true, 'Enable likes on comments'),
  ('premium_content', false, 'Enable premium content feature'),
  ('audiobooks', false, 'Enable audiobooks section'),
  ('ratings', false, 'Enable book ratings'),
  ('related_books', true, 'Show related books on book detail page');

-- Insert default theme
INSERT INTO public.theme_config (name, is_active, colors, fonts) VALUES
  ('default', true, '{"primary": "43 74% 49%", "secondary": "39 21% 88%", "accent": "36 100% 50%", "background": "40 33% 98%", "foreground": "24 10% 10%"}', '{"heading": "Tajawal", "body": "Tajawal"}');

-- Insert default navigation
INSERT INTO public.navigation_config (position, items) VALUES
  ('header', '[{"href": "/", "label": "الرئيسية", "icon": "Home", "enabled": true}, {"href": "/categories", "label": "التصنيفات", "icon": "Grid3X3", "enabled": true}, {"href": "/search", "label": "البحث", "icon": "Search", "enabled": true}, {"href": "/history", "label": "السجل", "icon": "Clock", "enabled": true}, {"href": "/about", "label": "عن المكتبة", "icon": "Info", "enabled": true}]');

-- Trigger for updated_at
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON public.app_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feature_toggles_updated_at BEFORE UPDATE ON public.feature_toggles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_theme_config_updated_at BEFORE UPDATE ON public.theme_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_navigation_config_updated_at BEFORE UPDATE ON public.navigation_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON public.page_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admin_ai_chats_updated_at BEFORE UPDATE ON public.admin_ai_chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();