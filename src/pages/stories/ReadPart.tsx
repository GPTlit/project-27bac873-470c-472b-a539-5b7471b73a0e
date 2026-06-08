import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStory, useStoryParts } from '@/hooks/useStories';
import { useStoryComments, useAddStoryComment, useDeleteStoryComment } from '@/hooks/useStoryComments';
import { MediaBlock } from '@/components/stories/MediaBlock';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowLeft, Send, Trash2, MessageCircle } from 'lucide-react';

export default function ReadPart() {
  const { id: storyId, partId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: story } = useStory(storyId);
  const { data: parts = [] } = useStoryParts(storyId);
  const part = parts.find(p => p.id === partId);
  const { data: comments = [] } = useStoryComments(partId);
  const addComment = useAddStoryComment();
  const delComment = useDeleteStoryComment();
  const [text, setText] = useState('');

  if (!story || !part) return <Layout><div className="container-library py-12">جاري التحميل...</div></Layout>;

  const published = parts.filter(p => p.published);
  const idx = published.findIndex(p => p.id === part.id);
  const prev = published[idx - 1];
  const next = published[idx + 1];

  return (
    <Layout>
      <article className="container-library py-6 max-w-3xl">
        <Link to={`/story/${story.id}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowRight className="h-4 w-4" /> {story.title}
        </Link>
        <h1 className="text-2xl font-bold mb-4">{part.title}</h1>

        {part.media?.length > 0 && (
          <div className="space-y-3 mb-6">
            {part.media.map((m, i) => <MediaBlock key={i} media={m} />)}
          </div>
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-base leading-loose">
          {part.content}
        </div>

        <div className="flex items-center justify-between mt-10 pt-4 border-t border-border">
          <Button variant="outline" disabled={!prev} onClick={() => prev && nav(`/story/${story.id}/read/${prev.id}`)}>
            <ArrowRight className="h-4 w-4" /> السابق
          </Button>
          <Button disabled={!next} onClick={() => next && nav(`/story/${story.id}/read/${next.id}`)}>
            التالي <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3"><MessageCircle className="h-5 w-5" /> التعليقات ({comments.length})</h2>
          {user ? (
            <div className="flex gap-2 mb-4">
              <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="اكتب تعليقاً..." rows={2} />
              <Button onClick={async () => { if (!text.trim()) return; await addComment.mutateAsync({ partId: part.id, content: text.trim() }); setText(''); }}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4"><Link className="underline" to="/auth">سجّل دخولك</Link> للتعليق.</p>
          )}
          <ul className="space-y-3">
            {comments.map(c => (
              <li key={c.id} className="p-3 rounded-lg border border-border bg-card">
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString('ar')}</span>
                  {user?.id === c.user_id && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => delComment.mutate({ id: c.id, partId: part.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </Layout>
  );
}