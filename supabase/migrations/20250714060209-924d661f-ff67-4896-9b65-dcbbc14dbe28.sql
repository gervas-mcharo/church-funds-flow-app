-- RLS Policy Cleanup Migration
-- Phase 1: Remove dangerous "Allow All" policies

-- Contributors table
DROP POLICY IF EXISTS "Allow all operations on contributors" ON public.contributors;

-- Contributions table  
DROP POLICY IF EXISTS "Allow all operations on contributions" ON public.contributions;
DROP POLICY IF EXISTS "Authenticated users can create contributions" ON public.contributions;
DROP POLICY IF EXISTS "Authenticated users can view contributions" ON public.contributions;

-- Fund types table
DROP POLICY IF EXISTS "Allow all operations on fund_types" ON public.fund_types;

-- QR codes table
DROP POLICY IF EXISTS "Allow all operations on qr_codes" ON public.qr_codes;

-- Pledges table
DROP POLICY IF EXISTS "Enable all operations for pledges" ON public.pledges;

-- Pledge contributions table
DROP POLICY IF EXISTS "Enable all operations for pledge_contributions" ON public.pledge_contributions;

-- Pledge audit log table
DROP POLICY IF EXISTS "Enable all operations for pledge_audit_log" ON public.pledge_audit_log;

-- Phase 2: Consolidate duplicate policies

-- Profiles table - remove duplicates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Update remaining profile policies to be more comprehensive
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- User roles table - remove duplicate admin policy
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Update user roles SELECT policy
CREATE POLICY "Users can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (current_user_has_admin_role() OR (user_id = auth.uid()));

-- Departments table - remove overly broad admin policy
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Users can view departments" ON public.departments;

-- Update departments SELECT policy  
CREATE POLICY "Users can view departments" ON public.departments
  FOR SELECT TO authenticated
  USING (true);

-- Phase 3: Strengthen access controls for previously open tables

-- Organization settings - restrict to admins only
DROP POLICY IF EXISTS "Enable all operations for organization_settings" ON public.organization_settings;

CREATE POLICY "Admins can manage organization settings" ON public.organization_settings
  FOR ALL TO authenticated
  USING (current_user_has_admin_role())
  WITH CHECK (current_user_has_admin_role());

-- Custom currencies - restrict to admins only  
DROP POLICY IF EXISTS "Enable all operations for custom_currencies" ON public.custom_currencies;

CREATE POLICY "Admins can manage custom currencies" ON public.custom_currencies
  FOR ALL TO authenticated
  USING (current_user_has_admin_role())
  WITH CHECK (current_user_has_admin_role());

-- Phase 4: Fix department personnel policy overlaps
DROP POLICY IF EXISTS "Admins and HODs can manage department personnel" ON public.department_personnel;
DROP POLICY IF EXISTS "Anyone can view department personnel" ON public.department_personnel;

-- Update department personnel SELECT policy
CREATE POLICY "Users can view department personnel" ON public.department_personnel
  FOR SELECT TO authenticated
  USING (true);

-- Phase 5: Consolidate money requests SELECT policies
DROP POLICY IF EXISTS "Users can view money requests they created or are involved in a" ON public.money_requests;
DROP POLICY IF EXISTS "Users can view requests from their departments" ON public.money_requests;

-- Create single comprehensive SELECT policy for money requests
CREATE POLICY "Users can view accessible money requests" ON public.money_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid() OR
    has_role(auth.uid(), 'administrator'::app_role) OR
    has_role(auth.uid(), 'super_administrator'::app_role) OR
    has_role(auth.uid(), 'head_of_department'::app_role) OR
    has_role(auth.uid(), 'finance_elder'::app_role) OR
    has_role(auth.uid(), 'general_secretary'::app_role) OR
    has_role(auth.uid(), 'pastor'::app_role) OR
    can_access_department(auth.uid(), requesting_department_id)
  );

-- Phase 6: Consolidate approval chain SELECT policies  
DROP POLICY IF EXISTS "Users can view approval chain for accessible requests" ON public.approval_chain;
DROP POLICY IF EXISTS "Users can view approval chains for their department requests" ON public.approval_chain;

-- Create single comprehensive SELECT policy for approval chain
CREATE POLICY "Users can view accessible approval chains" ON public.approval_chain
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM money_requests mr
      WHERE mr.id = approval_chain.money_request_id
      AND (
        mr.requester_id = auth.uid() OR
        has_role(auth.uid(), 'administrator'::app_role) OR
        has_role(auth.uid(), 'super_administrator'::app_role) OR
        has_role(auth.uid(), 'head_of_department'::app_role) OR
        has_role(auth.uid(), 'finance_elder'::app_role) OR
        has_role(auth.uid(), 'general_secretary'::app_role) OR
        has_role(auth.uid(), 'pastor'::app_role) OR
        can_access_department(auth.uid(), mr.requesting_department_id)
      )
    )
  );

-- Phase 7: Add missing audit security
CREATE POLICY "System can create audit logs" ON public.security_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- Allow system functions to create audit logs