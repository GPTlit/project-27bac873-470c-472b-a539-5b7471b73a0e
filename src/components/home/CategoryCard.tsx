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
        "relative overflow-hidden rounded-xl p-3 sm:p-4 transition-all duration-300",
        "bg-card border border-border shadow-sm",
        "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
      )}>
        {/* Icon */}
        <div className="text-2xl sm:text-3xl mb-2">{category.icon}</div>

        {/* Content */}
        <h3 className="text-xs sm:text-sm font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors line-clamp-1">
          {getCategoryName()}
        </h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {category.bookCount} {t('books')}
        </p>
      </div>
    </Link>
  );
};