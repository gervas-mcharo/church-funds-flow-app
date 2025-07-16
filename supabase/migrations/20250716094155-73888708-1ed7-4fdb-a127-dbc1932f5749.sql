-- Phase 1: Role Consolidation Migration
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

-- Step 3: Remove super_administrator from the app_role enum
-- First, ensure no references remain (they should all be migrated by now)
DO $$ 
BEGIN
  -- Check if any super_administrator roles still exist
  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'super_administrator'
  ) THEN
    RAISE EXCEPTION 'Cannot remove super_administrator from enum: users still have this role';
  END IF;
END $$;

-- Remove super_administrator from the enum
ALTER TYPE public.app_role RENAME TO app_role_old;

CREATE TYPE public.app_role AS ENUM (
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
  'secretary',
  'department_member'
);

-- Update all tables that use the enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
ALTER TABLE public.department_personnel ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
ALTER TABLE public.approval_chain ALTER COLUMN approver_role TYPE public.app_role USING approver_role::text::public.app_role;

-- Drop the old enum
DROP TYPE public.app_role_old;

-- Log the migration
INSERT INTO public.security_audit_log (user_id, action, table_name, record_id, old_values, new_values)
VALUES (
  auth.uid(),
  'ROLE_CONSOLIDATION',
  'user_roles',
  NULL,
  '{"migration": "super_administrator_to_administrator"}',
  '{"status": "completed", "timestamp": "' || now() || '"}'
);