-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.trigger_reminder_processing()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result json;
BEGIN
  SELECT extensions.net.http_post(
    url := 'https://bzeqbpexjhjcjeamqsjq.supabase.co/functions/v1/process-scheduled-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZXFicGV4amhqY2plYW1xc2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MzE5NjEsImV4cCI6MjA3MzIwNzk2MX0.q9kNcdLWDe9szRr0qqGpi8Ddi1gFmkl-Q2UTCCFzjkg"}'::jsonb,
    body := '{"trigger": "manual"}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;;
