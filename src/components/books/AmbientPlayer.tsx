import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  Loader2, Music, Volume2, VolumeX, X, Upload,
  CloudRain, Waves, Wind, Flame, Coffee, Sun, Sparkles, Piano, Brain,
  type LucideProps,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

type SoundDef = {
  key: string;
  label: string;
  Icon: ComponentType<LucideProps>;
  url: string;
};

const SOUNDS: SoundDef[] = [
  { key: 'rain',   label: 'مطر',   Icon: CloudRain, url: '/audio/ambient/rain.mp3' },
  { key: 'ocean',  label: 'بحر',   Icon: Waves,     url: '/audio/ambient/ocean.mp3' },
  { key: 'wind',   label: 'رياح',  Icon: Wind,      url: '/audio/ambient/wind.mp3' },
  { key: 'fire',   label: 'موقد',  Icon: Flame,     url: '/audio/ambient/fire.mp3' },
  { key: 'cafe',   label: 'مقهى',  Icon: Coffee,    url: '/audio/ambient/cafe.mp3' },
  { key: 'desert', label: 'صحراء', Icon: Sun,       url: '/audio/ambient/desert.mp3' },
  { key: 'space',  label: 'فضاء',  Icon: Sparkles,  url: '/audio/ambient/space.mp3' },
  { key: 'piano',  label: 'بيانو', Icon: Piano,     url: '/audio/ambient/piano.mp3' },
  { key: 'pad',    label: 'تأمل',  Icon: Brain,     url: '/audio/ambient/pad.mp3' },
];

export const AmbientPlayer = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const customUrlRef = useRef<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const play = async (key: string) => {
    const sound = SOUNDS.find((s) => s.key === key);
    if (!sound) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setLoading(key);
    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;
    audio.addEventListener('error', () => {
      if (audioRef.current === audio) audioRef.current = null;
      setLoading(null);
      setActive(null);
    }, { once: true });
    try {
      await audio.play();
      setActive(key);
    } catch {
      if (audioRef.current === audio) audioRef.current = null;
      setActive(null);
    } finally {
      setLoading(null);
    }
  };

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setLoading(null);
    setActive(null);
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // Cleanup custom audio object URL
  useEffect(() => () => {
    if (customUrlRef.current) {
      try { URL.revokeObjectURL(customUrlRef.current); } catch {}
    }
  }, []);

  const playCustom = async (file: File) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (customUrlRef.current) {
      try { URL.revokeObjectURL(customUrlRef.current); } catch {}
    }
    const url = URL.createObjectURL(file);
    customUrlRef.current = url;
    setCustomName(file.name);
    setLoading('custom');
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    try {
      await audio.play();
      setActive('custom');
    } catch {
      setActive(null);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {open ? (
        <div className="bg-card/90 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-3 w-72 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">صوت محيط</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-1 mb-3">
            {SOUNDS.map((s) => (
              <button
                key={s.key}
                onClick={() => (active === s.key ? stop() : play(s.key))}
                aria-label={s.label}
                aria-pressed={active === s.key}
                title={s.label}
                className={`flex flex-col items-center justify-center gap-1 p-2 min-h-[3.25rem] rounded-lg border transition-all text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active === s.key
                    ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                    : 'border-border/60 bg-background/60 text-foreground hover:bg-secondary hover:border-border'
                }`}
              >
                {loading === s.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <s.Icon className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="text-[10px] leading-none">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            <Slider value={[volume * 100]} onValueChange={(v) => setVolume(v[0] / 100)} max={100} step={5} />
          </div>
          <div className="mt-2 pt-2 border-t border-border/50">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) playCustom(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => (active === 'custom' ? stop() : fileInputRef.current?.click())}
              className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors text-xs ${
                active === 'custom' ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
              }`}
              title="أضف موسيقى من جهازك"
            >
              {loading === 'custom' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              <span className="truncate">
                {active === 'custom' && customName ? `▶ ${customName}` : 'موسيقى من جهازك'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className={`rounded-full shadow-lg ${active ? 'bg-primary/10 border-primary' : ''}`}
          title="صوت محيط"
        >
          <Music className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
        </Button>
      )}
    </div>
  );
};