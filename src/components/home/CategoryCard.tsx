import { Link } from 'react-router-dom';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryCardProps {
  category: Category;
  index: number;
}

export const CategoryCard = ({ category, index }: CategoryCardProps) => {
  const { t } = useLanguage();
  
  // Get translated category name
  const getCategoryName = () => {
    const translationKey = `category_${category.name}`;
    const translated = t(translationKey);
    // If no translation found (returns the key), use Arabic name
    return translated !== translationKey ? translated : category.nameAr;
  };

  return (
    <Link
      to={`/category/${category.name}`}
      className="group block animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
        "bg-card border border-border shadow-sm",
        "hover:shadow-lg hover:border-primary/20 hover:-translate-y-1"
      )}>
        {/* Icon */}
        <div className="text-4xl mb-4">{category.icon}</div>

        {/* Content */}
        <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
          {getCategoryName()}
        </h3>
        <p className="text-sm text-muted-foreground">
          {category.bookCount} {t('books')}
        </p>

        {/* Decorative gradient */}
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-x-1/2 translate-y-1/2 group-hover:bg-primary/10 transition-colors" />
      </div>
    </Link>
  );
};