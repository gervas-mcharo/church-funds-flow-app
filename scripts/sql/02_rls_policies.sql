-- Row Level Security Policies
-- Enable RLS and create policies for all tables

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_treasurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_currencies ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'administrator'));

-- User roles policies
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT USING (current_user_has_admin_role() OR (user_id = auth.uid()));
CREATE POLICY "Admins can assign roles" ON public.user_roles FOR INSERT WITH CHECK (current_user_has_admin_role());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (current_user_has_admin_role());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (current_user_has_admin_role());

-- Organization settings policies
CREATE POLICY "Admins can manage organization settings" ON public.organization_settings FOR ALL USING (current_user_has_admin_role()) WITH CHECK (current_user_has_admin_role());

-- Departments policies
CREATE POLICY "Users can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins and leadership can create departments" ON public.departments FOR INSERT WITH CHECK (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary', 'pastor'])));
CREATE POLICY "Admins and leadership can update departments" ON public.departments FOR UPDATE USING (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary', 'pastor'])));
CREATE POLICY "Admins and leadership can delete departments" ON public.departments FOR DELETE USING (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary', 'pastor'])));

-- Department personnel policies
CREATE POLICY "Users can view department personnel" ON public.department_personnel FOR SELECT USING (true);
CREATE POLICY "Authorized users can assign personnel" ON public.department_personnel FOR INSERT WITH CHECK (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary', 'pastor'])) OR EXISTS (SELECT 1 FROM department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department'));
CREATE POLICY "Authorized users can update personnel roles" ON public.department_personnel FOR UPDATE USING (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary', 'pastor'])) OR EXISTS (SELECT 1 FROM department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department'));
CREATE POLICY "Authorized users can remove personnel" ON public.department_personnel FOR DELETE USING (current_user_has_admin_role() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['general_secretary', 'pastor'])) OR EXISTS (SELECT 1 FROM department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department'));

-- Department treasurers policies
CREATE POLICY "Users can view department treasurer assignments" ON public.department_treasurers FOR SELECT USING (current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer') OR (user_id = auth.uid()));
CREATE POLICY "Admins can manage department treasurer assignments" ON public.department_treasurers FOR ALL USING (current_user_has_admin_role()) WITH CHECK (current_user_has_admin_role());

-- Fund types policies
CREATE POLICY "Authorized users can view funds" ON public.fund_types FOR SELECT USING (can_access_funds());
CREATE POLICY "Authorized users can create funds" ON public.fund_types FOR INSERT WITH CHECK (can_create_funds());
CREATE POLICY "Authorized users can update funds" ON public.fund_types FOR UPDATE USING (can_manage_funds());
CREATE POLICY "High-level admins can delete funds" ON public.fund_types FOR DELETE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'general_secretary', 'pastor'])));

-- Department funds policies
CREATE POLICY "Users can view department funds they have access to" ON public.department_funds FOR SELECT USING (current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer') OR is_department_treasurer(auth.uid(), department_id));
CREATE POLICY "Admins can manage department funds" ON public.department_funds FOR ALL USING (current_user_has_admin_role()) WITH CHECK (current_user_has_admin_role());

-- Contributors policies
CREATE POLICY "Authorized users can view contributors" ON public.contributors FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'data_entry_clerk', 'general_secretary', 'pastor'])));
CREATE POLICY "Authorized users can create contributors" ON public.contributors FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'treasurer', 'general_secretary', 'pastor'])));
CREATE POLICY "Authorized users can update contributors" ON public.contributors FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'general_secretary', 'pastor'])));
CREATE POLICY "High-level admins can delete contributors" ON public.contributors FOR DELETE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'general_secretary', 'pastor'])));

-- QR codes policies
CREATE POLICY "Authorized users can view QR codes" ON public.qr_codes FOR SELECT USING (can_access_qr_management());
CREATE POLICY "Authorized users can create QR codes" ON public.qr_codes FOR INSERT WITH CHECK (can_create_qr_codes());
CREATE POLICY "Admin roles can update QR codes" ON public.qr_codes FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'finance_manager', 'finance_elder'])));
CREATE POLICY "High-level admin roles can delete QR codes" ON public.qr_codes FOR DELETE USING (can_delete_qr_codes());

