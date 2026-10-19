-- Create cron job to process scheduled reminders every hour
SELECT cron.schedule(
  'process-scheduled-reminders',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://bzeqbpexjhjcjeamqsjq.supabase.co/functions/v1/process-scheduled-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZXFicGV4amhqY2plYW1xc2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MzE5NjEsImV4cCI6MjA3MzIwNzk2MX0.q9kNcdLWDe9szRr0qqGpi8Ddi1gFmkl-Q2UTCCFzjkg"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Also create a manual trigger function for testing/debugging
CREATE OR REPLACE FUNCTION public.trigger_reminder_processing()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT net.http_post(
    url := 'https://bzeqbpexjhjcjeamqsjq.supabase.co/functions/v1/process-scheduled-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZXFicGV4amhqY2plYW1xc2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MzE5NjEsImV4cCI6MjA3MzIwNzk2MX0.q9kNcdLWDe9szRr0qqGpi8Ddi1gFmkl-Q2UTCCFzjkg"}'::jsonb,
    body := '{"trigger": "manual"}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;;
