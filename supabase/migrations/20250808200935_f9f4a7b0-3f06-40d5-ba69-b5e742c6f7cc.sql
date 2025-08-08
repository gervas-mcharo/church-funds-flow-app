-- Add missing RLS policies and fix security issues

-- User roles policies
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT USING (current_user_has_admin_role() OR (user_id = auth.uid()));
CREATE POLICY "Admins can assign roles" ON public.user_roles FOR INSERT WITH CHECK (current_user_has_admin_role());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (current_user_has_admin_role());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (current_user_has_admin_role());

-- Department personnel policies
CREATE POLICY "Users can view department personnel" ON public.department_personnel FOR SELECT USING (true);
CREATE POLICY "Authorized users can assign personnel" ON public.department_personnel FOR INSERT WITH CHECK (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary'::app_role, 'pastor'::app_role])) OR EXISTS (SELECT 1 FROM department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department'::app_role));
CREATE POLICY "Authorized users can update personnel roles" ON public.department_personnel FOR UPDATE USING (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary'::app_role, 'pastor'::app_role])) OR EXISTS (SELECT 1 FROM department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department'::app_role));
CREATE POLICY "Authorized users can remove personnel" ON public.department_personnel FOR DELETE USING (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary'::app_role, 'pastor'::app_role])) OR EXISTS (SELECT 1 FROM department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department'::app_role));

-- Approval chain policies
CREATE POLICY "Users can view accessible approval chains" ON public.approval_chain FOR SELECT USING (EXISTS (SELECT 1 FROM money_requests mr WHERE mr.id = money_request_id AND (mr.requester_id = auth.uid() OR has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'head_of_department'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR can_access_department(auth.uid(), mr.requesting_department_id))));
CREATE POLICY "System can create approval chain entries" ON public.approval_chain FOR INSERT WITH CHECK (true);
CREATE POLICY "Approvers can update their approval decisions" ON public.approval_chain FOR UPDATE USING (approver_id = auth.uid() OR has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY "Users can approve for their department role" ON public.approval_chain FOR UPDATE USING (EXISTS (SELECT 1 FROM money_requests mr WHERE mr.id = money_request_id AND has_department_role(auth.uid(), mr.requesting_department_id, approver_role)));

-- Money requests policies
CREATE POLICY "Users can view accessible money requests" ON public.money_requests FOR SELECT USING (requester_id = auth.uid() OR has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'head_of_department'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR can_access_department(auth.uid(), requesting_department_id));
CREATE POLICY "Users can create money requests" ON public.money_requests FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can create requests for their departments" ON public.money_requests FOR INSERT WITH CHECK (can_access_department(auth.uid(), requesting_department_id) AND auth.uid() = requester_id);
CREATE POLICY "Authorized users can update money requests" ON public.money_requests FOR UPDATE USING (has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'head_of_department'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));
CREATE POLICY "Department personnel can update requests" ON public.money_requests FOR UPDATE USING (can_access_department(auth.uid(), requesting_department_id));