-- Contributions policies
CREATE POLICY "Users can view contributions based on role and department access" ON public.contributions FOR SELECT USING (current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer') OR has_role(auth.uid(), 'finance_administrator') OR has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'data_entry_clerk') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor') OR (department_id IS NOT NULL AND is_department_treasurer(auth.uid(), department_id)));
CREATE POLICY "Authorized users can create contributions" ON public.contributions FOR INSERT WITH CHECK (current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer') OR has_role(auth.uid(), 'finance_administrator') OR has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'data_entry_clerk') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor') OR (department_id IS NOT NULL AND is_department_treasurer(auth.uid(), department_id)));
CREATE POLICY "Authorized users can update contributions" ON public.contributions FOR UPDATE USING (current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer') OR has_role(auth.uid(), 'finance_administrator') OR has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor') OR (department_id IS NOT NULL AND is_department_treasurer(auth.uid(), department_id)));
CREATE POLICY "High-level admins can delete contributions" ON public.contributions FOR DELETE USING (current_user_has_admin_role() OR has_role(auth.uid(), 'finance_administrator') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor'));

-- Pledges policies
CREATE POLICY "Users can view pledges based on role" ON public.pledges FOR SELECT USING (current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer') OR has_role(auth.uid(), 'finance_administrator') OR has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'data_entry_clerk') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor') OR (department_id IS NOT NULL AND is_department_treasurer(auth.uid(), department_id)));
CREATE POLICY "Users can create pledges based on role" ON public.pledges FOR INSERT WITH CHECK (can_create_pledges());
CREATE POLICY "Users can update pledges based on role" ON public.pledges FOR UPDATE USING (can_manage_pledges());
CREATE POLICY "Users can delete pledges based on role" ON public.pledges FOR DELETE USING (can_delete_pledges());

-- Pledge contributions policies
CREATE POLICY "Users can view pledge contributions based on role" ON public.pledge_contributions FOR SELECT USING (auth.uid() IS NOT NULL AND (can_manage_pledges() OR can_create_pledges()));
CREATE POLICY "Users can create pledge contributions based on role" ON public.pledge_contributions FOR INSERT WITH CHECK (can_manage_pledges());
CREATE POLICY "Users can update pledge contributions based on role" ON public.pledge_contributions FOR UPDATE USING (can_manage_pledges());
CREATE POLICY "Users can delete pledge contributions based on role" ON public.pledge_contributions FOR DELETE USING (can_delete_pledges());

-- Pledge audit log policies
CREATE POLICY "Users can view pledge audit logs based on role" ON public.pledge_audit_log FOR SELECT USING (can_manage_pledges());

-- Money requests policies
CREATE POLICY "Users can view accessible money requests" ON public.money_requests FOR SELECT USING (requester_id = auth.uid() OR has_role(auth.uid(), 'administrator') OR has_role(auth.uid(), 'head_of_department') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor') OR can_access_department(auth.uid(), requesting_department_id));
CREATE POLICY "Users can create money requests" ON public.money_requests FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can create requests for their departments" ON public.money_requests FOR INSERT WITH CHECK (can_access_department(auth.uid(), requesting_department_id) AND auth.uid() = requester_id);
CREATE POLICY "Authorized users can update money requests" ON public.money_requests FOR UPDATE USING (has_role(auth.uid(), 'administrator') OR has_role(auth.uid(), 'head_of_department') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor'));
CREATE POLICY "Department personnel can update requests" ON public.money_requests FOR UPDATE USING (can_access_department(auth.uid(), requesting_department_id));

-- Approval chain policies
CREATE POLICY "Users can view accessible approval chains" ON public.approval_chain FOR SELECT USING (EXISTS (SELECT 1 FROM money_requests mr WHERE mr.id = money_request_id AND (mr.requester_id = auth.uid() OR has_role(auth.uid(), 'administrator') OR has_role(auth.uid(), 'head_of_department') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor') OR can_access_department(auth.uid(), mr.requesting_department_id))));
CREATE POLICY "System can create approval chain entries" ON public.approval_chain FOR INSERT WITH CHECK (true);
CREATE POLICY "Approvers can update their approval decisions" ON public.approval_chain FOR UPDATE USING (approver_id = auth.uid() OR has_role(auth.uid(), 'administrator'));
CREATE POLICY "Users can approve for their department role" ON public.approval_chain FOR UPDATE USING (EXISTS (SELECT 1 FROM money_requests mr WHERE mr.id = money_request_id AND has_department_role(auth.uid(), mr.requesting_department_id, approver_role)));

-- Request attachments policies
CREATE POLICY "Users can view attachments for accessible requests" ON public.request_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM money_requests mr WHERE mr.id = money_request_id AND (mr.requester_id = auth.uid() OR has_role(auth.uid(), 'administrator') OR has_role(auth.uid(), 'head_of_department') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor'))));
CREATE POLICY "Users can upload attachments for their requests" ON public.request_attachments FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Security audit log policies
CREATE POLICY "System can create audit logs" ON public.security_audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can view audit logs" ON public.security_audit_log FOR SELECT USING (current_user_has_admin_role());

-- Custom currencies policies
CREATE POLICY "Admins can manage custom currencies" ON public.custom_currencies FOR ALL USING (current_user_has_admin_role()) WITH CHECK (current_user_has_admin_role());