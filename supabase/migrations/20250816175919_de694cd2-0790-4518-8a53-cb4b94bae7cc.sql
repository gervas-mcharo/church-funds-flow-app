-- Update can_access_funds function to allow department members to view fund types
-- This is needed so department members can select fund types when submitting money requests
CREATE OR REPLACE FUNCTION public.can_access_funds()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
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
        'department_member',
        'head_of_department',
        'secretary',
        'general_secretary', 
        'pastor'
      )
  )
$function$;