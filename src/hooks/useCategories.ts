import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/lib/types';

// Extended categories list
export const allCategories: Category[] = [
  // Original categories
  { id: '1', name: 'novels', nameAr: 'روايات', icon: '📚', bookCount: 0 },
  { id: '2', name: 'religion', nameAr: 'دين', icon: '🕌', bookCount: 0 },
  { id: '3', name: 'science', nameAr: 'علوم', icon: '🔬', bookCount: 0 },
  { id: '4', name: 'history', nameAr: 'تاريخ', icon: '📜', bookCount: 0 },
  { id: '5', name: 'psychology', nameAr: 'علم النفس', icon: '🧠', bookCount: 0 },
  { id: '6', name: 'philosophy', nameAr: 'فلسفة', icon: '💭', bookCount: 0 },
  { id: '7', name: 'kids', nameAr: 'كتب أطفال', icon: '🧒', bookCount: 0 },
  { id: '8', name: 'school', nameAr: 'كتب مدرسية', icon: '🎓', bookCount: 0 },
  { id: '9', name: 'poetry', nameAr: 'شعر', icon: '✨', bookCount: 0 },
  { id: '10', name: 'self-help', nameAr: 'تطوير الذات', icon: '🌱', bookCount: 0 },
  
  // New fiction genres
  { id: '11', name: 'fantasy', nameAr: 'فانتازيا', icon: '🧙', bookCount: 0 },
  { id: '12', name: 'sci-fi', nameAr: 'خيال علمي', icon: '🚀', bookCount: 0 },
  { id: '13', name: 'horror', nameAr: 'رعب', icon: '👻', bookCount: 0 },
  { id: '14', name: 'thriller', nameAr: 'إثارة', icon: '🔪', bookCount: 0 },
  { id: '15', name: 'crime', nameAr: 'جريمة', icon: '🔍', bookCount: 0 },
  { id: '16', name: 'romance', nameAr: 'رومانسي', icon: '💕', bookCount: 0 },
  { id: '17', name: 'historical-fiction', nameAr: 'تاريخي خيالي', icon: '⚔️', bookCount: 0 },
  { id: '18', name: 'adventure', nameAr: 'مغامرات', icon: '🗺️', bookCount: 0 },
  { id: '19', name: 'action', nameAr: 'أكشن', icon: '💥', bookCount: 0 },
  { id: '20', name: 'drama', nameAr: 'دراما', icon: '🎭', bookCount: 0 },
  { id: '21', name: 'comedy', nameAr: 'كوميديا', icon: '😂', bookCount: 0 },
  
  // Specialized genres
  { id: '22', name: 'robots', nameAr: 'روبوتات', icon: '🤖', bookCount: 0 },
  { id: '23', name: 'mythic', nameAr: 'أساطير', icon: '🐉', bookCount: 0 },
  { id: '24', name: 'dark-fantasy', nameAr: 'فانتازيا مظلمة', icon: '🖤', bookCount: 0 },
  { id: '25', name: 'dark-humor', nameAr: 'كوميديا سوداء', icon: '🃏', bookCount: 0 },
  { id: '26', name: 'cosmic-horror', nameAr: 'رعب كوني', icon: '🌌', bookCount: 0 },
  { id: '27', name: 'supernatural', nameAr: 'خوارق', icon: '👁️', bookCount: 0 },
  { id: '28', name: 'uncanny-valley', nameAr: 'الوادي الغريب', icon: '🎭', bookCount: 0 },
  { id: '29', name: 'gothic-horror', nameAr: 'رعب قوطي', icon: '🏚️', bookCount: 0 },
  { id: '30', name: 'analog-horror', nameAr: 'رعب تناظري', icon: '📺', bookCount: 0 },
  { id: '31', name: 'zombies', nameAr: 'زومبي', icon: '🧟', bookCount: 0 },
  { id: '32', name: 'survival', nameAr: 'بقاء', icon: '🏕️', bookCount: 0 },
  
  // Additional useful categories
  { id: '33', name: 'biography', nameAr: 'سيرة ذاتية', icon: '👤', bookCount: 0 },
  { id: '34', name: 'mystery', nameAr: 'غموض', icon: '🕵️', bookCount: 0 },
  { id: '35', name: 'dystopia', nameAr: 'ديستوبيا', icon: '🏙️', bookCount: 0 },
  { id: '36', name: 'apocalyptic', nameAr: 'نهاية العالم', icon: '☢️', bookCount: 0 },
  { id: '37', name: 'steampunk', nameAr: 'ستيم بانك', icon: '⚙️', bookCount: 0 },
  { id: '38', name: 'cyberpunk', nameAr: 'سايبر بانك', icon: '🌃', bookCount: 0 },
  { id: '39', name: 'military', nameAr: 'عسكري', icon: '🎖️', bookCount: 0 },
  { id: '40', name: 'sports', nameAr: 'رياضة', icon: '⚽', bookCount: 0 },
];

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories-with-counts'],
    queryFn: async () => {
      // Fetch book counts from both category and categories fields
      const { data, error } = await supabase
        .from('books')
        .select('category, categories');
      
      if (error) throw error;
      
      // Count books per category (supporting both legacy single category and new array)
      const counts: Record<string, number> = {};
      data?.forEach(book => {
        // Count from categories array if present
        if (book.categories && Array.isArray(book.categories)) {
          book.categories.forEach((cat: string) => {
            const catLower = cat?.toLowerCase() || '';
            counts[catLower] = (counts[catLower] || 0) + 1;
          });
        } else if (book.category) {
          // Fallback to legacy single category
          const cat = book.category.toLowerCase();
          counts[cat] = (counts[cat] || 0) + 1;
        }
      });
      
      // Merge counts with categories
      return allCategories.map(cat => ({
        ...cat,
        bookCount: counts[cat.name.toLowerCase()] || 0
      }));
    },
  });
};

// Get only categories that have books
export const useCategoriesWithBooks = () => {
  const { data: categories, ...rest } = useCategories();
  
  return {
    data: categories?.filter(cat => cat.bookCount > 0),
    allCategories: categories,
    ...rest
  };
};
