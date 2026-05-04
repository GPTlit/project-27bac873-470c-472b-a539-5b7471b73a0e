import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

let cachedCity: string | null | undefined = undefined;
const getCity = async (): Promise<string | null> => {
  if (cachedCity !== undefined) return cachedCity;
  try {
    const r = await fetch('https://ipapi.co/json/');
    const j = await r.json();
    cachedCity = j?.city || null;
  } catch { cachedCity = null; }
  return cachedCity;
};

export const useReadingPresence = (bookId: string | undefined) => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user || !bookId) return;
    let cancelled = false;
    const ping = async () => {
      const city = await getCity();
      if (cancelled) return;
      await supabase.from('reading_sessions').upsert(
        { book_id: bookId, user_id: user.id, city, last_seen_at: new Date().toISOString() },
        { onConflict: 'book_id,user_id' },
      );
    };
    ping();
    const interval = setInterval(ping, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [bookId, user?.id]);
};