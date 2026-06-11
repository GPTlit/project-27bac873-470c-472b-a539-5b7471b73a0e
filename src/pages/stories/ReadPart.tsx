import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import { useStory, useStoryParts } from '@/hooks/useStories';
import { useStoryComments, useAddStoryComment, useDeleteStoryComment } from '@/hooks/useStoryComments';
import { MediaBlock } from '@/components/stories/MediaBlock';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowLeft, Send, Trash2, MessageCircle } from 'lucide-react';
import { AmbientPlayer } from '@/components/books/AmbientPlayer';

export default function ReadPart() {
  const { id: storyId, partId } = useParams();
  const { user } = useAuth();
  const { data: story } = useStory(storyId);
  const { data: parts = [] } = useStoryParts(storyId);
  const part = parts.find(p => p.id === partId);
  const { data: comments = [] } = useStoryComments(partId);
  const addComment = useAddStoryComment();
  const delComment = useDeleteStoryComment();
  const [text, setText] = useState('');
  const [pageIdx, setPageIdx] = useState(0);

  const pages = useMemo(() => {
    const content = part?.content ?? '';
    if (!content.trim()) return [''];
    const target = 1200;
    const out: string[] = [];
    let i = 0;
    while (i < content.length) {
      let end = Math.min(i + target, content.length);
      if (end < content.length) {
        const slice = content.slice(i, end);
        const lastBreak = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('. '), slice.lastIndexOf(' '));
        if (lastBreak > target * 0.5) end = i + lastBreak + 1;
      }
      out.push(content.slice(i, end).trim());
      i = end;
    }
    return out;
  }, [part?.content]);

  if (!story || !part) return <Layout><div className="container-library py-12">جاري التحميل...</div></Layout>;

  const totalPages = pages.length;
  const safeIdx = Math.min(pageIdx, totalPages - 1);

  return (
    <Layout>
      <article className="container-library py-6 max-w-3xl">
        <Link to={`/story/${story.id}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowRight className="h-4 w-4" /> {story.title}
        </Link>
        <h1 className="text-2xl font-bold mb-4">{story.title}</h1>

        {part.media?.length > 0 && (
          <div className="space-y-3 mb-6">
            {part.media.map((m, i) => <MediaBlock key={i} media={m} />)}
          </div>
        )}

        <div
          className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-10 min-h-[60vh] whitespace-pre-wrap text-base leading-loose"
          style={{ fontFamily: 'serif' }}
        >
          {pages[safeIdx]}
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" disabled={safeIdx === 0} onClick={() => setPageIdx(i => Math.max(0, i - 1))}>
            <ArrowRight className="h-4 w-4" /> الصفحة السابقة
          </Button>
          <span className="text-sm text-muted-foreground">صفحة {safeIdx + 1} من {totalPages}</span>
          <Button disabled={safeIdx >= totalPages - 1} onClick={() => setPageIdx(i => Math.min(totalPages - 1, i + 1))}>
            الصفحة التالية <ArrowLeft className="h-4 w-4" />
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
        <AmbientPlayer />
      </article>
    </Layout>
  );
}