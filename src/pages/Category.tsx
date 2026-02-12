import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { BookCard } from '@/components/books/BookCard';
import { Button } from '@/components/ui/button';
import { allCategories } from '@/hooks/useCategories';
import { useBooksByCategory } from '@/hooks/useBooks';
import { useLanguage } from '@/contexts/LanguageContext';

const Category = () => {
  const { name } = useParams<{ name: string }>();
  const { t } = useLanguage();
  const category = allCategories.find((c) => c.name === name);
  const { data: books, isLoading } = useBooksByCategory(name || '');

  const getCategoryName = () => {
    if (!category) return '';
    const key = `category_${category.name}`;
    const translated = t(key);
    return translated !== key ? translated : category.nameAr;
  };

  if (!category) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-library text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t('categoryNotFound')}
            </h1>
            <Link to="/categories">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                {t('backToCategories')}
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
              {t('home')}
            </Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-primary transition-colors">
              {t('categories')}
            </Link>
            <span>/</span>
            <span className="text-foreground">{getCategoryName()}</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 mb-12">
            <div className="text-5xl">{category.icon}</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {getCategoryName()}
              </h1>
              <p className="text-muted-foreground">
                {books?.length || 0} {t('booksInThisCategory')}
              </p>
            </div>
          </div>

          {/* Books Grid */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : books && books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {books.map((book, index) => (
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
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {t('noBooksInCategory')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Category;
