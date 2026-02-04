import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import libraryLogo from '@/assets/library-logo.jpg';

export const Logo = () => {
  const { t } = useLanguage();
  
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative flex h-12 w-12 items-center justify-center">
        {/* Main logo container */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-primary/30">
          <img
            src={libraryLogo}
            alt={t('libraryName')}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Floating sparkle decoration */}
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent/60 animate-pulse" />
      </div>
      
      {/* Logo text */}
      <div className="hidden sm:flex flex-col">
        <span className="text-xl font-bold text-gradient leading-tight">
          {t('libraryName')}
        </span>
        <span className="text-[10px] text-muted-foreground/70 tracking-wider">
          {t('librarySubtitle')}
        </span>
      </div>
    </Link>
  );
};
