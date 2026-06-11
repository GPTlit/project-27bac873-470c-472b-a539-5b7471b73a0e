import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useFollowing } from '@/hooks/useFollow';
import { usePublishedStories } from '@/hooks/useStories';
import { StoryCard } from '@/components/stories/StoryCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, Rss } from 'lucide-react';

export default function Feed() {
  const { user } = useAuth();
  const { data: followingIds = [] } = useFollowing(user?.id);
  const { data: stories = [], isLoading } = usePublishedStories({ authorIds: followingIds, limit: 60 });

  return (
    <Layout>
      <div className="container-library py-6">
        <div className="flex items-center gap-2 mb-4">
          <Rss className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">FYP</h1>
        </div>
        {!user ? (
          <EmptyState text="سجّل دخولك لمتابعة كتّابك المفضلين ورؤية قصصهم هنا." />
        ) : followingIds.length === 0 ? (
          <EmptyState text="لم تتابع أي كاتب بعد. استكشف القصص وتابع كاتباً لتظهر قصصه هنا.">
            <Button asChild><Link to="/explore"><Compass className="h-4 w-4" /> استكشف القصص</Link></Button>
          </EmptyState>
        ) : isLoading ? (
          <p className="text-muted-foreground">جاري التحميل...</p>
        ) : stories.length === 0 ? (
          <EmptyState text="لا توجد قصص جديدة من الذين تتابعهم." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {stories.map(s => <StoryCard key={s.id} story={s} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}

const EmptyState = ({ text, children }: { text: string; children?: React.ReactNode }) => (
  <div className="text-center py-16 text-muted-foreground space-y-4">
    <p>{text}</p>
    {children}
  </div>
);