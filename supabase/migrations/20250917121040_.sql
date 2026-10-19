-- Create admin role system and secure RLS policies for contact_info table

-- Step 1: Create user roles system for authorization
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Step 3: Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.has_role(auth.uid(), 'admin'::app_role),
    false
  );
$$;

-- Step 4: Add secure RLS policies to contact_info table

-- Allow admins to SELECT all contact information
CREATE POLICY "Admins can view all contact info"
ON public.contact_info
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow admins to UPDATE contact information (for processing status, etc.)
CREATE POLICY "Admins can update contact info"
ON public.contact_info
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow admins to DELETE contact information if needed
CREATE POLICY "Admins can delete contact info"
ON public.contact_info
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Step 5: Add policies for user_roles table management

-- Only admins can view user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can assign roles to users
CREATE POLICY "Admins can assign user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update user roles
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can remove user roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Step 6: Create function to promote first user to admin (for initial setup)
CREATE OR REPLACE FUNCTION public.create_first_admin()
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create admin if no admins exist yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    -- Insert the first authenticated user as admin
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::app_role
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
END;
$$;;
