import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Sparkles, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBooks } from '@/hooks/useBooks';
import { allCategories } from '@/hooks/useCategories';

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: books } = useBooks();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const bookCount = books?.length || 0;
  const categoryCount = allCategories.length;

  return (
    <section className="relative hero-gradient overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-48 h-48 bg-amber/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-light/5 rounded-full blur-3xl" />
      </div>

      <div className="container-library relative">
        <div className="flex flex-col items-center text-center py-12 sm:py-16 md:py-24 lg:py-32 px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-sm mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-muted-foreground">
              {t('freeDigitalLibrary')}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient">{t('libraryTitle')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 animate-fade-in-up px-4" style={{ animationDelay: '0.2s' }}>
            {t('discoverBooks')}
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="w-full max-w-xl animate-fade-in-up px-4" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 sm:h-14 pr-4 sm:pr-5 pl-24 sm:pl-32 text-base sm:text-lg bg-card shadow-lg border-border/50"
              />
              <Button
                type="submit"
                variant="gold"
                size="default"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 sm:h-10 px-3 sm:px-4"
              >
                <Search className="h-4 sm:h-5 w-4 sm:w-5 ml-1 sm:ml-2" />
                <span className="hidden sm:inline">{t('search')}</span>
              </Button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-12 animate-fade-in-up px-4" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-xl bg-secondary">
                <BookOpen className="h-5 sm:h-6 w-5 sm:w-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-foreground">+{bookCount > 0 ? bookCount : 1000}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{t('books')}</div>
              </div>
            </div>
            <div className="h-6 sm:h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-xl bg-secondary">
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{categoryCount}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{t('categoriesCount')}</div>
              </div>
            </div>
            <div className="h-6 sm:h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-xl bg-secondary">
                <span className="text-lg sm:text-xl">⬇️</span>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{t('freeForAll').split(' ')[0]}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{t('freeForAll').split(' ').slice(1).join(' ')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
