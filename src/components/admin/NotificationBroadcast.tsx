import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSendAdminNotification } from '@/hooks/useNotifications';
import { Bell, Send, Loader2 } from 'lucide-react';

export const NotificationBroadcast = () => {
  const { toast } = useToast();
  const sendNotification = useSendAdminNotification();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء العنوان والرسالة',
        variant: 'destructive',
      });
      return;
    }

    try {
      await sendNotification.mutateAsync({ title: title.trim(), message: message.trim() });
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال الإشعار لجميع المستخدمين',
      });
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Send notification error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال الإشعار',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h2 className="text-xl font-bold">إرسال إشعار للمستخدمين</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">إشعار جديد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notif-title">عنوان الإشعار *</Label>
            <Input
              id="notif-title"
              placeholder="مثال: كتاب جديد في المكتبة!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-message">نص الإشعار *</Label>
            <Textarea
              id="notif-message"
              placeholder="اكتب نص الإشعار الذي سيصل لجميع المستخدمين..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={sendNotification.isPending}
            className="w-full gap-2"
          >
            {sendNotification.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            إرسال للجميع
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
