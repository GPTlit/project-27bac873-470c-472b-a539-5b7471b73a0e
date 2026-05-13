import { useEffect, useMemo, useState } from 'react';
import { Bell, Camera, CheckCircle2, Images, Loader2, Mic, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { registerForPushNotifications } from '@/lib/pushNotifications';

const PROMPT_KEY = 'maktaba-device-permissions-v1';

export const DevicePermissionPrompt = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { permissions, requestPermission, isRequesting } = usePermissions();
  const [open, setOpen] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem(PROMPT_KEY);
    if (!seen) {
      const timer = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(timer);
    }
  }, [user]);

  const items = useMemo(() => [
    { key: 'notifications' as const, label: 'الإشعارات', icon: Bell, granted: permissions.notifications },
    { key: 'microphone' as const, label: 'الميكروفون', icon: Mic, granted: permissions.microphone },
    { key: 'audio' as const, label: 'الموسيقى والصوت', icon: Music, granted: permissions.audio },
    { key: 'photos' as const, label: 'الصور', icon: Images, granted: permissions.photos },
    { key: 'videos' as const, label: 'الفيديو', icon: Video, granted: permissions.videos },
    { key: 'camera' as const, label: 'الكاميرا', icon: Camera, granted: permissions.camera },
  ], [permissions]);

  const requestAll = async () => {
    for (const item of items) {
      await requestPermission(item.key);
    }
    setPushBusy(true);
    const push = await registerForPushNotifications();
    setPushBusy(false);
    if (push.ok) {
      toast({ title: 'تم تفعيل إشعارات الجهاز' });
    } else if (push.error) {
      toast({ title: 'تعذّر تفعيل إشعارات خارج التطبيق', description: push.error, variant: 'destructive' });
    }
    localStorage.setItem(PROMPT_KEY, 'done');
    setOpen(false);
  };

  const skip = () => {
    localStorage.setItem(PROMPT_KEY, 'skipped');
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">أذونات مكتبة موريتانيا</DialogTitle>
          <DialogDescription className="text-right">
            فعّل الأذونات حتى تعمل القراءة الصوتية، التسجيل، الوسائط، والتنبيهات خارج التطبيق.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                variant="outline"
                className="h-auto justify-start gap-2 py-3"
                onClick={() => requestPermission(item.key)}
                disabled={isRequesting || pushBusy}
              >
                {item.granted ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Icon className="h-4 w-4" />}
                <span className="text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="ghost" onClick={skip}>لاحقاً</Button>
          <Button onClick={requestAll} disabled={isRequesting || pushBusy} className="gap-2">
            {(isRequesting || pushBusy) && <Loader2 className="h-4 w-4 animate-spin" />}
            تفعيل الكل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DevicePermissionPrompt;
