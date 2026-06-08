import { Layout } from '@/components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePublishedStories } from '@/hooks/useStories';
import { useFollowers } from '@/hooks/useFollow';
import { FollowButton } from '@/components/stories/FollowButton';
import { StoryCard } from '@/components/stories/StoryCard';
import { User } from 'lucide-react';

export default function AuthorProfile() {
  const { username } = useParams();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-by-username', username],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_profiles').select('user_id, username, display_name, avatar_url, bio').eq('username', username!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });
  const authorId = profile?.user_id;
  const { data: stories = [] } = usePublishedStories({ authorIds: authorId ? [authorId] : [], limit: 60 });
  const { data: followers } = useFollowers(authorId);

  if (isLoading) return <Layout><div className="container-library py-12">جاري التحميل...</div></Layout>;
  if (!profile) return <Layout><div className="container-library py-12 text-center text-muted-foreground">المستخدم غير موجود</div></Layout>;

  return (
    <Layout>
      <div className="container-library py-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted overflow-hidden flex items-center justify-center">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="h-8 w-8 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <p className="text-sm mt-1">{followers?.count ?? 0} متابِع · {stories.length} قصة</p>
          </div>
          {authorId && <FollowButton authorId={authorId} />}
        </div>
        {profile.bio && <p className="mt-4 text-muted-foreground">{profile.bio}</p>}

        <h2 className="text-lg font-semibold mt-8 mb-3">القصص</h2>
        {stories.length === 0 ? (
          <p className="text-muted-foreground text-sm">لم يُنشر أي قصة بعد.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {stories.map(s => <StoryCard key={s.id} story={s} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}