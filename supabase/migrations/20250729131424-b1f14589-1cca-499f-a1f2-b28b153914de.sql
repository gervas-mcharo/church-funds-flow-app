-- Migration to remove super_administrator role and migrate existing users

-- First, migrate any existing users with super_administrator role to administrator role
UPDATE public.user_roles 
SET role = 'administrator' 
WHERE role = 'super_administrator';

-- Remove super_administrator from the enum type
-- First create the new enum without super_administrator
CREATE TYPE public.app_role_new AS ENUM (
    'administrator',
    'data_entry_clerk', 
    'finance_manager',
    'head_of_department',
    'secretary',
    'treasurer',
    'department_member',
    'finance_administrator',
    'pastor',
    'general_secretary',
    'finance_elder',
    'contributor',
    'department_treasurer'
);

-- Update all tables to use the new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;
ALTER TABLE public.department_personnel ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;
ALTER TABLE public.approval_chain ALTER COLUMN approver_role TYPE app_role_new USING approver_role::text::app_role_new;

-- Drop the old enum and rename the new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;