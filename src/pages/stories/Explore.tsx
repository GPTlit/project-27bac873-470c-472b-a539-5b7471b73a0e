import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { usePublishedStories } from '@/hooks/useStories';
import { StoryCard } from '@/components/stories/StoryCard';
import { Compass, Search as SearchIcon } from 'lucide-react';

export default function Explore() {
  const [search, setSearch] = useState('');
  const { data: stories = [], isLoading } = usePublishedStories({ search: search || undefined, limit: 100 });

  return (
    <Layout>
      <div className="container-library py-6">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">استكشف القصص</h1>
        </div>
        <div className="relative mb-6 max-w-xl">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن قصة..." className="pr-9" />
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">جاري التحميل...</p>
        ) : stories.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">لا توجد قصص حتى الآن.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {stories.map(s => <StoryCard key={s.id} story={s} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}