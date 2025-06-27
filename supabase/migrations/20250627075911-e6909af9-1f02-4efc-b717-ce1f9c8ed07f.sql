
-- Enable RLS on qr_codes table if not already enabled
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any exist to avoid conflicts
DROP POLICY IF EXISTS "QR codes select policy" ON public.qr_codes;
DROP POLICY IF EXISTS "QR codes insert policy" ON public.qr_codes;
DROP POLICY IF EXISTS "QR codes update policy" ON public.qr_codes;
DROP POLICY IF EXISTS "QR codes delete policy" ON public.qr_codes;

-- Create a function to check QR management permissions
CREATE OR REPLACE FUNCTION public.can_access_qr_management()
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
        'data_entry_clerk', 
        'general_secretary', 
        'pastor'
      )
  )
$$;

-- Create a function to check QR code creation permissions
CREATE OR REPLACE FUNCTION public.can_create_qr_codes()
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
        'data_entry_clerk', 
        'general_secretary', 
        'pastor'
      )
  )
$$;

-- Create a function to check QR code deletion permissions
CREATE OR REPLACE FUNCTION public.can_delete_qr_codes()
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
        'finance_administrator'
      )
  )
$$;

-- Policy for SELECT: All authorized roles can view QR codes
CREATE POLICY "Authorized users can view QR codes"
ON public.qr_codes
FOR SELECT
TO authenticated
USING (public.can_access_qr_management());

-- Policy for INSERT: Authorized roles can create QR codes
CREATE POLICY "Authorized users can create QR codes"
ON public.qr_codes
FOR INSERT
TO authenticated
WITH CHECK (public.can_create_qr_codes());

-- Policy for UPDATE: Only higher-level roles can update QR codes
CREATE POLICY "Admin roles can update QR codes"
ON public.qr_codes
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
        'finance_elder'
      )
  )
);

-- Policy for DELETE: Only top-level roles can delete QR codes
CREATE POLICY "High-level admin roles can delete QR codes"
ON public.qr_codes
FOR DELETE
TO authenticated
USING (public.can_delete_qr_codes());
