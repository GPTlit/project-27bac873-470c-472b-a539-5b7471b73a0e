import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'signin-banner-dismissed';

const text = {
  ar: {
    msg: 'مرحباً بك في مكتبتنا! سجّل الدخول للوصول إلى محتوى المكتبة كاملاً والتفاعل مع الكتب.',
    cta: 'تسجيل الدخول',
  },
  en: {
    msg: 'Welcome to our library! Sign in to access full library content and interact with books.',
    cta: 'Sign In',
  },
  fr: {
    msg: 'Bienvenue dans notre bibliothèque ! Connectez-vous pour accéder à tout le contenu.',
    cta: 'Se connecter',
  },
};

export const SignInBanner = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setShow(true);
  }, [user, loading]);

  if (!show || user) return null;
  const t = text[language] ?? text.ar;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex items-center gap-3 px-4 py-2.5 text-sm">
        <p className="flex-1 leading-snug">{t.msg}</p>
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link to="/auth">
            <LogIn className="h-4 w-4" />
            {t.cta}
          </Link>
        </Button>
        <button
          onClick={dismiss}
          aria-label="dismiss"
          className="shrink-0 rounded-md p-1 hover:bg-primary-foreground/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};