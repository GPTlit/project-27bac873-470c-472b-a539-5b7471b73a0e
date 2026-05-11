import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Save, Mic, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  downloadTextFile,
  saveOfflineData,
  createAudioRecorder,
  type AudioRecorderHandle,
} from '@/lib/capacitorFeatures';

interface Props {
  filename?: string;
  content?: string;
  storageKey?: string;
  data?: unknown;
}

export const DeviceFeaturesPanel = ({
  filename = 'note.txt',
  content = 'Hello from Mauritania Library',
  storageKey = 'last-note',
  data,
}: Props) => {
  const { toast } = useToast();
  const recorderRef = useRef<AudioRecorderHandle | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<null | 'download' | 'save' | 'record'>(null);

  const handleDownload = async () => {
    setBusy('download');
    const res = await downloadTextFile(filename, content);
    setBusy(null);
    toast({
      title: res.ok ? 'تم الحفظ' : 'تعذّر الحفظ',
      description: res.ok ? res.path || 'تم تنزيل الملف' : res.error,
      variant: res.ok ? 'default' : 'destructive',
    });
  };

  const handleSaveOffline = () => {
    setBusy('save');
    const ok = saveOfflineData(storageKey, data ?? content);
    setBusy(null);
    toast({
      title: ok ? 'محفوظ للاستخدام دون اتصال' : 'فشل الحفظ',
      variant: ok ? 'default' : 'destructive',
    });
  };

  const handleRecord = async () => {
    if (!recorderRef.current) recorderRef.current = createAudioRecorder();
    setBusy('record');
    if (!recording) {
      const res = await recorderRef.current.start();
      setBusy(null);
      if (res.ok) {
        setRecording(true);
        toast({ title: 'بدأ التسجيل' });
      } else {
        toast({ title: 'تعذّر التسجيل', description: res.error, variant: 'destructive' });
      }
    } else {
      const res = await recorderRef.current.stop();
      setBusy(null);
      setRecording(false);
      toast({
        title: res.ok ? 'تم إيقاف التسجيل' : 'خطأ',
        description: res.ok ? `الحجم: ${res.blob?.size ?? 0} بايت` : res.error,
        variant: res.ok ? 'default' : 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={handleDownload} disabled={busy === 'download'}>
        {busy === 'download' ? <Loader2 className="animate-spin" /> : <Download />}
        تنزيل ملف
      </Button>
      <Button variant="outline" onClick={handleSaveOffline} disabled={busy === 'save'}>
        {busy === 'save' ? <Loader2 className="animate-spin" /> : <Save />}
        حفظ دون اتصال
      </Button>
      <Button
        variant={recording ? 'destructive' : 'outline'}
        onClick={handleRecord}
        disabled={busy === 'record'}
      >
        {recording ? <Square /> : <Mic />}
        {recording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
      </Button>
    </div>
  );
};

export default DeviceFeaturesPanel;