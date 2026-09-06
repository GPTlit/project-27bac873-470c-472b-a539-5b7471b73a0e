import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Book as DbBook } from '@/hooks/useBooks';
import { trackRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface BookCarouselProps {
  title: string;
  icon?: ReactNode;
  books: DbBook[];
  viewAllHref?: string;
  /** varied sizing pattern: repeats across the row */
  pattern?: 'mixed' | 'wide-first' | 'tall-first' | 'uniform';
}

type Shape = 'wide' | 'tall' | 'standard';

const shapeOf = (i: number, pattern: BookCarouselProps['pattern'] = 'mixed'): Shape => {
  if (pattern === 'uniform') return 'standard';
  if (pattern === 'wide-first') return i === 0 ? 'wide' : 'standard';
  if (pattern === 'tall-first') return i === 0 ? 'tall' : 'standard';
  const cycle = i % 6;
  if (cycle === 0) return 'tall';
  if (cycle === 3) return 'wide';
  return 'standard';
};

const sizeClass = (i: number, pattern: BookCarouselProps['pattern'] = 'mixed') => {
  const shape = shapeOf(i, pattern);
  if (shape === 'wide') return i === 0 && pattern === 'wide-first' ? 'w-56 sm:w-72 aspect-[4/3]' : 'w-56 sm:w-64 aspect-[4/3]';
  if (shape === 'tall') return i === 0 && pattern === 'tall-first' ? 'w-40 sm:w-48 aspect-[2/3]' : 'w-48 sm:w-56 aspect-[2/3]';
  return 'w-32 sm:w-36 aspect-[3/4]';
};

/** Pick the cover picture that matches the frame, falling back to the standard one. */
const coverFor = (book: DbBook, shape: Shape) => {
  if (shape === 'wide') return book.cover_wide_url || book.cover_url || '/placeholder.svg';
  if (shape === 'tall') return book.cover_tall_url || book.cover_url || '/placeholder.svg';
  return book.cover_url || '/placeholder.svg';
};


export const BookCarousel = ({ title, icon, books, viewAllHref, pattern = 'mixed' }: BookCarouselProps) => {
  if (!books || books.length === 0) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="container-library">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                {icon}
              </div>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
          </div>
          {viewAllHref && (
            <Link to={viewAllHref}>
              <Button variant="ghost" size="sm" className="gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 px-4 sm:px-6 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
        {books.map((book, i) => (
          <Link
            key={book.id}
            to={`/book/${book.id}`}
            onClick={() => trackRecentlyViewed(book.id)}
            className={cn(
              'group relative shrink-0 snap-start rounded-xl overflow-hidden book-shadow book-hover animate-fade-in-up',
              sizeClass(i, pattern)
            )}
            style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
          >
            <img
              src={coverFor(book, shapeOf(i, pattern))}
              alt={book.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 leading-tight">
                {book.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {book.author}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};