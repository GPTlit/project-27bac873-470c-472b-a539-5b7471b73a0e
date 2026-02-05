import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/books/BookCard';
import { useBooks } from '@/hooks/useBooks';
import { useLanguage } from '@/contexts/LanguageContext';

export const FeaturedBooks = () => {
  const { data: books, isLoading } = useBooks();
  const { t } = useLanguage();
  
  // Show first 5 books as featured
  const featuredBooks = books?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <section className="section-padding bg-secondary/30">
        <div className="container-library flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (featuredBooks.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-library">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {t('featuredBooks')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t('libraryName')}
              </p>
            </div>
          </div>
          <Link to="/categories" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              {t('viewAll')}
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {featuredBooks.map((book, index) => (
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
