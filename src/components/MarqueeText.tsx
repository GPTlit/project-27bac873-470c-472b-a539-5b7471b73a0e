import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeTextProps {
  text: string;
  className?: string;
}

export const MarqueeText = ({ text, className }: MarqueeTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const check = () => {
      if (!containerRef.current || !contentRef.current) return;
      setOverflow(contentRef.current.scrollWidth > containerRef.current.clientWidth + 2);
    };
    check();
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text]);

  if (!overflow) {
    return (
      <div ref={containerRef} className={cn('overflow-hidden', className)}>
        <span ref={contentRef} className="block truncate">{text}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('marquee', className)}>
      <div className="marquee__track">
        <span ref={contentRef}>{text}</span>
        <span aria-hidden="true">{text}</span>
      </div>
    </div>
  );
};