-- Phase 1: Update all database functions to remove super_administrator references

-- Function 1: can_bulk_import_pledges
CREATE OR REPLACE FUNCTION public.can_bulk_import_pledges()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

-- Function 2: can_create_funds
CREATE OR REPLACE FUNCTION public.can_create_funds()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
$function$;

-- Function 3: can_create_pledges
CREATE OR REPLACE FUNCTION public.can_create_pledges()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'data_entry_clerk',
        'general_secretary', 
        'pastor'
      )
  )
$function$;

-- Function 4: can_create_qr_codes
CREATE OR REPLACE FUNCTION public.can_create_qr_codes()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'data_entry_clerk', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

-- Function 5: can_delete_pledges
CREATE OR REPLACE FUNCTION public.can_delete_pledges()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator'
      )
  )
$function$;

-- Function 6: can_delete_qr_codes
CREATE OR REPLACE FUNCTION public.can_delete_qr_codes()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator'
      )
  )
$function$;

-- Function 7: can_manage_pledges
CREATE OR REPLACE FUNCTION public.can_manage_pledges()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

-- Function 8: can_access_qr_management
CREATE OR REPLACE FUNCTION public.can_access_qr_management()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'data_entry_clerk', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

-- Function 9: can_access_funds
CREATE OR REPLACE FUNCTION public.can_access_funds()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
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
$function$;

-- Function 10: can_manage_funds
CREATE OR REPLACE FUNCTION public.can_manage_funds()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
$function$;

-- Function 11: can_access_department_finances
CREATE OR REPLACE FUNCTION public.can_access_department_finances(_user_id uuid, _department_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT 
    -- Church treasurers can access all department finances
    public.has_role(_user_id, 'treasurer') OR
    -- Department treasurers can access their own department's finances
    public.is_department_treasurer(_user_id, _department_id) OR
    -- Other administrative roles with church-wide access
    public.has_role(_user_id, 'administrator') OR
    public.has_role(_user_id, 'finance_administrator') OR
    public.has_role(_user_id, 'finance_manager') OR
    public.has_role(_user_id, 'finance_elder') OR
    public.has_role(_user_id, 'general_secretary') OR
    public.has_role(_user_id, 'pastor')
$function$;

-- Phase 2: Migrate any existing super_administrator users to administrator
UPDATE public.user_roles 
SET role = 'administrator' 
WHERE role = 'super_administrator';

-- Phase 3: Update RLS policies to remove super_administrator references
-- Update money_requests policies
DROP POLICY IF EXISTS "Authorized users can update money requests" ON public.money_requests;
CREATE POLICY "Authorized users can update money requests" 
ON public.money_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'administrator'::app_role) OR 
       has_role(auth.uid(), 'head_of_department'::app_role) OR 
       has_role(auth.uid(), 'finance_elder'::app_role) OR 
       has_role(auth.uid(), 'general_secretary'::app_role) OR 
       has_role(auth.uid(), 'pastor'::app_role));

DROP POLICY IF EXISTS "Users can view accessible money requests" ON public.money_requests;
CREATE POLICY "Users can view accessible money requests" 
ON public.money_requests 
FOR SELECT 
USING ((requester_id = auth.uid()) OR 
       has_role(auth.uid(), 'administrator'::app_role) OR 
       has_role(auth.uid(), 'head_of_department'::app_role) OR 
       has_role(auth.uid(), 'finance_elder'::app_role) OR 
       has_role(auth.uid(), 'general_secretary'::app_role) OR 
       has_role(auth.uid(), 'pastor'::app_role) OR 
       can_access_department(auth.uid(), requesting_department_id));

-- Update request_attachments policies
DROP POLICY IF EXISTS "Users can view attachments for accessible requests" ON public.request_attachments;
CREATE POLICY "Users can view attachments for accessible requests" 
ON public.request_attachments 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM money_requests mr
  WHERE ((mr.id = request_attachments.money_request_id) AND 
         ((mr.requester_id = auth.uid()) OR 
          has_role(auth.uid(), 'administrator'::app_role) OR 
          has_role(auth.uid(), 'head_of_department'::app_role) OR 
          has_role(auth.uid(), 'finance_elder'::app_role) OR 
          has_role(auth.uid(), 'general_secretary'::app_role) OR 
          has_role(auth.uid(), 'pastor'::app_role)))));

-- Update approval_chain policies
DROP POLICY IF EXISTS "Users can view accessible approval chains" ON public.approval_chain;
CREATE POLICY "Users can view accessible approval chains" 
ON public.approval_chain 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM money_requests mr
  WHERE ((mr.id = approval_chain.money_request_id) AND 
         ((mr.requester_id = auth.uid()) OR 
          has_role(auth.uid(), 'administrator'::app_role) OR 
          has_role(auth.uid(), 'head_of_department'::app_role) OR 
          has_role(auth.uid(), 'finance_elder'::app_role) OR 
          has_role(auth.uid(), 'general_secretary'::app_role) OR 
          has_role(auth.uid(), 'pastor'::app_role) OR 
          can_access_department(auth.uid(), mr.requesting_department_id)))));

-- Update fund_types policies
DROP POLICY IF EXISTS "High-level admins can delete funds" ON public.fund_types;
CREATE POLICY "High-level admins can delete funds" 
ON public.fund_types 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND 
         (user_roles.role = ANY (ARRAY['administrator'::app_role, 
                                       'finance_administrator'::app_role, 
                                       'general_secretary'::app_role, 
                                       'pastor'::app_role])))));

-- Update contributors policies  
DROP POLICY IF EXISTS "High-level admins can delete contributors" ON public.contributors;
CREATE POLICY "High-level admins can delete contributors" 
ON public.contributors 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND 
         (user_roles.role = ANY (ARRAY['administrator'::app_role, 
                                       'finance_administrator'::app_role, 
                                       'general_secretary'::app_role, 
                                       'pastor'::app_role])))));

-- Update contributions policies
DROP POLICY IF EXISTS "High-level admins can delete contributions" ON public.contributions;
CREATE POLICY "High-level admins can delete contributions" 
ON public.contributions 
FOR DELETE 
USING (current_user_has_admin_role() OR 
       has_role(auth.uid(), 'finance_administrator'::app_role) OR 
       has_role(auth.uid(), 'general_secretary'::app_role) OR 
       has_role(auth.uid(), 'pastor'::app_role));

-- Phase 4: Recreate the app_role enum without super_administrator
-- First, create a new temporary enum
CREATE TYPE app_role_new AS ENUM (
    'administrator',
    'finance_administrator', 
    'finance_manager',
    'finance_elder',
    'treasurer',
    'department_treasurer',
    'data_entry_clerk',
    'general_secretary',
    'pastor',
    'head_of_department',
    'department_member',
    'secretary'
);

-- Update all tables to use the new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;
ALTER TABLE public.department_personnel ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;
ALTER TABLE public.approval_chain ALTER COLUMN approver_role TYPE app_role_new USING approver_role::text::app_role_new;

-- Drop the old enum and rename the new one
DROP TYPE public.app_role;
ALTER TYPE app_role_new RENAME TO app_role;