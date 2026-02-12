
-- Fix overly permissive INSERT policy
DROP POLICY "System can insert notifications" ON public.notifications;
