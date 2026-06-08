import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useIsFollowing, useToggleFollow } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const FollowButton = ({ authorId }: { authorId: string }) => {
  const { user } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();
  const { data: isFollowing } = useIsFollowing(authorId);
  const m = useToggleFollow();

  if (user?.id === authorId) return null;

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={() => {
        if (!user) { toast({ title: 'سجل دخولك أولاً' }); nav('/auth'); return; }
        m.mutate({ authorId, isFollowing: !!isFollowing });
      }}
      disabled={m.isPending}
    >
      {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {isFollowing ? 'تتابع' : 'تابع'}
    </Button>
  );
};