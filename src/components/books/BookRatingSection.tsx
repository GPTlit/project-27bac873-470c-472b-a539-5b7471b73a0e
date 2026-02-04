import { StarRating } from '@/components/ui/star-rating';
import { useBookRating, useAuthorRating, useRateBook, useRateAuthor } from '@/hooks/useRatings';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface BookRatingSectionProps {
  bookId: string;
  authorName: string;
}

export const BookRatingSection = ({ bookId, authorName }: BookRatingSectionProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: bookRating } = useBookRating(bookId);
  const { data: authorRating } = useAuthorRating(authorName);
  const rateBook = useRateBook();
  const rateAuthor = useRateAuthor();

  const handleBookRating = async (rating: number) => {
    if (!user) {
      toast({
        title: t('error'),
        description: t('loginToComment'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await rateBook.mutateAsync({ bookId, rating });
      toast({
        title: t('success'),
        description: t('rateBook'),
      });
    } catch {
      toast({
        title: t('error'),
        variant: 'destructive',
      });
    }
  };

  const handleAuthorRating = async (rating: number) => {
    if (!user) {
      toast({
        title: t('error'),
        description: t('loginToComment'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await rateAuthor.mutateAsync({ authorName, rating });
      toast({
        title: t('success'),
        description: t('rateAuthor'),
      });
    } catch {
      toast({
        title: t('error'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-secondary/30 rounded-xl">
      {/* Book Rating */}
      <div className="space-y-2">
        <h4 className="font-semibold text-foreground">{t('rateBook')}</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('averageRating')}:</span>
            <StarRating rating={bookRating?.averageRating || 0} showValue />
            <span className="text-xs text-muted-foreground">
              ({bookRating?.totalRatings || 0} {t('ratings')})
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('yourRating')}:</span>
              <StarRating
                rating={bookRating?.userRating || 0}
                interactive
                onRatingChange={handleBookRating}
              />
            </div>
          )}
        </div>
      </div>

      {/* Author Rating */}
      <div className="space-y-2">
        <h4 className="font-semibold text-foreground">{t('rateAuthor')}</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('averageRating')}:</span>
            <StarRating rating={authorRating?.averageRating || 0} showValue />
            <span className="text-xs text-muted-foreground">
              ({authorRating?.totalRatings || 0} {t('ratings')})
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('yourRating')}:</span>
              <StarRating
                rating={authorRating?.userRating || 0}
                interactive
                onRatingChange={handleAuthorRating}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
