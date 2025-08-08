-- Phase 2: Migrate super_administrator users to administrator
UPDATE public.user_roles 
SET role = 'administrator' 
WHERE role = 'super_administrator';

-- Phase 3: Recreate the app_role enum without super_administrator
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