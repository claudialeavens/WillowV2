-- Update cron job to run every 5 minutes instead of hourly for better reminder accuracy
SELECT cron.unschedule('process-scheduled-reminders');

SELECT cron.schedule(
  'process-scheduled-reminders',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT extensions.net.http_post(
    url := 'https://bzeqbpexjhjcjeamqsjq.supabase.co/functions/v1/process-scheduled-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZXFicGV4amhqY2plYW1xc2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MzE5NjEsImV4cCI6MjA3MzIwNzk2MX0.q9kNcdLWDe9szRr0qqGpi8Ddi1gFmkl-Q2UTCCFzjkg"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Add processing status to prevent duplicate sends within 5-minute windows
ALTER TABLE contact_info 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMP WITH TIME ZONE;;
