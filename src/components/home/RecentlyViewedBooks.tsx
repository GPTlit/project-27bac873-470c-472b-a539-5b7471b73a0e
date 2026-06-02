import { Eye, Loader2 } from 'lucide-react';
import { BookCard } from '@/components/books/BookCard';
import { useBooks } from '@/hooks/useBooks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecentlyViewedIds } from '@/hooks/useRecentlyViewed';

export const RecentlyViewedBooks = () => {
  const { data: books, isLoading } = useBooks();
  const { t } = useLanguage();
  const ids = useRecentlyViewedIds();

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container-library flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!ids.length || !books?.length) return null;

  const map = new Map(books.map((b) => [b.id, b]));
  const ordered = ids.map((id) => map.get(id)).filter(Boolean).slice(0, 10) as typeof books;

  if (!ordered.length) return null;

  return (
    <section className="section-padding bg-secondary/20">
      <div className="container-library">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('recentlyViewed')}
            </h2>
            <p className="text-muted-foreground text-sm">{t('libraryName')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {ordered.map((book, index) => (
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
