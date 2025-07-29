-- Migration to remove super_administrator role - Step 1: Migrate existing users and handle policies

-- First, migrate any existing users with super_administrator role to administrator role
UPDATE public.user_roles 
SET role = 'administrator' 
WHERE role = 'super_administrator';

-- Drop all policies that reference the role column before changing the enum
DROP POLICY IF EXISTS "High-level admins can delete funds" ON public.fund_types;
DROP POLICY IF EXISTS "Authorized users can view contributors" ON public.contributors;
DROP POLICY IF EXISTS "Authorized users can create contributors" ON public.contributors;
DROP POLICY IF EXISTS "Authorized users can update contributors" ON public.contributors;
DROP POLICY IF EXISTS "High-level admins can delete contributors" ON public.contributors;
DROP POLICY IF EXISTS "Admin roles can update QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can view accessible money requests" ON public.money_requests;
DROP POLICY IF EXISTS "Authorized users can update money requests" ON public.money_requests;
DROP POLICY IF EXISTS "Users can view accessible approval chains" ON public.approval_chain;
DROP POLICY IF EXISTS "Users can view attachments for accessible requests" ON public.request_attachments;

-- Create the new enum without super_administrator
CREATE TYPE public.app_role_new AS ENUM (
    'administrator',
    'data_entry_clerk', 
    'finance_manager',
    'head_of_department',
    'secretary',
    'treasurer',
    'department_member',
    'finance_administrator',
    'pastor',
    'general_secretary',
    'finance_elder',
    'contributor',
    'department_treasurer'
);

-- Update all tables to use the new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;
ALTER TABLE public.department_personnel ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;
ALTER TABLE public.approval_chain ALTER COLUMN approver_role TYPE app_role_new USING approver_role::text::app_role_new;

-- Drop the old enum and rename the new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Recreate the policies with updated role arrays (without super_administrator)
CREATE POLICY "High-level admins can delete funds" ON public.fund_types FOR DELETE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'general_secretary', 'pastor'])));

CREATE POLICY "Authorized users can view contributors" ON public.contributors FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'data_entry_clerk', 'general_secretary', 'pastor'])));
CREATE POLICY "Authorized users can create contributors" ON public.contributors FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'treasurer', 'general_secretary', 'pastor'])));
CREATE POLICY "Authorized users can update contributors" ON public.contributors FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'general_secretary', 'pastor'])));
CREATE POLICY "High-level admins can delete contributors" ON public.contributors FOR DELETE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'general_secretary', 'pastor'])));

CREATE POLICY "Admin roles can update QR codes" ON public.qr_codes FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(ARRAY['administrator', 'finance_administrator', 'finance_manager', 'finance_elder'])));

CREATE POLICY "Users can view accessible money requests" ON public.money_requests FOR SELECT USING (requester_id = auth.uid() OR has_role(auth.uid(), 'administrator') OR has_role(auth.uid(), 'head_of_department') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor') OR can_access_department(auth.uid(), requesting_department_id));
CREATE POLICY "Authorized users can update money requests" ON public.money_requests FOR UPDATE USING (has_role(auth.uid(), 'administrator') OR has_role(auth.uid(), 'head_of_department') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor'));

CREATE POLICY "Users can view accessible approval chains" ON public.approval_chain FOR SELECT USING (EXISTS (SELECT 1 FROM money_requests mr WHERE mr.id = money_request_id AND (mr.requester_id = auth.uid() OR has_role(auth.uid(), 'administrator') OR has_role(auth.uid(), 'head_of_department') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor') OR can_access_department(auth.uid(), mr.requesting_department_id))));

CREATE POLICY "Users can view attachments for accessible requests" ON public.request_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM money_requests mr WHERE mr.id = money_request_id AND (mr.requester_id = auth.uid() OR has_role(auth.uid(), 'administrator') OR has_role(auth.uid(), 'head_of_department') OR has_role(auth.uid(), 'finance_elder') OR has_role(auth.uid(), 'general_secretary') OR has_role(auth.uid(), 'pastor'))));