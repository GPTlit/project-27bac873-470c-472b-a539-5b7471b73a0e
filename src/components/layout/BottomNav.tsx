import { NavLink } from 'react-router-dom';
import { Home, Rss, Compass, PenSquare, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/feed', label: 'المتابَعون', icon: Rss },
  { to: '/explore', label: 'استكشف', icon: Compass },
  { to: '/write', label: 'اكتب', icon: PenSquare },
  { to: '/profile', label: 'الإشعارات', icon: Bell },
];

export const BottomNav = () => {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5 max-w-screen-md mx-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors min-h-[56px]',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )
              }
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};