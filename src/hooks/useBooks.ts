import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string;
  categories: string[] | null;
  cover_url: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

export const useBooks = () => {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Book[];
    },
  });
};

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Book | null;
    },
    enabled: !!id,
  });
};

export const useBooksByCategory = (category: string) => {
  return useQuery({
    queryKey: ['books', 'category', category],
    queryFn: async () => {
      // Query books where the category is in the categories array OR matches the legacy category field
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`categories.cs.{"${category}"},category.eq.${category}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Book[];
    },
    enabled: !!category,
  });
};

export const useSearchBooks = (query: string) => {
  return useQuery({
    queryKey: ['books', 'search', query],
    queryFn: async () => {
      // Search in title, author, description, category, and categories array
      const searchTerm = `%${query}%`;
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`title.ilike.${searchTerm},author.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Also filter by categories array (Supabase doesn't support ilike on arrays easily)
      // So we do a secondary filter on the client side for categories
      const filtered = (data as Book[]).filter(book => {
        // Already matched by SQL query
        if (book.title.toLowerCase().includes(query.toLowerCase())) return true;
        if (book.author.toLowerCase().includes(query.toLowerCase())) return true;
        if (book.description?.toLowerCase().includes(query.toLowerCase())) return true;
        if (book.category.toLowerCase().includes(query.toLowerCase())) return true;
        // Check categories array
        if (book.categories?.some(cat => cat.toLowerCase().includes(query.toLowerCase()))) return true;
        return false;
      });
      
      return filtered;
    },
    enabled: query.length > 0,
  });
};
