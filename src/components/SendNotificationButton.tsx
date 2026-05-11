import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendLocalNotification } from '@/lib/localNotifications';

interface Props {
  title?: string;
  body?: string;
  label?: string;
}

export const SendNotificationButton = ({
  title = 'مكتبة موريتانيا',
  body = 'You have a new update or saved file',
  label = 'Send Notification',
}: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    const res = await sendLocalNotification({ title, body });
    setBusy(false);
    toast({
      title: res.ok ? 'تم إرسال الإشعار' : 'تعذّر إرسال الإشعار',
      description: res.ok ? undefined : res.error,
      variant: res.ok ? 'default' : 'destructive',
    });
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Bell />}
      {label}
    </Button>
  );
};

export default SendNotificationButton;