
-- Drop the unique constraint that prevents multiple users from having the same role in one department
ALTER TABLE public.department_personnel DROP CONSTRAINT IF EXISTS department_personnel_department_id_role_key;

-- The constraint department_personnel_user_id_department_id_role_key will remain to prevent 
-- the same user from being assigned the same role multiple times in the same department
