import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryCard } from './CategoryCard';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

export const CategoriesSection = () => {
  const { data: categories, isLoading } = useCategories();
  const { t } = useLanguage();
  
  // Show first 8 categories on home page
  const displayCategories = categories?.slice(0, 8) || [];

  return (
    <section className="section-padding bg-background">
      <div className="container-library">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t('browseCategories')}
            </h2>
            <p className="text-muted-foreground">
              {categories?.length || 40} {t('categoriesCount')}
            </p>
          </div>
          <Link to="/categories" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              {t('allCategories')}
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))
          ) : (
            displayCategories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))
          )}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center sm:hidden">
          <Link to="/categories">
            <Button variant="outline" className="gap-2">
              {t('allCategories')}
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
