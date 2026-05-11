// New optional features. Capacitor-compatible when @capacitor/filesystem is installed,
// gracefully falls back to web APIs otherwise. Does not modify any existing code.

const OFFLINE_STORE_KEY = 'maktaba-offline-data';

async function tryCapacitorFs(): Promise<any | null> {
  try {
    // Dynamic import so this works whether or not Capacitor is installed
    const mod: any = await import(/* @vite-ignore */ '@capacitor/filesystem');
    return mod;
  } catch {
    return null;
  }
}

/**
 * Save a text file. On Capacitor (Android/iOS) writes to Documents directory.
 * On web, triggers a browser download.
 */
export async function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<{ ok: boolean; path?: string; error?: string }> {
  const fsMod = await tryCapacitorFs();
  if (fsMod?.Filesystem && fsMod?.Directory && fsMod?.Encoding) {
    try {
      const res = await fsMod.Filesystem.writeFile({
        path: filename,
        data: content,
        directory: fsMod.Directory.Documents,
        encoding: fsMod.Encoding.UTF8,
        recursive: true,
      });
      return { ok: true, path: res?.uri };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Capacitor write failed' };
    }
  }

  // Web fallback
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Download failed' };
  }
}

/** Save arbitrary serializable data locally for offline use. */
export function saveOfflineData(key: string, value: unknown): boolean {
  try {
    const raw = localStorage.getItem(OFFLINE_STORE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[key] = { value, savedAt: new Date().toISOString() };
    localStorage.setItem(OFFLINE_STORE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    console.error('saveOfflineData failed', e);
    return false;
  }
}

export function getOfflineData<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(OFFLINE_STORE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw);
    return (store[key]?.value ?? null) as T | null;
  } catch {
    return null;
  }
}

export function removeOfflineData(key: string): void {
  try {
    const raw = localStorage.getItem(OFFLINE_STORE_KEY);
    if (!raw) return;
    const store = JSON.parse(raw);
    delete store[key];
    localStorage.setItem(OFFLINE_STORE_KEY, JSON.stringify(store));
  } catch {
    /* noop */
  }
}

/** Audio recording hook scaffolding — UI-ready, backend recording not finalized. */
export interface AudioRecorderHandle {
  start: () => Promise<{ ok: boolean; error?: string }>;
  stop: () => Promise<{ ok: boolean; blob?: Blob; error?: string }>;
  isRecording: () => boolean;
}

export function createAudioRecorder(): AudioRecorderHandle {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: BlobPart[] = [];
  let recording = false;

  return {
    isRecording: () => recording,
    async start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          return { ok: false, error: 'Microphone API not available' };
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.start();
        recording = true;
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message || 'Recording failed' };
      }
    },
    async stop() {
      if (!mediaRecorder || !recording) return { ok: false, error: 'Not recording' };
      return new Promise((resolve) => {
        mediaRecorder!.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
          mediaRecorder = null;
          recording = false;
          resolve({ ok: true, blob });
        };
        mediaRecorder!.stop();
      });
    },
  };
}