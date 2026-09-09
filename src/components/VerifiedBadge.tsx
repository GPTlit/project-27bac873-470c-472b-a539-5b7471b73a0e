import badge from '@/assets/verified-badge.jpg.asset.json';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  title?: string;
}

/** Green verified badge — unlocked after 10 hours of reading or granted by an admin. */
export const VerifiedBadge = ({ className, title = 'قارئ موثّق' }: Props) => (
  <img
    src={badge.url}
    alt={title}
    title={title}
    className={cn('inline-block h-5 w-5 rounded-full object-cover align-middle', className)}
  />
);
