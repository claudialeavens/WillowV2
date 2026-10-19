-- Allow authenticated users to view contact info matching their email
CREATE POLICY "Users can view their own contact info" 
ON public.contact_info 
FOR SELECT 
TO authenticated
USING (email = auth.jwt()->>'email');;
