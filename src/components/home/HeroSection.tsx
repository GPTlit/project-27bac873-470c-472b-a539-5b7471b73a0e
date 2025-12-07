import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative hero-gradient overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-48 h-48 bg-amber/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-light/5 rounded-full blur-3xl" />
      </div>

      <div className="container-library relative">
        <div className="flex flex-col items-center text-center py-16 md:py-24 lg:py-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-sm mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-muted-foreground">
              مكتبة رقمية مجانية للجميع
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient">مكتبة موريتانيا</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            اكتشف آلاف الكتب العربية في مختلف المجالات. اقرأ وحمّل مجاناً بدون تسجيل.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="w-full max-w-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث عن كتاب، مؤلف، أو تصنيف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pr-5 pl-32 text-lg bg-card shadow-lg border-border/50"
              />
              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="absolute left-2 top-1/2 -translate-y-1/2"
              >
                <Search className="h-5 w-5 ml-2" />
                بحث
              </Button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">+1000</div>
                <div className="text-sm text-muted-foreground">كتاب</div>
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <span className="text-xl">📂</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">10</div>
                <div className="text-sm text-muted-foreground">تصنيف</div>
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <span className="text-xl">⬇️</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">مجاني</div>
                <div className="text-sm text-muted-foreground">للجميع</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
