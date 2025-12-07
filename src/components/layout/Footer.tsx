import { Book, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 mt-auto">
      <div className="container-library py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gold-gradient">
              <Book className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-gradient">مكتبة موريتانيا</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <Link to="/categories" className="hover:text-primary transition-colors">
              التصنيفات
            </Link>
            <Link to="/upload" className="hover:text-primary transition-colors">
              أرسل كتاباً
            </Link>
            <Link to="/about" className="hover:text-primary transition-colors">
              عن المكتبة
            </Link>
          </nav>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>صُنع بـ</span>
            <Heart className="h-4 w-4 text-destructive fill-destructive" />
            <span>في موريتانيا</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} مكتبة موريتانيا. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};
