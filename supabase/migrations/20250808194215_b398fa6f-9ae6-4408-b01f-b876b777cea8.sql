-- Complete final RLS policies

-- Recreate department_treasurers policies
CREATE POLICY "Admins can manage department treasurer assignments" 
ON public.department_treasurers 
FOR ALL 
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

CREATE POLICY "Users can view department treasurer assignments" 
ON public.department_treasurers 
FOR SELECT 
USING (current_user_has_admin_role() OR 
       has_role(auth.uid(), 'treasurer'::app_role) OR 
       (user_id = auth.uid()));

-- Recreate department_funds policies
CREATE POLICY "Admins can manage department funds" 
ON public.department_funds 
FOR ALL 
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

CREATE POLICY "Users can view department funds they have access to" 
ON public.department_funds 
FOR SELECT 
USING (current_user_has_admin_role() OR 
       has_role(auth.uid(), 'treasurer'::app_role) OR 
       is_department_treasurer(auth.uid(), department_id));

-- Recreate organization_settings policies
CREATE POLICY "Admins can manage organization settings" 
ON public.organization_settings 
FOR ALL 
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

-- Recreate custom_currencies policies
CREATE POLICY "Admins can manage custom currencies" 
ON public.custom_currencies 
FOR ALL 
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

-- Recreate security_audit_log policies
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (current_user_has_admin_role());

CREATE POLICY "System can create audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);