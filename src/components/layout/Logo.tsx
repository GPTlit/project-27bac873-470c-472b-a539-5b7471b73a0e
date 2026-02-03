import { Link } from 'react-router-dom';
import libraryLogo from '@/assets/library-logo.jpg';

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative flex h-12 w-12 items-center justify-center">
        {/* Main logo container */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-primary/30">
          <img
            src={libraryLogo}
            alt="مكتبة موريتانيا"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Floating sparkle decoration */}
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent/60 animate-pulse" />
      </div>
      
      {/* Logo text */}
      <div className="hidden sm:flex flex-col">
        <span className="text-xl font-bold text-gradient leading-tight">
          مكتبة موريتانيا
        </span>
        <span className="text-[10px] text-muted-foreground/70 tracking-wider">
          MAURITANIA LIBRARY
        </span>
      </div>
    </Link>
  );
};
