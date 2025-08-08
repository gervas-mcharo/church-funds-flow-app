-- Phase 2: Migrate super_administrator users to administrator
UPDATE public.user_roles 
SET role = 'administrator' 
WHERE role = 'super_administrator';

-- Phase 3: Change enum columns to text temporarily, then recreate enum
-- Convert enum columns to text
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;
ALTER TABLE public.department_personnel ALTER COLUMN role TYPE text;
ALTER TABLE public.approval_chain ALTER COLUMN approver_role TYPE text;

-- Drop the old enum
DROP TYPE public.app_role;

-- Create new enum without super_administrator
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

-- Convert text columns back to the new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role USING role::app_role;
ALTER TABLE public.department_personnel ALTER COLUMN role TYPE app_role USING role::app_role;
ALTER TABLE public.approval_chain ALTER COLUMN approver_role TYPE app_role USING approver_role::app_role;