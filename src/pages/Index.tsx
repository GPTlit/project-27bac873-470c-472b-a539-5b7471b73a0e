import { useMemo } from 'react';
import { Sparkles, TrendingUp, Star, Clock, BookOpen, Flame } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { RecentlyViewedBooks } from '@/components/home/RecentlyViewedBooks';
import { BookCarousel } from '@/components/home/BookCarousel';
import { useBooks } from '@/hooks/useBooks';
import { useFeaturedBookIds } from '@/hooks/useFeaturedBooks';
import { useBookStats } from '@/hooks/useBookStats';
import { allCategories } from '@/hooks/useCategories';

const Index = () => {
  const { data: books = [] } = useBooks();
  const { data: featuredIds } = useFeaturedBookIds();
  const { trending = [], topRated = [] } = (useBookStats?.() as any) || {};

  const featured = useMemo(() => {
    if (!books.length) return [];
    if (featuredIds && featuredIds.length) {
      const map = new Map(books.map((b) => [b.id, b]));
      return featuredIds.map((id) => map.get(id)).filter(Boolean) as typeof books;
    }
    return books.slice(0, 10);
  }, [books, featuredIds]);

  const recent = useMemo(() => books.slice(0, 15), [books]);

  // Category-specific rows (up to 4 categories with books)
  const categoryRows = useMemo(() => {
    if (!books.length) return [];
    const rows: { name: string; nameAr: string; books: typeof books }[] = [];
    for (const cat of allCategories) {
      const inCat = books.filter(
        (b) => b.category === cat.name || b.categories?.includes(cat.name)
      );
      if (inCat.length >= 3) rows.push({ name: cat.name, nameAr: cat.nameAr, books: inCat });
      if (rows.length >= 4) break;
    }
    return rows;
  }, [books]);

  return (
    <Layout>
      <HeroCarousel />
      <RecentlyViewedBooks />
      <BookCarousel
        title="الكتب المختارة"
        icon={<Sparkles className="h-5 w-5" />}
        books={featured}
        viewAllHref="/categories"
        pattern="mixed"
      />
      <CategoriesSection />
      <BookCarousel
        title="الأكثر رواجاً"
        icon={<Flame className="h-5 w-5" />}
        books={(trending as any) || featured}
        pattern="wide-first"
      />
      <BookCarousel
        title="الأعلى تقييماً"
        icon={<Star className="h-5 w-5" />}
        books={(topRated as any) || featured.slice().reverse()}
        pattern="tall-first"
      />
      <BookCarousel
        title="أُضيف حديثاً"
        icon={<Clock className="h-5 w-5" />}
        books={recent}
        pattern="mixed"
      />
      {categoryRows.map((row, i) => (
        <BookCarousel
          key={row.name}
          title={row.nameAr}
          icon={<BookOpen className="h-5 w-5" />}
          books={row.books}
          viewAllHref={`/category/${encodeURIComponent(row.name)}`}
          pattern={(['mixed', 'wide-first', 'tall-first', 'mixed'] as const)[i % 4]}
        />
      ))}
      <HeroSection />
    </Layout>
  );
};

export default Index;
