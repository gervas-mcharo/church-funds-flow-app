-- Phase 1: Drop ALL policies that reference the app_role enum
-- This must be done before we can alter the enum type

-- Drop all policies on user_roles table
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

-- Drop all policies on department_personnel table
DROP POLICY IF EXISTS "Authorized users can assign personnel" ON public.department_personnel;
DROP POLICY IF EXISTS "Authorized users can remove personnel" ON public.department_personnel;
DROP POLICY IF EXISTS "Authorized users can update personnel roles" ON public.department_personnel;
DROP POLICY IF EXISTS "Users can view department personnel" ON public.department_personnel;

-- Drop all policies on approval_chain table
DROP POLICY IF EXISTS "Approvers can update their approval decisions" ON public.approval_chain;
DROP POLICY IF EXISTS "System can create approval chain entries" ON public.approval_chain;
DROP POLICY IF EXISTS "Users can approve for their department role" ON public.approval_chain;
DROP POLICY IF EXISTS "Users can view accessible approval chains" ON public.approval_chain;

-- Drop all policies on money_requests table
DROP POLICY IF EXISTS "Authorized users can update money requests" ON public.money_requests;
DROP POLICY IF EXISTS "Department personnel can update requests" ON public.money_requests;
DROP POLICY IF EXISTS "Users can create money requests" ON public.money_requests;
DROP POLICY IF EXISTS "Users can create requests for their departments" ON public.money_requests;
DROP POLICY IF EXISTS "Users can view accessible money requests" ON public.money_requests;

-- Drop all policies on request_attachments table
DROP POLICY IF EXISTS "Users can upload attachments for their requests" ON public.request_attachments;
DROP POLICY IF EXISTS "Users can view attachments for accessible requests" ON public.request_attachments;

-- Drop all policies on fund_types table
DROP POLICY IF EXISTS "Authorized users can create funds" ON public.fund_types;
DROP POLICY IF EXISTS "Authorized users can update funds" ON public.fund_types;
DROP POLICY IF EXISTS "Authorized users can view funds" ON public.fund_types;
DROP POLICY IF EXISTS "High-level admins can delete funds" ON public.fund_types;

-- Drop all policies on contributors table
DROP POLICY IF EXISTS "Authorized users can create contributors" ON public.contributors;
DROP POLICY IF EXISTS "Authorized users can update contributors" ON public.contributors;
DROP POLICY IF EXISTS "Authorized users can view contributors" ON public.contributors;
DROP POLICY IF EXISTS "High-level admins can delete contributors" ON public.contributors;

-- Drop all policies on contributions table
DROP POLICY IF EXISTS "Authorized users can create contributions" ON public.contributions;
DROP POLICY IF EXISTS "Authorized users can update contributions" ON public.contributions;
DROP POLICY IF EXISTS "High-level admins can delete contributions" ON public.contributions;
DROP POLICY IF EXISTS "Users can view contributions based on role and department acces" ON public.contributions;

-- Drop all policies on pledges table
DROP POLICY IF EXISTS "Users can create pledges based on role" ON public.pledges;
DROP POLICY IF EXISTS "Users can delete pledges based on role" ON public.pledges;
DROP POLICY IF EXISTS "Users can update pledges based on role" ON public.pledges;
DROP POLICY IF EXISTS "Users can view pledges based on role" ON public.pledges;

-- Drop all policies on pledge_contributions table
DROP POLICY IF EXISTS "Users can create pledge contributions based on role" ON public.pledge_contributions;
DROP POLICY IF EXISTS "Users can delete pledge contributions based on role" ON public.pledge_contributions;
DROP POLICY IF EXISTS "Users can update pledge contributions based on role" ON public.pledge_contributions;
DROP POLICY IF EXISTS "Users can view pledge contributions based on role" ON public.pledge_contributions;

-- Drop all policies on pledge_audit_log table
DROP POLICY IF EXISTS "Users can view pledge audit logs based on role" ON public.pledge_audit_log;

-- Drop all policies on qr_codes table
DROP POLICY IF EXISTS "Admin roles can update QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Authorized users can create QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Authorized users can view QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "High-level admin roles can delete QR codes" ON public.qr_codes;

-- Drop all policies on profiles table
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Drop all policies on departments table
DROP POLICY IF EXISTS "Admins and leadership can create departments" ON public.departments;
DROP POLICY IF EXISTS "Admins and leadership can delete departments" ON public.departments;
DROP POLICY IF EXISTS "Admins and leadership can update departments" ON public.departments;
DROP POLICY IF EXISTS "Users can view departments" ON public.departments;

-- Drop all policies on department_treasurers table
DROP POLICY IF EXISTS "Admins can manage department treasurer assignments" ON public.department_treasurers;
DROP POLICY IF EXISTS "Users can view department treasurer assignments" ON public.department_treasurers;

-- Drop all policies on department_funds table
DROP POLICY IF EXISTS "Admins can manage department funds" ON public.department_funds;
DROP POLICY IF EXISTS "Users can view department funds they have access to" ON public.department_funds;

-- Drop all policies on organization_settings table
DROP POLICY IF EXISTS "Admins can manage organization settings" ON public.organization_settings;

-- Drop all policies on custom_currencies table
DROP POLICY IF EXISTS "Admins can manage custom currencies" ON public.custom_currencies;

-- Drop all policies on security_audit_log table
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can create audit logs" ON public.security_audit_log;