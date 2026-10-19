-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop and recreate the cron job to fix any issues
SELECT cron.unschedule('process-scheduled-reminders');

-- Recreate the cron job with proper configuration
SELECT cron.schedule(
  'process-scheduled-reminders',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://bzeqbpexjhjcjeamqsjq.supabase.co/functions/v1/process-scheduled-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZXFicGV4amhqY2plYW1xc2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MzE5NjEsImV4cCI6MjA3MzIwNzk2MX0.q9kNcdLWDe9szRr0qqGpi8Ddi1gFmkl-Q2UTCCFzjkg"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  );
  $$
);;
