import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedBooks } from '@/components/home/FeaturedBooks';
import { RecentBooks } from '@/components/home/RecentBooks';
import { RecentlyViewedBooks } from '@/components/home/RecentlyViewedBooks';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoriesSection />
      <FeaturedBooks />
      <RecentBooks />
      <RecentlyViewedBooks />
    </Layout>
  );
};

export default Index;
