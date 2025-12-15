import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureToggle {
  id: string;
  feature_key: string;
  enabled: boolean;
  config: Record<string, any>;
  description: string | null;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  is_active: boolean;
}

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  enabled: boolean;
}

export interface NavigationConfig {
  id: string;
  position: string;
  items: NavigationItem[];
}

export interface PageSection {
  id: string;
  page_key: string;
  section_key: string;
  section_type: string;
  config: Record<string, any>;
  enabled: boolean;
  sort_order: number;
}

// Feature toggles
export const useFeatureToggles = () => {
  return useQuery({
    queryKey: ['feature-toggles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_toggles')
        .select('*');
      
      if (error) throw error;
      return data as FeatureToggle[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useFeature = (featureKey: string) => {
  const { data: features } = useFeatureToggles();
  return features?.find(f => f.feature_key === featureKey)?.enabled ?? false;
};

// Theme config
export const useActiveTheme = () => {
  return useQuery({
    queryKey: ['active-theme'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as ThemeConfig | null;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Navigation config
export const useNavigationConfig = (position: string = 'header') => {
  return useQuery({
    queryKey: ['navigation-config', position],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('navigation_config')
        .select('*')
        .eq('position', position)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        items: (data.items as unknown as NavigationItem[]) || [],
      } as NavigationConfig;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Page sections
export const usePageSections = (pageKey: string) => {
  return useQuery({
    queryKey: ['page-sections', pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_key', pageKey)
        .eq('enabled', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as PageSection[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Invalidate all config queries
export const useInvalidateConfig = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['feature-toggles'] });
    queryClient.invalidateQueries({ queryKey: ['active-theme'] });
    queryClient.invalidateQueries({ queryKey: ['navigation-config'] });
    queryClient.invalidateQueries({ queryKey: ['page-sections'] });
  };
};
