import { Link } from 'react-router-dom';
import { BookText, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Story } from '@/hooks/useStories';

export const StoryCard = ({ story }: { story: Story }) => {
  return (
    <Link
      to={`/story/${story.id}`}
      className="group block rounded-xl border border-border bg-card hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="aspect-[2/3] bg-muted relative">
        {story.cover_url ? (
          <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <BookText className="h-10 w-10" />
          </div>
        )}
        {story.mature && (
          <Badge variant="destructive" className="absolute top-2 right-2 gap-1">
            <Lock className="h-3 w-3" /> +18
          </Badge>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{story.title}</h3>
        {story.category && <p className="text-xs text-muted-foreground mt-1">{story.category}</p>}
      </div>
    </Link>
  );
};