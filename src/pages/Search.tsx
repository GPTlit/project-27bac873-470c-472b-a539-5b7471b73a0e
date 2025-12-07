import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { BookCard } from '@/components/books/BookCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockBooks } from '@/lib/mockData';
import { useState } from 'react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);

  const results = mockBooks.filter(
    (book) =>
      book.title.includes(query) ||
      book.author.includes(query) ||
      book.category.includes(query) ||
      book.description.includes(query)
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث عن كتاب، مؤلف، أو تصنيف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pr-5 pl-32 text-lg"
              />
              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="absolute left-2 top-1/2 -translate-y-1/2"
              >
                <SearchIcon className="h-5 w-5 ml-2" />
                بحث
              </Button>
            </div>
          </form>

          {/* Results Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              نتائج البحث عن "{query}"
            </h1>
            <p className="text-muted-foreground">
              تم العثور على {results.length} نتيجة
            </p>
          </div>

          {/* Results Grid */}
          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {results.map((book, index) => (
                <BookCard key={book.id} book={book} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔍</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                لم يتم العثور على نتائج
              </h2>
              <p className="text-muted-foreground mb-6">
                جرّب البحث بكلمات مختلفة
              </p>
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Search;
