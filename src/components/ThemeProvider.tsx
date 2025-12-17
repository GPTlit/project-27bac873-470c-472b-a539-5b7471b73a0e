import { useEffect } from 'react';
import { useActiveTheme } from '@/hooks/useAppConfig';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: theme } = useActiveTheme();

  useEffect(() => {
    if (!theme?.colors) return;

    const root = document.documentElement;
    const colors = theme.colors as Record<string, string>;

    // Apply each color from the database to CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--${key}`, value);
      }
    });
  }, [theme]);

  return <>{children}</>;
};
