import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHeroBanners, type HeroBanner } from '@/hooks/useHeroBanners';
import { useBooks } from '@/hooks/useBooks';
import { useFeaturedBookIds } from '@/hooks/useFeaturedBooks';

interface Slide {
  id: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  href: string;
  cta?: string | null;
  bookIds?: string[];
  thumbSize?: 'small' | 'medium' | 'large';
}

const THUMB_CLASS: Record<'small' | 'medium' | 'large', string> = {
  small: 'w-14 sm:w-16',
  medium: 'w-20 sm:w-24',
  large: 'w-28 sm:w-36',
};

const isActive = (b: HeroBanner) => {
  const now = Date.now();
  if (!b.enabled) return false;
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return false;
  if (b.ends_at && new Date(b.ends_at).getTime() <= now) return false;
  return true;
};

export const HeroCarousel = () => {
  const { data: banners } = useHeroBanners();
  const { data: books } = useBooks();
  const { data: featuredIds } = useFeaturedBookIds();
  const [index, setIndex] = useState(0);

  const slides: Slide[] = useMemo(() => {
    const active = (banners ?? []).filter(isActive);
    if (active.length > 0) {
      return active.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        image: b.image_url,
        href: b.book_id ? `/book/${b.book_id}` : b.cta_url || '#',
        cta: b.cta_label,
        bookIds: (b.book_ids ?? []) as string[],
        thumbSize: (b.thumb_size ?? 'medium') as 'small' | 'medium' | 'large',
      }));
    }
    // Fallback: promote featured books, or newest books
    const pool = books ?? [];
    const ids = featuredIds && featuredIds.length ? featuredIds : pool.slice(0, 5).map((b) => b.id);
    const map = new Map(pool.map((b) => [b.id, b]));
    return ids
      .map((id) => map.get(id))
      .filter(Boolean)
      .slice(0, 5)
      .map((b) => ({
        id: b!.id,
        title: b!.title,
        subtitle: b!.author,
        image: b!.cover_url,
        href: `/book/${b!.id}`,
        cta: 'اقرأ الآن',
      }));
  }, [banners, books, featuredIds]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const bookMap = useMemo(() => new Map((books ?? []).map((b) => [b.id, b])), [books]);

  if (slides.length === 0) return null;

  const current = slides[index % slides.length];
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[280px] sm:h-[380px] md:h-[460px] w-full">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            {s.image ? (
              <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full hero-gradient" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
            <div className="absolute inset-0 flex items-end">
              <div className="container-library w-full pb-8 sm:pb-12">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/80 backdrop-blur border border-border/50 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-gold" />
                    <span className="text-xs font-medium text-foreground">مميز</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-foreground mb-2 line-clamp-2">
                    {s.title}
                  </h2>
                  {s.subtitle && (
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 line-clamp-2">
                      {s.subtitle}
                    </p>
                  )}
                  {!!s.bookIds?.length && (
                    <div className="flex gap-2 sm:gap-3 mb-4 overflow-x-auto hide-scrollbar">
                      {s.bookIds
                        .map((id) => bookMap.get(id))
                        .filter(Boolean)
                        .map((b) => (
                          <Link
                            key={b!.id}
                            to={`/book/${b!.id}`}
                            className={cn(
                              'shrink-0 group',
                              THUMB_CLASS[s.thumbSize || 'medium']
                            )}
                          >
                            <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-secondary border border-border/50 shadow-lg transition-transform group-hover:-translate-y-1">
                              {b!.cover_url ? (
                                <img
                                  src={b!.cover_url}
                                  alt={b!.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center p-1 text-[10px] text-muted-foreground text-center">
                                  {b!.title}
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}
                  {s.href && s.href !== '#' && (
                    <Link to={s.href}>
                      <Button variant="gold" size="lg" className="rounded-full">
                        {s.cta || 'اكتشف'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">

              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`الشريحة ${i + 1}`}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === index ? 'w-6 bg-primary' : 'w-2 bg-foreground/30'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};