import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedBooks } from '@/components/home/FeaturedBooks';
import { RecentBooks } from '@/components/home/RecentBooks';
import { RecentlyViewedBooks } from '@/components/home/RecentlyViewedBooks';
import { TrendingBooks } from '@/components/home/TrendingBooks';
import { TopRatedBooks } from '@/components/home/TopRatedBooks';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <RecentlyViewedBooks />
      <CategoriesSection />
      <FeaturedBooks />
      <TrendingBooks />
      <TopRatedBooks />
      <RecentBooks />
    </Layout>
  );
};

export default Index;
