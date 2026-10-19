-- Add policy to allow users to update their own contact info
CREATE POLICY "Users can update their own contact info" 
ON public.contact_info 
FOR UPDATE 
USING (email = (auth.jwt() ->> 'email'::text))
WITH CHECK (email = (auth.jwt() ->> 'email'::text));;
