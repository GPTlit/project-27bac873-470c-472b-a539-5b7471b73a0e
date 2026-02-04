import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useBooks, Book } from '@/hooks/useBooks';
import { useLanguage } from '@/contexts/LanguageContext';

interface BookRecommendationsProps {
  currentBook: Book;
}

export const BookRecommendations = ({ currentBook }: BookRecommendationsProps) => {
  const { t } = useLanguage();
  const { data: allBooks = [] } = useBooks();

  // Filter out current book and find recommendations
  const otherBooks = allBooks.filter(book => book.id !== currentBook.id);

  // Books by same author
  const sameAuthorBooks = otherBooks
    .filter(book => book.author === currentBook.author)
    .slice(0, 4);

  // Books in same category
  const sameCategoryBooks = otherBooks
    .filter(book => {
      const bookCategories = book.categories || [book.category];
      const currentCategories = currentBook.categories || [currentBook.category];
      return bookCategories.some(cat => currentCategories.includes(cat));
    })
    .filter(book => !sameAuthorBooks.find(b => b.id === book.id))
    .slice(0, 4);

  // Similar books (by description keywords - simple matching)
  const currentWords = (currentBook.description || '').toLowerCase().split(/\s+/);
  const similarBooks = otherBooks
    .filter(book => !sameAuthorBooks.find(b => b.id === book.id))
    .filter(book => !sameCategoryBooks.find(b => b.id === book.id))
    .map(book => {
      const bookWords = (book.description || '').toLowerCase().split(/\s+/);
      const commonWords = currentWords.filter(w => w.length > 3 && bookWords.includes(w));
      return { book, score: commonWords.length };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.book);

  const BookGrid = ({ books, title }: { books: Book[]; title: string }) => {
    if (books.length === 0) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {books.map((book) => (
            <Link
              key={book.id}
              to={`/book/${book.id}`}
              className="group"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden book-shadow mb-2 bg-secondary">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h5 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {book.title}
              </h5>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {book.author}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const hasRecommendations = sameAuthorBooks.length > 0 || sameCategoryBooks.length > 0 || similarBooks.length > 0;

  if (!hasRecommendations) return null;

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-foreground">{t('youMayAlsoLike')}</h3>
      <BookGrid books={sameAuthorBooks} title={t('sameAuthor')} />
      <BookGrid books={sameCategoryBooks} title={t('sameCategory')} />
      <BookGrid books={similarBooks} title={t('similarBooks')} />
    </div>
  );
};
