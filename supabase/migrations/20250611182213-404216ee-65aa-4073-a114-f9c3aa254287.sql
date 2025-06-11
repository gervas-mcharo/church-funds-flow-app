
-- Drop the existing restrictive check constraint
ALTER TABLE public.department_personnel DROP CONSTRAINT IF EXISTS department_personnel_role_check;

-- Add a new check constraint that includes 'department_member' as a valid role
ALTER TABLE public.department_personnel ADD CONSTRAINT department_personnel_role_check 
CHECK (role IN ('head_of_department', 'secretary', 'treasurer', 'department_member'));
