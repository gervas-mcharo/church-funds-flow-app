-- Complete remaining RLS policies

-- Recreate remaining pledge_contributions policies
CREATE POLICY "Users can create pledge contributions based on role" 
ON public.pledge_contributions 
FOR INSERT 
WITH CHECK (can_manage_pledges());

CREATE POLICY "Users can delete pledge contributions based on role" 
ON public.pledge_contributions 
FOR DELETE 
USING (can_delete_pledges());

CREATE POLICY "Users can update pledge contributions based on role" 
ON public.pledge_contributions 
FOR UPDATE 
USING (can_manage_pledges());

CREATE POLICY "Users can view pledge contributions based on role" 
ON public.pledge_contributions 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (can_manage_pledges() OR can_create_pledges()));

-- Recreate pledge_audit_log policies
CREATE POLICY "Users can view pledge audit logs based on role" 
ON public.pledge_audit_log 
FOR SELECT 
USING (can_manage_pledges());

-- Recreate qr_codes policies
CREATE POLICY "Admin roles can update QR codes" 
ON public.qr_codes 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND 
              role = ANY(ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'finance_manager'::app_role, 'finance_elder'::app_role])));

CREATE POLICY "Authorized users can create QR codes" 
ON public.qr_codes 
FOR INSERT 
WITH CHECK (can_create_qr_codes());

CREATE POLICY "Authorized users can view QR codes" 
ON public.qr_codes 
FOR SELECT 
USING (can_access_qr_management());

CREATE POLICY "High-level admin roles can delete QR codes" 
ON public.qr_codes 
FOR DELETE 
USING (can_delete_qr_codes());

-- Recreate profiles policies
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Recreate departments policies
CREATE POLICY "Admins and leadership can create departments" 
ON public.departments 
FOR INSERT 
WITH CHECK (current_user_has_admin_role() OR 
           (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary'::app_role, 'pastor'::app_role]))));

CREATE POLICY "Admins and leadership can delete departments" 
ON public.departments 
FOR DELETE 
USING (current_user_has_admin_role() OR 
       (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary'::app_role, 'pastor'::app_role]))));

CREATE POLICY "Admins and leadership can update departments" 
ON public.departments 
FOR UPDATE 
USING (current_user_has_admin_role() OR 
       (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary'::app_role, 'pastor'::app_role]))));

CREATE POLICY "Users can view departments" 
ON public.departments 
FOR SELECT 
USING (true);