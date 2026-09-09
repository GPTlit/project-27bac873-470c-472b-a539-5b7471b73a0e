import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePromoBlocks, type PromoBlock } from '@/hooks/usePromoBlocks';
import { useBooks } from '@/hooks/useBooks';

const THUMB_CLASS: Record<'small' | 'medium' | 'large', string> = {
  small: 'w-16 sm:w-20',
  medium: 'w-24 sm:w-28',
  large: 'w-32 sm:w-40',
};

const youtubeId = (url: string) => {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m?.[1] ?? null;
};

const BlockMedia = ({ block }: { block: PromoBlock }) => {
  const { data: books } = useBooks();

  if (block.media_type === 'youtube' && block.youtube_url) {
    const id = youtubeId(block.youtube_url);
    if (!id) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-secondary">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title={block.title || 'video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  if (block.media_type === 'video' && block.media_url) {
    return (
      <video
        src={block.media_url}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-secondary object-cover"
      />
    );
  }

  if (block.media_type === 'books') {
    const map = new Map((books ?? []).map((b) => [b.id, b]));
    const picked = block.book_ids.map((id) => map.get(id)).filter(Boolean);
    if (!picked.length) return null;
    return (
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {picked.map((b) => (
          <Link key={b!.id} to={`/book/${b!.id}`} className={cn('shrink-0 group', THUMB_CLASS[block.thumb_size])}>
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-border/50 bg-secondary shadow-lg transition-transform group-hover:-translate-y-1">
              {b!.cover_url ? (
                <img src={b!.cover_url} alt={b!.title} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] text-muted-foreground">
                  {b!.title}
                </div>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{b!.title}</p>
          </Link>
        ))}
      </div>
    );
  }

  if (block.media_url) {
    return (
      <img
        src={block.media_url}
        alt={block.title || ''}
        loading="lazy"
        className="w-full rounded-xl object-cover"
      />
    );
  }
  return null;
};

/** Extra promo/ad block that sits between the book sections on the home page. */
export const PromoBlocks = ({ slot }: { slot: number }) => {
  const { data: blocks } = usePromoBlocks();
  const items = (blocks ?? []).filter((b) => b.enabled && b.slot === slot);
  if (!items.length) return null;

  return (
    <section className="container-library py-6 space-y-6">
      {items.map((block) => (
        <div
          key={block.id}
          className="overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3"
        >
          {(block.title || block.subtitle) && (
            <div>
              {block.title && <h3 className="text-lg font-bold text-foreground">{block.title}</h3>}
              {block.subtitle && <p className="text-sm text-muted-foreground">{block.subtitle}</p>}
            </div>
          )}
          <BlockMedia block={block} />
          {block.link_url && (
            <a href={block.link_url} target="_blank" rel="noopener noreferrer" className="inline-block">
              <Button variant="gold" size="sm" className="rounded-full gap-2">
                {block.link_label || 'اعرف المزيد'}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      ))}
    </section>
  );
};
