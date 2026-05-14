import { useEffect, useRef, useState } from 'react';
import { Loader2, Music, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const SOUNDS: { key: string; label: string; emoji: string; url: string }[] = [
  { key: 'rain',   label: 'مطر',     emoji: '🌧️', url: '/audio/ambient/rain.mp3' },
  { key: 'ocean',  label: 'بحر',     emoji: '🌊', url: '/audio/ambient/ocean.mp3' },
  { key: 'wind',   label: 'رياح',    emoji: '🍃', url: '/audio/ambient/wind.mp3' },
  { key: 'fire',   label: 'موقد',    emoji: '🔥', url: '/audio/ambient/fire.mp3' },
  { key: 'cafe',   label: 'مقهى',    emoji: '☕', url: '/audio/ambient/cafe.mp3' },
  { key: 'desert', label: 'صحراء',   emoji: '🏜️', url: '/audio/ambient/desert.mp3' },
  { key: 'space',  label: 'فضاء',    emoji: '🌌', url: '/audio/ambient/space.mp3' },
  { key: 'piano',  label: 'بيانو',   emoji: '🎹', url: '/audio/ambient/piano.mp3' },
  { key: 'pad',    label: 'تأمل',    emoji: '🧘', url: '/audio/ambient/pad.mp3' },
];

export const AmbientPlayer = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {open ? (
        <div className="bg-card/90 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-3 w-64 animate-fade-in">
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
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors text-xs ${
                  active === s.key ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
                }`}
                title={s.label}
              >
                <span className="text-lg">{loading === s.key ? <Loader2 className="h-4 w-4 animate-spin" /> : s.emoji}</span>
                <span className="text-[10px]">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            <Slider value={[volume * 100]} onValueChange={(v) => setVolume(v[0] / 100)} max={100} step={5} />
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