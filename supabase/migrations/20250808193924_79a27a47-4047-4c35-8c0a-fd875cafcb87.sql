-- Recreate the has_role function with the new enum type
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Recreate has_department_role function 
CREATE OR REPLACE FUNCTION public.has_department_role(user_id uuid, dept_id uuid, required_role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_personnel dp
    WHERE dp.user_id = user_id
      AND dp.department_id = dept_id
      AND dp.role = required_role
  );
$function$;