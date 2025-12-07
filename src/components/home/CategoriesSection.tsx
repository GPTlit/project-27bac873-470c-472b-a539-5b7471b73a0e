import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryCard } from './CategoryCard';
import { categories } from '@/lib/mockData';

export const CategoriesSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-library">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              تصفح حسب التصنيف
            </h2>
            <p className="text-muted-foreground">
              اختر من بين أكثر من 10 تصنيفات مختلفة
            </p>
          </div>
          <Link to="/categories" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              جميع التصنيفات
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center sm:hidden">
          <Link to="/categories">
            <Button variant="outline" className="gap-2">
              جميع التصنيفات
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
