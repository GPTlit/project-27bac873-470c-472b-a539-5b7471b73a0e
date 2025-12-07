import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/books/BookCard';
import { mockBooks } from '@/lib/mockData';

export const FeaturedBooks = () => {
  const featuredBooks = mockBooks.filter((book) => book.featured);

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
                كتب مميزة
              </h2>
              <p className="text-muted-foreground text-sm">
                اختيارات مميزة من المكتبة
              </p>
            </div>
          </div>
          <Link to="/categories" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              تصفح الكل
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {featuredBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
