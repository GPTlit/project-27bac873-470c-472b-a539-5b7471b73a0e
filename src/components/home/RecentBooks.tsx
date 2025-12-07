import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/books/BookCard';
import { mockBooks } from '@/lib/mockData';

export const RecentBooks = () => {
  const recentBooks = [...mockBooks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 8);

  return (
    <section className="section-padding bg-background">
      <div className="container-library">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                أحدث الإضافات
              </h2>
              <p className="text-muted-foreground text-sm">
                آخر الكتب المضافة للمكتبة
              </p>
            </div>
          </div>
          <Link to="/categories" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              عرض المزيد
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {recentBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
