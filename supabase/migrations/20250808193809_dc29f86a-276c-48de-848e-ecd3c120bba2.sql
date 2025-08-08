-- Check if there are any constraints or defaults referencing the enum
-- First, let's manually update any super_administrator entries to administrator
UPDATE public.user_roles 
SET role = 'administrator' 
WHERE role::text = 'super_administrator';

-- Check if enum is used in any function definitions and update them if needed
-- For user_roles table, we'll drop and recreate constraints
-- Temporarily disable constraints
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.department_personnel DROP CONSTRAINT IF EXISTS department_personnel_role_check;
ALTER TABLE public.approval_chain DROP CONSTRAINT IF EXISTS approval_chain_approver_role_check;

-- Change columns to text
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;
ALTER TABLE public.department_personnel ALTER COLUMN role TYPE text;  
ALTER TABLE public.approval_chain ALTER COLUMN approver_role TYPE text;

-- Now safely drop the enum
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Create the new enum
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
    'department_member',
    'secretary'
);

-- Convert columns back to the new enum type
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

ALTER TABLE public.department_personnel 
  ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

ALTER TABLE public.approval_chain 
  ALTER COLUMN approver_role TYPE public.app_role USING approver_role::public.app_role;