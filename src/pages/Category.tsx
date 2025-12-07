import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { BookCard } from '@/components/books/BookCard';
import { Button } from '@/components/ui/button';
import { categories, mockBooks } from '@/lib/mockData';

const Category = () => {
  const { name } = useParams<{ name: string }>();
  const category = categories.find((c) => c.name === name);
  const books = mockBooks.filter((book) => book.category === name);

  if (!category) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-library text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              التصنيف غير موجود
            </h1>
            <Link to="/categories">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                العودة للتصنيفات
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-primary transition-colors">
              التصنيفات
            </Link>
            <span>/</span>
            <span className="text-foreground">{category.nameAr}</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 mb-12">
            <div className="text-5xl">{category.icon}</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {category.nameAr}
              </h1>
              <p className="text-muted-foreground">
                {books.length} كتاب في هذا التصنيف
              </p>
            </div>
          </div>

          {/* Books Grid */}
          {books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {books.map((book, index) => (
                <BookCard key={book.id} book={book} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                لا توجد كتب في هذا التصنيف حالياً
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Category;
