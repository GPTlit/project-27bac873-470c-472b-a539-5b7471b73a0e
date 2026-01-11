import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Book as MockBook } from '@/lib/types';
import { Book as DbBook } from '@/hooks/useBooks';

// Accept both the mock Book type and database Book type
type AnyBook = MockBook | DbBook | {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  cover_url?: string | null;
  featured?: boolean;
  category?: string;
};

interface BookCardProps {
  book: AnyBook;
  index?: number;
}

export const BookCard = ({ book, index = 0 }: BookCardProps) => {
  // Handle both coverUrl (mock) and cover_url (database)
  const coverImage = ('coverUrl' in book && book.coverUrl) || 
                     ('cover_url' in book && book.cover_url) || 
                     '/placeholder.svg';
  
  return (
    <Link
      to={`/book/${book.id}`}
      className="group block animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative">
        {/* Book Cover */}
        <div className={cn(
          "relative aspect-[3/4] rounded-xl overflow-hidden",
          "book-shadow book-hover"
        )}>
          <img
            src={coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-brown/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-primary-foreground font-medium px-4 py-2 rounded-lg bg-primary/90">
              اقرأ الآن
            </span>
          </div>

          {/* Featured Badge */}
          {'featured' in book && book.featured && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md gold-gradient text-xs font-medium text-primary-foreground">
              مميز
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="mt-4">
          <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {book.author}
          </p>
        </div>
      </div>
    </Link>
  );
};
