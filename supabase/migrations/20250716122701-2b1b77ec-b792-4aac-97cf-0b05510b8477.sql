-- Create function to check if system has been initialized (any admin exists)
CREATE OR REPLACE FUNCTION public.is_system_initialized()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'administrator'
  )
$$;

-- Create function to initialize system with first admin
CREATE OR REPLACE FUNCTION public.initialize_system_with_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Assign administrator role to the user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'administrator')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Mark system as initialized
  INSERT INTO public.organization_settings (setting_key, setting_value)
  VALUES ('system_initialized', 'true'::jsonb)
  ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = 'true'::jsonb,
    updated_at = now();
    
  -- Log the initialization
  PERFORM public.log_security_event(
    'system_initialized',
    'user_roles',
    _user_id,
    NULL,
    jsonb_build_object('role', 'administrator', 'first_admin', true)
  );
END;
$$;

-- Prevent deletion of the last administrator
CREATE OR REPLACE FUNCTION public.prevent_last_admin_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if this is the last administrator
  IF OLD.role = 'administrator' AND (
    SELECT COUNT(*) FROM public.user_roles WHERE role = 'administrator' AND user_id != OLD.user_id
  ) = 0 THEN
    RAISE EXCEPTION 'Cannot delete the last administrator account';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger to prevent last admin deletion
DROP TRIGGER IF EXISTS prevent_last_admin_deletion_trigger ON public.user_roles;
CREATE TRIGGER prevent_last_admin_deletion_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_deletion();