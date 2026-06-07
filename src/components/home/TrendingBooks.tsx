import { TrendingUp, Loader2 } from 'lucide-react';
import { BookCard } from '@/components/books/BookCard';
import { useBooks } from '@/hooks/useBooks';
import { useBookStats } from '@/hooks/useBookStats';
import { useLanguage } from '@/contexts/LanguageContext';

export const TrendingBooks = () => {
  const { data: books, isLoading } = useBooks();
  const { data: stats } = useBookStats();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container-library flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }
  if (!books?.length) return null;

  const ranked = [...books]
    .map((b) => ({ b, score: (stats?.get(b.id)?.recentLikes ?? 0) * 3 + (stats?.get(b.id)?.likes ?? 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.b);

  if (!ranked.length) return null;

  return (
    <section className="section-padding bg-background">
      <div className="container-library">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('trendingBooks')}</h2>
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