import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string;
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
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('category', category)
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
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Book[];
    },
    enabled: query.length > 0,
  });
};
