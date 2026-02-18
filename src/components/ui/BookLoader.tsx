import { cn } from "@/lib/utils";

interface BookLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export const BookLoader = ({ className, size = "md", fullScreen = false }: BookLoaderProps) => {
  const sizeMap = {
    sm: 48,
    md: 72,
    lg: 96,
  };
  const dim = sizeMap[size];

  const inner = (
    <div
      className={cn("flex items-center justify-center", className)}
      aria-label="Loading"
      role="status"
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Frosted glass / watercolor filter */}
          <filter id="blur-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.8" result="blurred" />
            <feComposite in="SourceGraphic" in2="blurred" operator="over" />
          </filter>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="page-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>

          {/* Watercolor page gradient - left pages */}
          <linearGradient id="pageLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(195,40%,82%)" stopOpacity="0.85" />
            <stop offset="50%" stopColor="hsl(210,30%,90%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(40,30%,94%)" stopOpacity="0.75" />
          </linearGradient>

          {/* Watercolor page gradient - right pages */}
          <linearGradient id="pageRight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(40,30%,94%)" stopOpacity="0.85" />
            <stop offset="50%" stopColor="hsl(195,30%,88%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(175,25%,84%)" stopOpacity="0.75" />
          </linearGradient>

          {/* Cover gradient */}
          <linearGradient id="coverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(210,35%,65%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(195,45%,55%)" stopOpacity="0.85" />
          </linearGradient>

          {/* Inner glow when open */}
          <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45,80%,92%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(195,40%,85%)" stopOpacity="0" />
          </radialGradient>

          {/* Flipping page gradient */}
          <linearGradient id="flipPage1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(195,45%,78%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(40,35%,92%)" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="flipPage2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(175,35%,80%)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="hsl(210,30%,90%)" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="flipPage3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(40,40%,88%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(195,35%,82%)" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* ── Book body (open) ── */}
        {/* Left half */}
        <rect
          x="8"
          y="18"
          width="27"
          height="36"
          rx="2"
          fill="url(#pageLeft)"
          filter="url(#blur-soft)"
          className="book-left-page"
        />
        {/* Right half */}
        <rect
          x="37"
          y="18"
          width="27"
          height="36"
          rx="2"
          fill="url(#pageRight)"
          filter="url(#blur-soft)"
          className="book-right-page"
        />

        {/* Inner glow */}
        <ellipse
          cx="36"
          cy="36"
          rx="22"
          ry="16"
          fill="url(#innerGlow)"
          className="book-inner-glow"
        />

        {/* Spine line */}
        <line
          x1="36"
          y1="18"
          x2="36"
          y2="54"
          stroke="hsl(210,25%,72%)"
          strokeWidth="1"
          strokeOpacity="0.6"
          filter="url(#blur-soft)"
        />

        {/* Subtle page lines - left */}
        <line x1="14" y1="26" x2="30" y2="26" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="14" y1="31" x2="30" y2="31" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="14" y1="36" x2="30" y2="36" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.35" />
        <line x1="14" y1="41" x2="30" y2="41" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="14" y1="46" x2="30" y2="46" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.25" />

        {/* Subtle page lines - right */}
        <line x1="42" y1="26" x2="58" y2="26" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="42" y1="31" x2="58" y2="31" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="42" y1="36" x2="58" y2="36" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.35" />
        <line x1="42" y1="41" x2="58" y2="41" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="42" y1="46" x2="58" y2="46" stroke="hsl(210,20%,75%)" strokeWidth="0.5" strokeOpacity="0.25" />

        {/* ── Flipping pages (animated) ── */}
        {/* Page 1 */}
        <g className="flip-page-1">
          <path
            d="M36 19 Q44 27 44 36 Q44 45 36 53"
            stroke="url(#flipPage1)"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            filter="url(#page-blur)"
            opacity="0.75"
          />
        </g>
        {/* Page 2 */}
        <g className="flip-page-2">
          <path
            d="M36 19 Q43 26 43 36 Q43 46 36 53"
            stroke="url(#flipPage2)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            filter="url(#page-blur)"
            opacity="0.65"
          />
        </g>
        {/* Page 3 */}
        <g className="flip-page-3">
          <path
            d="M36 19 Q41 27 41 36 Q41 45 36 53"
            stroke="url(#flipPage3)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            filter="url(#page-blur)"
            opacity="0.55"
          />
        </g>

        {/* Outer book outline - very soft */}
        <rect
          x="8"
          y="18"
          width="56"
          height="36"
          rx="3"
          fill="none"
          stroke="hsl(210,30%,70%)"
          strokeWidth="0.8"
          strokeOpacity="0.35"
          filter="url(#blur-soft)"
        />
      </svg>

      <style>{`
        /* Book open pulse */
        .book-left-page,
        .book-right-page {
          animation: bookPulse 1.8s ease-in-out infinite;
        }
        .book-right-page {
          animation-delay: 0.05s;
        }
        @keyframes bookPulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }

        /* Inner glow breathe */
        .book-inner-glow {
          animation: glowBreathe 1.8s ease-in-out infinite;
        }
        @keyframes glowBreathe {
          0%, 100% { opacity: 0.4; rx: 20; ry: 14; }
          50% { opacity: 0.75; rx: 24; ry: 18; }
        }

        /* Flip page 1 */
        .flip-page-1 {
          animation: flipArc1 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: 36px 36px;
        }
        @keyframes flipArc1 {
          0%   { transform: scaleX(1);   opacity: 0; }
          10%  { opacity: 0.75; }
          50%  { transform: scaleX(-0.05); opacity: 0.6; }
          90%  { opacity: 0.1; }
          100% { transform: scaleX(-1);  opacity: 0; }
        }

        /* Flip page 2 */
        .flip-page-2 {
          animation: flipArc2 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: 0.22s;
          transform-origin: 36px 36px;
        }
        @keyframes flipArc2 {
          0%   { transform: scaleX(1);   opacity: 0; }
          10%  { opacity: 0.65; }
          50%  { transform: scaleX(-0.05); opacity: 0.5; }
          90%  { opacity: 0.1; }
          100% { transform: scaleX(-1);  opacity: 0; }
        }

        /* Flip page 3 */
        .flip-page-3 {
          animation: flipArc3 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: 0.44s;
          transform-origin: 36px 36px;
        }
        @keyframes flipArc3 {
          0%   { transform: scaleX(1);   opacity: 0; }
          10%  { opacity: 0.55; }
          50%  { transform: scaleX(-0.05); opacity: 0.4; }
          90%  { opacity: 0.1; }
          100% { transform: scaleX(-1);  opacity: 0; }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {/* Frosted glass card */}
          <div
            className="rounded-3xl p-8 flex items-center justify-center"
            style={{
              background: "hsl(var(--card) / 0.55)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid hsl(var(--border) / 0.3)",
              boxShadow: "0 8px 40px hsl(var(--primary) / 0.08), 0 2px 12px hsl(var(--overlay) / 0.06)",
            }}
          >
            <BookLoader size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return inner;
};

export default BookLoader;
