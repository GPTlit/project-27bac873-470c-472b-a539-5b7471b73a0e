import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const VALID_PRESETS = ['royal', 'ramadan', 'sakura', 'ocean', 'sunset'] as const;
type Preset = (typeof VALID_PRESETS)[number];

const useActiveThemePreset = () =>
  useQuery({
    queryKey: ['active-theme-preset'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'active_theme_preset')
        .maybeSingle();
      const v = (data?.value as any);
      const preset = typeof v === 'string' ? v : v?.preset;
      return VALID_PRESETS.includes(preset) ? (preset as Preset) : null;
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 30,
  });

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'library-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const { data: activePreset } = useActiveThemePreset();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    // Clear any inline style overrides from DB theme so CSS variables take effect
    const cssVarsToClear = [
      'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
      'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
      'muted', 'muted-foreground', 'accent', 'accent-foreground',
      'destructive', 'destructive-foreground', 'border', 'input', 'ring',
      'gold', 'gold-light', 'cream', 'cream-dark', 'brown', 'brown-light', 'amber', 'amber-light',
      'sidebar-background', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
      'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    ];
    cssVarsToClear.forEach(v => root.style.removeProperty(`--${v}`));

    let resolvedTheme: string = theme;
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    root.classList.add(resolvedTheme);
  }, [theme]);

  // Apply admin-selected preset (or remove for default)
  useEffect(() => {
    const root = window.document.documentElement;
    if (activePreset) {
      root.setAttribute('data-theme-preset', activePreset);
    } else {
      root.removeAttribute('data-theme-preset');
    }
  }, [activePreset]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
