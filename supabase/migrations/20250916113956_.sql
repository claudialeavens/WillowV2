-- Add reminder_preferences to contact_info to store scheduling options
ALTER TABLE public.contact_info
ADD COLUMN IF NOT EXISTS reminder_preferences JSONB;;
