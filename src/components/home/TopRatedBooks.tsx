import { Star, Loader2 } from 'lucide-react';
import { BookCard } from '@/components/books/BookCard';
import { useBooks } from '@/hooks/useBooks';
import { useBookStats } from '@/hooks/useBookStats';
import { useLanguage } from '@/contexts/LanguageContext';

export const TopRatedBooks = () => {
  const { data: books, isLoading } = useBooks();
  const { data: stats } = useBookStats();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <section className="section-padding bg-secondary/20">
        <div className="container-library flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }
  if (!books?.length) return null;

  // Bayesian-ish weighted average so books with very few ratings don't dominate
  const C = 3; // prior count
  const m = 4; // prior mean
  const ranked = [...books]
    .map((b) => {
      const s = stats?.get(b.id);
      const n = s?.ratingCount ?? 0;
      const avg = s?.avgRating ?? 0;
      const score = (C * m + n * avg) / (C + n);
      return { b, score, n };
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.b);

  if (!ranked.length) return null;

  return (
    <section className="section-padding bg-secondary/20">
      <div className="container-library">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient">
            <Star className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('topRatedBooks')}</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {ranked.map((book, index) => (
            <BookCard
              key={book.id}
              book={{
                id: book.id,
                title: book.title,
                author: book.author,
                description: book.description || '',
                category: book.category,
                coverUrl: book.cover_url || '/placeholder.svg',
                pdfUrl: book.file_url,
                createdAt: book.created_at || '',
              }}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};