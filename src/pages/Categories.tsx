import { Layout } from '@/components/layout/Layout';
import { CategoryCard } from '@/components/home/CategoryCard';
import { categories } from '@/lib/mockData';

const Categories = () => {
  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              جميع التصنيفات
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              تصفح مكتبتنا الغنية بمختلف التصنيفات والمجالات المعرفية
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
