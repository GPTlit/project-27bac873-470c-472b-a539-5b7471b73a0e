import { X, Youtube, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type Media = { type: 'image' | 'youtube'; url: string };

const toYoutubeEmbed = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {}
  return null;
};

export const MediaBlock = ({ media, onRemove }: { media: Media; onRemove?: () => void }) => {
  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
      {media.type === 'image' ? (
        <img src={media.url} alt="" className="w-full max-h-[420px] object-contain bg-black/5" />
      ) : (
        <div className="aspect-video">
          {toYoutubeEmbed(media.url) ? (
            <iframe className="w-full h-full" src={toYoutubeEmbed(media.url)!} title="YouTube" allowFullScreen />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">رابط يوتيوب غير صحيح</div>
          )}
        </div>
      )}
      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur rounded-md px-2 py-0.5 text-xs flex items-center gap-1 text-muted-foreground">
        {media.type === 'image' ? <ImageIcon className="h-3 w-3" /> : <Youtube className="h-3 w-3" />}
        {media.type === 'image' ? 'صورة' : 'يوتيوب'}
      </div>
      {onRemove && (
        <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7" onClick={onRemove} aria-label="إزالة">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};