import { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const SOUNDS: { key: string; label: string; emoji: string; url: string }[] = [
  { key: 'rain', label: 'مطر', emoji: '🌧️', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb749cb6c.mp3' },
  { key: 'cafe', label: 'مقهى', emoji: '☕', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_270f49b83a.mp3' },
  { key: 'wind', label: 'رياح', emoji: '🍃', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_2dde668f60.mp3' },
  { key: 'desert', label: 'صحراء', emoji: '🏜️', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_6dad2d8e34.mp3' },
  { key: 'space', label: 'فضاء', emoji: '🌌', url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_347111d57a.mp3' },
];

export const AmbientPlayer = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const play = (key: string) => {
    const sound = SOUNDS.find((s) => s.key === key);
    if (!sound) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = volume;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setActive(key);
  };

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
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
                <span className="text-lg">{s.emoji}</span>
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