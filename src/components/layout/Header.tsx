import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Grid3X3, History, Download, Upload, LogOut, Shield, Info, Sparkles, Users, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from './Logo';

const baseNavLinks = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/categories', label: 'التصنيفات', icon: Grid3X3 },
  { href: '/store', label: 'المتجر', icon: ShoppingBag },
  { href: '/author-chat', label: 'المؤلف أحمد سالم', icon: Sparkles },
  { href: '/eterke', label: 'ETERKE', icon: Users },
  { href: '/history', label: 'تاريخ القراءة', icon: History },
  { href: '/downloads', label: 'التحميلات', icon: Download },
  { href: '/upload', label: 'أرسل كتاباً', icon: Upload },
  { href: '/about', label: 'عن المكتبة', icon: Info },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  const navLinks = isAdmin 
    ? [...baseNavLinks, { href: '/admin-upload-mrt', label: 'لوحة التحكم', icon: Shield }]
    : baseNavLinks;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="container-library">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-secondary text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            {user && (
              <Button
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3',
                        isActive && 'bg-secondary text-primary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
              {user && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  خروج
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
