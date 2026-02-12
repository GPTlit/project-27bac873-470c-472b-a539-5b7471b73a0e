import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/hooks/useNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

export const NotificationBell = () => {
  const { user } = useAuth();
  const { data: notifications } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const { t, language } = useLanguage();

  if (!user) return null;

  const locale = language === 'ar' ? ar : language === 'fr' ? fr : enUS;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold text-sm">{t('notifications')}</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAsRead.mutate(undefined)}
            >
              {t('markAllRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 cursor-pointer hover:bg-secondary/50 transition-colors ${
                    !notif.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (!notif.is_read) markAsRead.mutate(notif.id);
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!notif.is_read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t('noNotifications')}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
