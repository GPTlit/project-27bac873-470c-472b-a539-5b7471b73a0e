import { Link } from 'react-router-dom';

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative flex h-12 w-12 items-center justify-center">
        {/* Outer decorative ring */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-accent to-primary/80 opacity-20 group-hover:opacity-30 transition-opacity" />
        
        {/* Main logo container */}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg gold-gradient shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          {/* Open book icon - custom SVG */}
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-primary-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Left page */}
            <path d="M2 6s2-2 5-2c3 0 5 2 5 2v14s-2-1-5-1-5 1-5 1V6z" fill="currentColor" opacity="0.3" />
            {/* Right page */}
            <path d="M12 6s2-2 5-2c3 0 5 2 5 2v14s-2-1-5-1-5 1-5 1V6z" fill="currentColor" opacity="0.5" />
            {/* Spine */}
            <path d="M12 6v14" strokeWidth="2" />
            {/* Decorative star/sparkle */}
            <circle cx="7" cy="10" r="0.5" fill="currentColor" />
            <circle cx="17" cy="10" r="0.5" fill="currentColor" />
            <path d="M7 13h3M14 13h3" strokeWidth="1" opacity="0.7" />
          </svg>
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
