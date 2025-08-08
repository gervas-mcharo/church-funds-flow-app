-- Continue recreating RLS policies

-- Recreate remaining policies
CREATE POLICY "Users can upload attachments for their requests" 
ON public.request_attachments 
FOR INSERT 
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can view attachments for accessible requests" 
ON public.request_attachments 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM money_requests mr WHERE mr.id = request_attachments.money_request_id AND 
              ((mr.requester_id = auth.uid()) OR 
               has_role(auth.uid(), 'administrator'::app_role) OR 
               has_role(auth.uid(), 'head_of_department'::app_role) OR 
               has_role(auth.uid(), 'finance_elder'::app_role) OR 
               has_role(auth.uid(), 'general_secretary'::app_role) OR 
               has_role(auth.uid(), 'pastor'::app_role))));

-- Recreate fund_types policies
CREATE POLICY "Authorized users can create funds" 
ON public.fund_types 
FOR INSERT 
WITH CHECK (can_create_funds());

CREATE POLICY "Authorized users can update funds" 
ON public.fund_types 
FOR UPDATE 
USING (can_manage_funds());

CREATE POLICY "Authorized users can view funds" 
ON public.fund_types 
FOR SELECT 
USING (can_access_funds());

CREATE POLICY "High-level admins can delete funds" 
ON public.fund_types 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND 
              role = ANY(ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'general_secretary'::app_role, 'pastor'::app_role])));

-- Recreate contributors policies  
CREATE POLICY "Authorized users can create contributors" 
ON public.contributors 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND 
           role = ANY(ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'treasurer'::app_role, 'general_secretary'::app_role, 'pastor'::app_role])));

CREATE POLICY "Authorized users can update contributors" 
ON public.contributors 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND 
              role = ANY(ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'finance_manager'::app_role, 'finance_elder'::app_role, 'treasurer'::app_role, 'general_secretary'::app_role, 'pastor'::app_role])));

CREATE POLICY "Authorized users can view contributors" 
ON public.contributors 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND 
              role = ANY(ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'finance_manager'::app_role, 'finance_elder'::app_role, 'treasurer'::app_role, 'data_entry_clerk'::app_role, 'general_secretary'::app_role, 'pastor'::app_role])));

CREATE POLICY "High-level admins can delete contributors" 
ON public.contributors 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND 
              role = ANY(ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'general_secretary'::app_role, 'pastor'::app_role])));