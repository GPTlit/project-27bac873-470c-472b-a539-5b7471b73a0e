import { Layout } from '@/components/layout/Layout';
import { CategoryCard } from '@/components/home/CategoryCard';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

const Categories = () => {
  const { data: categories, isLoading } = useCategories();
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('allCategories')}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('categoriesPageDesc')} {categories?.length || 40} {t('categoriesPageDescSuffix')}
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {isLoading ? (
              Array.from({ length: 20 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))
            ) : (
              categories?.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
