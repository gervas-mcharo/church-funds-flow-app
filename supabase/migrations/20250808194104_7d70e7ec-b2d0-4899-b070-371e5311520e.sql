-- Continue recreating remaining RLS policies

-- Recreate contributions policies
CREATE POLICY "Authorized users can create contributions" 
ON public.contributions 
FOR INSERT 
WITH CHECK (current_user_has_admin_role() OR 
            has_role(auth.uid(), 'treasurer'::app_role) OR 
            has_role(auth.uid(), 'finance_administrator'::app_role) OR 
            has_role(auth.uid(), 'finance_manager'::app_role) OR 
            has_role(auth.uid(), 'finance_elder'::app_role) OR 
            has_role(auth.uid(), 'data_entry_clerk'::app_role) OR 
            has_role(auth.uid(), 'general_secretary'::app_role) OR 
            has_role(auth.uid(), 'pastor'::app_role) OR 
            ((department_id IS NOT NULL) AND is_department_treasurer(auth.uid(), department_id)));

CREATE POLICY "Authorized users can update contributions" 
ON public.contributions 
FOR UPDATE 
USING (current_user_has_admin_role() OR 
       has_role(auth.uid(), 'treasurer'::app_role) OR 
       has_role(auth.uid(), 'finance_administrator'::app_role) OR 
       has_role(auth.uid(), 'finance_manager'::app_role) OR 
       has_role(auth.uid(), 'finance_elder'::app_role) OR 
       has_role(auth.uid(), 'general_secretary'::app_role) OR 
       has_role(auth.uid(), 'pastor'::app_role) OR 
       ((department_id IS NOT NULL) AND is_department_treasurer(auth.uid(), department_id)));

CREATE POLICY "High-level admins can delete contributions" 
ON public.contributions 
FOR DELETE 
USING (current_user_has_admin_role() OR 
       has_role(auth.uid(), 'finance_administrator'::app_role) OR 
       has_role(auth.uid(), 'general_secretary'::app_role) OR 
       has_role(auth.uid(), 'pastor'::app_role));

CREATE POLICY "Users can view contributions based on role and department access" 
ON public.contributions 
FOR SELECT 
USING (current_user_has_admin_role() OR 
       has_role(auth.uid(), 'treasurer'::app_role) OR 
       has_role(auth.uid(), 'finance_administrator'::app_role) OR 
       has_role(auth.uid(), 'finance_manager'::app_role) OR 
       has_role(auth.uid(), 'finance_elder'::app_role) OR 
       has_role(auth.uid(), 'data_entry_clerk'::app_role) OR 
       has_role(auth.uid(), 'general_secretary'::app_role) OR 
       has_role(auth.uid(), 'pastor'::app_role) OR 
       ((department_id IS NOT NULL) AND is_department_treasurer(auth.uid(), department_id)));

-- Recreate pledges policies
CREATE POLICY "Users can create pledges based on role" 
ON public.pledges 
FOR INSERT 
WITH CHECK (can_create_pledges());

CREATE POLICY "Users can delete pledges based on role" 
ON public.pledges 
FOR DELETE 
USING (can_delete_pledges());

CREATE POLICY "Users can update pledges based on role" 
ON public.pledges 
FOR UPDATE 
USING (can_manage_pledges());

CREATE POLICY "Users can view pledges based on role" 
ON public.pledges 
FOR SELECT 
USING (current_user_has_admin_role() OR 
       has_role(auth.uid(), 'treasurer'::app_role) OR 
       has_role(auth.uid(), 'finance_administrator'::app_role) OR 
       has_role(auth.uid(), 'finance_manager'::app_role) OR 
       has_role(auth.uid(), 'finance_elder'::app_role) OR 
       has_role(auth.uid(), 'data_entry_clerk'::app_role) OR 
       has_role(auth.uid(), 'general_secretary'::app_role) OR 
       has_role(auth.uid(), 'pastor'::app_role) OR 
       ((department_id IS NOT NULL) AND is_department_treasurer(auth.uid(), department_id)));