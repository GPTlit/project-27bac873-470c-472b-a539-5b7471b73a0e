import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { BookCard } from '@/components/books/BookCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchBooks } from '@/hooks/useBooks';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: results, isLoading } = useSearchBooks(query);

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
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
                placeholder={t('searchPlaceholder')}
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
                {t('search')}
              </Button>
            </div>
          </form>

          {/* Results Header */}
          {query && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {t('searchResults')} "{query}"
              </h1>
              <p className="text-muted-foreground">
                {isLoading ? t('searching') : `${t('resultsFound')} ${results?.length || 0} ${t('result')}`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && results && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {results.map((book, index) => (
                <BookCard key={book.id} book={book} index={index} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query && (!results || results.length === 0) && (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔍</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t('noResultsFound')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('tryDifferentWords')}
              </p>
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  {t('backToHome')}
                </Button>
              </Link>
            </div>
          )}

          {/* Initial State - No Query */}
          {!query && (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📚</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t('searchOurLibrary')}
              </h2>
              <p className="text-muted-foreground">
                {t('typeToSearch')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Search;
