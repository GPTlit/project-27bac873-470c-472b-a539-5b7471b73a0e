import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Counts the time a signed-in reader spends on a reading screen and reports it
 * to the backend every minute. 10 accumulated hours unlock the verified badge.
 */
export const useReadingTime = (active = true) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const secondsRef = useRef(0);

  useEffect(() => {
    if (!user || !active) return;

    const tick = setInterval(() => {
      if (document.visibilityState === 'visible') secondsRef.current += 10;
    }, 10000);

    const flush = async () => {
      const seconds = secondsRef.current;
      if (seconds <= 0) return;
      secondsRef.current = 0;
      try {
        await supabase.rpc('add_reading_time', { _seconds: seconds });
        qc.invalidateQueries({ queryKey: ['user-profile', user.id] });
      } catch {
        /* ignore transient failures */
      }
    };

    const push = setInterval(flush, 60000);

    return () => {
      clearInterval(tick);
      clearInterval(push);
      void flush();
    };
  }, [user, active, qc]);
};
