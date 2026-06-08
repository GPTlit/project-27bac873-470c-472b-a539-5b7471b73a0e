import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import { useStory, useStoryParts, useStoryAuthors } from '@/hooks/useStories';
import { FollowButton } from '@/components/stories/FollowButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookText, Globe, ShieldAlert, Copyright as CopyrightIcon, ListOrdered } from 'lucide-react';

export default function StoryPage() {
  const { id } = useParams();
  const { data: story, isLoading } = useStory(id);
  const { data: parts = [] } = useStoryParts(id);
  const { data: authors = [] } = useStoryAuthors(story ? [story.author_id] : []);
  const author = authors[0];
  const [matureAck, setMatureAck] = useState(false);

  if (isLoading || !story) return <Layout><div className="container-library py-12">جاري التحميل...</div></Layout>;

  if (story.mature && !matureAck) {
    return (
      <Layout>
        <div className="container-library py-16 max-w-md text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">محتوى للبالغين</h1>
          <p className="text-muted-foreground">هذه القصة مخصصة لمن تجاوز 18 سنة.</p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline"><Link to="/explore">عودة</Link></Button>
            <Button onClick={() => setMatureAck(true)}>أنا بالغ، متابعة</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const publishedParts = parts.filter(p => p.published);

  return (
    <Layout>
      <div className="container-library py-6 max-w-3xl">
        <div className="grid sm:grid-cols-[180px_1fr] gap-5">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-border">
            {story.cover_url ? <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookText className="h-10 w-10 text-muted-foreground" /></div>}
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">{story.title}</h1>
            {author && (
              <div className="flex items-center gap-3">
                <Link to={`/u/${author.username}`} className="flex items-center gap-2 hover:underline">
                  <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
                    {author.avatar_url && <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="text-sm font-medium">{author.display_name || author.username}</span>
                </Link>
                <FollowButton authorId={story.author_id} />
              </div>
            )}
            <p className="text-muted-foreground text-sm leading-relaxed">{story.description}</p>
            <div className="flex flex-wrap gap-2">
              {story.category && <Badge variant="secondary">{story.category}</Badge>}
              {story.tags?.map(t => <Badge key={t} variant="outline">#{t}</Badge>)}
              {story.language && <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3" />{story.language}</Badge>}
            </div>
            {story.copyright && <p className="text-xs text-muted-foreground flex items-center gap-1"><CopyrightIcon className="h-3 w-3" />{story.copyright}</p>}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><ListOrdered className="h-5 w-5" /> الأجزاء</h2>
          {publishedParts.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد أجزاء منشورة بعد.</p>
          ) : (
            <ul className="space-y-2">
              {publishedParts.map((p, i) => (
                <li key={p.id}>
                  <Link to={`/story/${story.id}/read/${p.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:shadow-sm">
                    <span><span className="text-xs text-muted-foreground mr-2">#{i + 1}</span>{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}