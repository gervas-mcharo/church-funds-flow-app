
-- Phase 1: Remove overly permissive RLS policies and implement proper role-based access

-- Fix contributors table RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contributors;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.contributors;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.contributors;

-- Create proper role-based policies for contributors
CREATE POLICY "Authorized users can view contributors"
ON public.contributors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'treasurer',
        'data_entry_clerk',
        'general_secretary', 
        'pastor'
      )
  )
);

CREATE POLICY "Authorized users can create contributors"
ON public.contributors
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
);

CREATE POLICY "Authorized users can update contributors"
ON public.contributors
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
);

CREATE POLICY "High-level admins can delete contributors"
ON public.contributors
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator',
        'general_secretary', 
        'pastor'
      )
  )
);

-- Fix fund_types table RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.fund_types;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.fund_types;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.fund_types;

-- Create function to check fund access permissions
CREATE OR REPLACE FUNCTION public.can_access_funds()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'treasurer',
        'department_treasurer',
        'data_entry_clerk',
        'general_secretary', 
        'pastor'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_funds()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_create_funds()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
$$;

-- Create proper role-based policies for fund_types
CREATE POLICY "Authorized users can view funds"
ON public.fund_types
FOR SELECT
TO authenticated
USING (public.can_access_funds());

CREATE POLICY "Authorized users can create funds"
ON public.fund_types
FOR INSERT
TO authenticated
WITH CHECK (public.can_create_funds());

CREATE POLICY "Authorized users can update funds"
ON public.fund_types
FOR UPDATE
TO authenticated
USING (public.can_manage_funds());

CREATE POLICY "High-level admins can delete funds"
ON public.fund_types
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator',
        'general_secretary', 
        'pastor'
      )
  )
);

-- Fix contributions table RLS policies to respect department boundaries
DROP POLICY IF EXISTS "Users can view contributions based on role" ON public.contributions;
DROP POLICY IF EXISTS "Users can create contributions based on role" ON public.contributions;
DROP POLICY IF EXISTS "Users can update contributions based on role" ON public.contributions;
DROP POLICY IF EXISTS "Users can delete contributions based on role" ON public.contributions;

CREATE POLICY "Users can view contributions based on role and department access"
ON public.contributions
FOR SELECT
TO authenticated
USING (
  public.current_user_has_admin_role() OR
  public.has_role(auth.uid(), 'treasurer') OR
  public.has_role(auth.uid(), 'finance_administrator') OR
  public.has_role(auth.uid(), 'finance_manager') OR
  public.has_role(auth.uid(), 'finance_elder') OR
  public.has_role(auth.uid(), 'data_entry_clerk') OR
  public.has_role(auth.uid(), 'general_secretary') OR
  public.has_role(auth.uid(), 'pastor') OR
  (department_id IS NOT NULL AND public.is_department_treasurer(auth.uid(), department_id))
);

CREATE POLICY "Authorized users can create contributions"
ON public.contributions
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_has_admin_role() OR
  public.has_role(auth.uid(), 'treasurer') OR
  public.has_role(auth.uid(), 'finance_administrator') OR
  public.has_role(auth.uid(), 'finance_manager') OR
  public.has_role(auth.uid(), 'finance_elder') OR
  public.has_role(auth.uid(), 'data_entry_clerk') OR
  public.has_role(auth.uid(), 'general_secretary') OR
  public.has_role(auth.uid(), 'pastor') OR
  (department_id IS NOT NULL AND public.is_department_treasurer(auth.uid(), department_id))
);

CREATE POLICY "Authorized users can update contributions"
ON public.contributions
FOR UPDATE
TO authenticated
USING (
  public.current_user_has_admin_role() OR
  public.has_role(auth.uid(), 'treasurer') OR
  public.has_role(auth.uid(), 'finance_administrator') OR
  public.has_role(auth.uid(), 'finance_manager') OR
  public.has_role(auth.uid(), 'finance_elder') OR
  public.has_role(auth.uid(), 'general_secretary') OR
  public.has_role(auth.uid(), 'pastor') OR
  (department_id IS NOT NULL AND public.is_department_treasurer(auth.uid(), department_id))
);

CREATE POLICY "High-level admins can delete contributions"
ON public.contributions
FOR DELETE
TO authenticated
USING (
  public.current_user_has_admin_role() OR
  public.has_role(auth.uid(), 'finance_administrator') OR
  public.has_role(auth.uid(), 'general_secretary') OR
  public.has_role(auth.uid(), 'pastor')
);

-- Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.current_user_has_admin_role());

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action TEXT,
  _table_name TEXT,
  _record_id UUID DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), _action, _table_name, _record_id, _old_values, _new_values
  );
END;
$$;
