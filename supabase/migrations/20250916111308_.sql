-- Create table for storing contact information
CREATE TABLE IF NOT EXISTS public.contact_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to insert contact info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_info'
      AND policyname = 'Anyone can insert contact info'
  ) THEN
    CREATE POLICY "Anyone can insert contact info"
    ON public.contact_info
    FOR INSERT
    TO public
    WITH CHECK (true);
  END IF;
END $$;;
