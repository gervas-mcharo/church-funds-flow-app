-- Simplified Role Consolidation Migration
-- Step 1: Update current_user_has_admin_role function to only check for administrator
CREATE OR REPLACE FUNCTION public.current_user_has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'administrator'
  )
$$;

-- Step 2: Migrate all super_administrator users to administrator role
UPDATE public.user_roles 
SET role = 'administrator'
WHERE role = 'super_administrator';

-- Step 3: Log the migration
INSERT INTO public.security_audit_log (user_id, action, table_name, record_id, old_values, new_values)
VALUES (
  auth.uid(),
  'ROLE_CONSOLIDATION',
  'user_roles',
  NULL,
  '{"migration": "super_administrator_to_administrator"}'::jsonb,
  jsonb_build_object('status', 'completed', 'timestamp', now())
);