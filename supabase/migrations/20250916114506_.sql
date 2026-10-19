-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add columns to track reminder history
ALTER TABLE public.contact_info 
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_contact_info_reminders 
ON public.contact_info (last_reminder_sent, reminder_preferences);

-- Create function to calculate next reminder time
CREATE OR REPLACE FUNCTION calculate_next_reminder(
  last_sent TIMESTAMP WITH TIME ZONE,
  preferences JSONB,
  created_date TIMESTAMP WITH TIME ZONE
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  frequency TEXT;
  frequency_number INTEGER;
  reminder_time TIME;
  end_type TEXT;
  end_occurrences INTEGER;
  week_days TEXT[];
  next_reminder TIMESTAMP WITH TIME ZONE;
  base_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Extract preferences
  frequency := preferences->>'frequency';
  frequency_number := COALESCE((preferences->>'frequencyNumber')::INTEGER, 1);
  reminder_time := COALESCE((preferences->>'reminderTime')::TIME, '09:00'::TIME);
  end_type := COALESCE(preferences->>'endType', 'never');
  end_occurrences := COALESCE((preferences->>'endOccurrences')::INTEGER, 10);
  week_days := ARRAY(SELECT jsonb_array_elements_text(preferences->'weekDays'));

  -- Use last sent time or created date as base
  base_date := COALESCE(last_sent, created_date);

  -- Calculate next reminder based on frequency
  CASE frequency
    WHEN 'daily' THEN
      next_reminder := base_date + (frequency_number || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      next_reminder := base_date + (frequency_number || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN
      next_reminder := base_date + (frequency_number || ' months')::INTERVAL;
    WHEN 'yearly' THEN
      next_reminder := base_date + (frequency_number || ' years')::INTERVAL;
    ELSE
      next_reminder := base_date + '1 day'::INTERVAL;
  END CASE;

  -- Set the time of day
  next_reminder := date_trunc('day', next_reminder) + reminder_time;

  -- For weekly reminders, adjust for specific days if needed
  IF frequency = 'weekly' AND array_length(week_days, 1) > 0 THEN
    -- This is a simplified version - would need more complex logic for specific days
    next_reminder := next_reminder;
  END IF;

  RETURN next_reminder;
END;
$$ LANGUAGE plpgsql;;
