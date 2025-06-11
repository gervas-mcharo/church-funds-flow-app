
-- Create a security definer function to check if the current user has admin privileges
CREATE OR REPLACE FUNCTION public.current_user_has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_administrator', 'administrator')
  )
$$;

-- Create RLS policies for user_roles table

-- Policy for SELECT: Admins can view all roles, users can view their own
CREATE POLICY "Users can view roles with proper permissions" 
  ON public.user_roles 
  FOR SELECT 
  USING (
    public.current_user_has_admin_role() 
    OR user_id = auth.uid()
  );

-- Policy for INSERT: Only admins can assign new roles
CREATE POLICY "Admins can assign roles" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (public.current_user_has_admin_role());

-- Policy for UPDATE: Only admins can modify existing roles
CREATE POLICY "Admins can update roles" 
  ON public.user_roles 
  FOR UPDATE 
  USING (public.current_user_has_admin_role());

-- Policy for DELETE: Only admins can remove roles
CREATE POLICY "Admins can delete roles" 
  ON public.user_roles 
  FOR DELETE 
  USING (public.current_user_has_admin_role());
