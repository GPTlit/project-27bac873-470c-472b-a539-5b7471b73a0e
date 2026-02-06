import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookLikes, useToggleBookLike } from '@/hooks/useBookLikes';
import { useFeature } from '@/hooks/useAppConfig';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';

interface LikeButtonProps {
  bookId: string;
  showCount?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export const LikeButton = ({ bookId, showCount = true, size = 'default' }: LikeButtonProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const likesEnabled = useFeature('book_likes');
  
  const { data: likesData, isLoading } = useBookLikes(bookId);
  const toggleLike = useToggleBookLike();

  if (!likesEnabled) return null;

  const handleToggle = async () => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: t('loginToLike'),
        action: (
          <Button size="sm" onClick={() => navigate('/auth')}>
            {t('login')}
          </Button>
        ),
      });
      return;
    }
    try {
      await toggleLike.mutateAsync({ 
        bookId, 
        isLiked: likesData?.userLiked || false 
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggle}
      disabled={toggleLike.isPending}
      className="gap-2"
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          likesData?.userLiked ? 'fill-red-500 text-red-500' : ''
        }`}
      />
      {showCount && <span>{likesData?.count || 0}</span>}
    </Button>
  );
};
