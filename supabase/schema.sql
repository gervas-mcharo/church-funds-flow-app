-- Complete Supabase Schema Dump
-- Generated and updated to match current database state
-- This file contains all database schema elements needed to recreate the backend

-- ============================================================================
-- ENUMERATED TYPES
-- ============================================================================

CREATE TYPE public.app_role AS ENUM ('administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'department_treasurer', 'data_entry_clerk', 'general_secretary', 'pastor', 'head_of_department', 'department_member', 'secretary');

CREATE TYPE public.money_request_status AS ENUM ('submitted', 'pending_hod_approval', 'pending_finance_elder_approval', 'pending_general_secretary_approval', 'pending_pastor_approval', 'approved', 'rejected', 'paid');

CREATE TYPE public.pledge_frequency AS ENUM ('one_time', 'weekly', 'monthly', 'quarterly', 'annually');

CREATE TYPE public.pledge_status AS ENUM ('active', 'upcoming', 'partially_fulfilled', 'fulfilled', 'overdue', 'cancelled');

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE public.approval_chain (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  money_request_id UUID NOT NULL,
  approver_role app_role NOT NULL,
  approver_id UUID,
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  is_approved BOOLEAN,
  step_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL,
  fund_type_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  contribution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  qr_code_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  department_id UUID
);

CREATE TABLE public.contributors (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.custom_currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT gen_random_uuid(),
  currency_code TEXT NOT NULL,
  currency_name TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.department_funds (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL,
  fund_type_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.department_personnel (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.department_treasurers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  department_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.fund_types (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0
);

CREATE TABLE public.money_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  requesting_department_id UUID NOT NULL,
  requester_id UUID NOT NULL,
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  amount NUMERIC NOT NULL,
  purpose TEXT NOT NULL,
  suggested_vendor TEXT,
  associated_project TEXT,
  status money_request_status NOT NULL DEFAULT 'submitted'::money_request_status,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fund_type_id UUID NOT NULL
);

CREATE TABLE public.organization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pledge_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  pledge_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

CREATE TABLE public.pledge_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  pledge_id UUID NOT NULL,
  contribution_id UUID NOT NULL,
  amount_applied NUMERIC NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_by UUID,
  notes TEXT
);

CREATE TABLE public.pledges (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL,
  fund_type_id UUID NOT NULL,
  pledge_amount NUMERIC NOT NULL,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  remaining_balance NUMERIC,
  status pledge_status NOT NULL DEFAULT 'active'::pledge_status,
  frequency pledge_frequency NOT NULL DEFAULT 'one_time'::pledge_frequency,
  installment_amount NUMERIC,
  number_of_installments INTEGER,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_payment_date DATE,
  last_payment_date DATE,
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  department_id UUID
);

CREATE TABLE public.profiles (
  id UUID NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  qr_data TEXT NOT NULL,
  contributor_id UUID,
  fund_type_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.request_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  money_request_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- PRIMARY KEYS
-- ============================================================================

ALTER TABLE public.approval_chain ADD PRIMARY KEY (id);
ALTER TABLE public.contributions ADD PRIMARY KEY (id);
ALTER TABLE public.contributors ADD PRIMARY KEY (id);
ALTER TABLE public.custom_currencies ADD PRIMARY KEY (id);
ALTER TABLE public.department_funds ADD PRIMARY KEY (id);
ALTER TABLE public.department_personnel ADD PRIMARY KEY (id);
ALTER TABLE public.department_treasurers ADD PRIMARY KEY (id);
ALTER TABLE public.departments ADD PRIMARY KEY (id);
ALTER TABLE public.fund_types ADD PRIMARY KEY (id);
ALTER TABLE public.money_requests ADD PRIMARY KEY (id);
ALTER TABLE public.organization_settings ADD PRIMARY KEY (id);
ALTER TABLE public.pledge_audit_log ADD PRIMARY KEY (id);
ALTER TABLE public.pledge_contributions ADD PRIMARY KEY (id);
ALTER TABLE public.pledges ADD PRIMARY KEY (id);
ALTER TABLE public.profiles ADD PRIMARY KEY (id);
ALTER TABLE public.qr_codes ADD PRIMARY KEY (id);
ALTER TABLE public.request_attachments ADD PRIMARY KEY (id);
ALTER TABLE public.security_audit_log ADD PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD PRIMARY KEY (id);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_access_department(user_id uuid, dept_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_personnel dp
    WHERE dp.user_id = user_id
      AND dp.department_id = dept_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_department_finances(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT 
    -- Church treasurers can access all department finances
    public.has_role(_user_id, 'treasurer') OR
    -- Department treasurers can access their own department's finances
    public.is_department_treasurer(_user_id, _department_id) OR
    -- Other administrative roles with church-wide access
    public.has_role(_user_id, 'administrator') OR
    public.has_role(_user_id, 'finance_administrator') OR
    public.has_role(_user_id, 'finance_manager') OR
    public.has_role(_user_id, 'finance_elder') OR
    public.has_role(_user_id, 'general_secretary') OR
    public.has_role(_user_id, 'pastor')
$function$;

CREATE OR REPLACE FUNCTION public.can_access_funds()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ( 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'treasurer',
        'department_treasurer',
        'data_entry_clerk',
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_access_qr_management()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'data_entry_clerk', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_bulk_import_pledges()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_create_funds()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_create_pledges()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'data_entry_clerk',
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_create_qr_codes()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'data_entry_clerk', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_delete_pledges()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_delete_qr_codes()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_funds()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_pledges()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.create_approval_chain(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert approval steps in order with Treasurer as the first step
  INSERT INTO public.approval_chain (money_request_id, approver_role, step_order)
  VALUES 
    (request_id, 'treasurer', 1),
    (request_id, 'head_of_department', 2),
    (request_id, 'finance_elder', 3),
    (request_id, 'general_secretary', 4),
    (request_id, 'pastor', 5);
END;
$function$;

CREATE OR REPLACE FUNCTION public.current_user_has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'administrator'
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_treasurer_departments(_user_id uuid)
RETURNS TABLE(department_id uuid, department_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT dt.department_id, d.name
  FROM public.department_treasurers dt
  JOIN public.departments d ON dt.department_id = d.id
  WHERE dt.user_id = _user_id
    AND dt.is_active = true
    AND d.is_active = true
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_money_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Create approval chain for the new request
  PERFORM public.create_approval_chain(NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_department_role(user_id uuid, dept_id uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_personnel dp
    WHERE dp.user_id = user_id
      AND dp.department_id = dept_id
      AND dp.role = required_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.initialize_system_with_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_department_treasurer(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_treasurers dt
    WHERE dt.user_id = _user_id
      AND dt.department_id = _department_id
      AND dt.is_active = true
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_system_initialized()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'administrator'
  )
$function$;

CREATE OR REPLACE FUNCTION public.log_pledge_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.pledge_audit_log (pledge_id, action, old_values, new_values, changed_by)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(_action text, _table_name text, _record_id uuid DEFAULT NULL::uuid, _old_values jsonb DEFAULT NULL::jsonb, _new_values jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), _action, _table_name, _record_id, _old_values, _new_values
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_last_admin_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if this is the last administrator
  IF OLD.role = 'administrator' AND (
    SELECT COUNT(*) FROM public.user_roles WHERE role = 'administrator' AND user_id != OLD.user_id
  ) = 0 THEN
    RAISE EXCEPTION 'Cannot delete the last administrator account';
  END IF;
  
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_fund_balance_on_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if status changed to 'approved' and it wasn't approved before
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Deduct the amount from the fund type's current balance
    UPDATE fund_types 
    SET current_balance = current_balance - NEW.amount
    WHERE id = NEW.fund_type_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_fund_balance_on_contribution()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Handle INSERT: Add contribution amount to fund balance
  IF TG_OP = 'INSERT' THEN
    UPDATE fund_types 
    SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.fund_type_id;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE: Adjust balance based on amount difference
  IF TG_OP = 'UPDATE' THEN
    -- If fund type changed, subtract from old fund and add to new fund
    IF OLD.fund_type_id != NEW.fund_type_id THEN
      UPDATE fund_types 
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.fund_type_id;
      
      UPDATE fund_types 
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.fund_type_id;
    ELSE
      -- Same fund type, just adjust by the difference
      UPDATE fund_types 
      SET current_balance = current_balance - OLD.amount + NEW.amount
      WHERE id = NEW.fund_type_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE: Subtract contribution amount from fund balance
  IF TG_OP = 'DELETE' THEN
    UPDATE fund_types 
    SET current_balance = current_balance - OLD.amount
    WHERE id = OLD.fund_type_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_pledge_status()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update overdue pledges
  UPDATE public.pledges 
  SET status = 'overdue'
  WHERE status IN ('active', 'partially_fulfilled')
    AND next_payment_date IS NOT NULL 
    AND next_payment_date < CURRENT_DATE
    AND total_paid < pledge_amount;
    
  -- Update upcoming pledges to active
  UPDATE public.pledges 
  SET status = 'active'
  WHERE status = 'upcoming'
    AND start_date <= CURRENT_DATE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_pledge_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update total_paid for the pledge
  UPDATE public.pledges 
  SET 
    total_paid = (
      SELECT COALESCE(SUM(amount_applied), 0) 
      FROM public.pledge_contributions 
      WHERE pledge_id = COALESCE(NEW.pledge_id, OLD.pledge_id)
    ),
    last_payment_date = CASE 
      WHEN TG_OP = 'INSERT' THEN NEW.applied_at::DATE
      ELSE last_payment_date
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.pledge_id, OLD.pledge_id);
  
  -- Update status based on fulfillment
  UPDATE public.pledges 
  SET status = CASE 
    WHEN total_paid >= pledge_amount THEN 'fulfilled'
    WHEN total_paid > 0 THEN 'partially_fulfilled'
    ELSE status
  END
  WHERE id = COALESCE(NEW.pledge_id, OLD.pledge_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.approval_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_treasurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- approval_chain policies
CREATE POLICY "Approvers can update their approval decisions" ON public.approval_chain
FOR UPDATE
AS PERMISSIVE
TO public
USING (((approver_id = auth.uid()) OR has_role(auth.uid(), 'administrator'::app_role)));

CREATE POLICY "System can create approval chain entries" ON public.approval_chain
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK (true);

CREATE POLICY "Users can approve for their department role" ON public.approval_chain
FOR UPDATE
AS PERMISSIVE
TO public
USING ((EXISTS ( SELECT 1
   FROM money_requests mr
  WHERE ((mr.id = approval_chain.money_request_id) AND has_department_role(auth.uid(), mr.requesting_department_id, approval_chain.approver_role)))));

CREATE POLICY "Users can view accessible approval chains" ON public.approval_chain
FOR SELECT
AS PERMISSIVE
TO public
USING ((EXISTS ( SELECT 1
   FROM money_requests mr
  WHERE ((mr.id = approval_chain.money_request_id) AND ((mr.requester_id = auth.uid()) OR has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'head_of_department'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR can_access_department(auth.uid(), mr.requesting_department_id))))));

-- contributions policies
CREATE POLICY "Authorized users can create contributions" ON public.contributions
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK ((current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer'::app_role) OR has_role(auth.uid(), 'finance_administrator'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'data_entry_clerk'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR ((department_id IS NOT NULL) AND is_department_treasurer(auth.uid(), department_id))));

CREATE POLICY "Authorized users can update contributions" ON public.contributions
FOR UPDATE
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer'::app_role) OR has_role(auth.uid(), 'finance_administrator'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR ((department_id IS NOT NULL) AND is_department_treasurer(auth.uid(), department_id))));

CREATE POLICY "High-level admins can delete contributions" ON public.contributions
FOR DELETE
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR has_role(auth.uid(), 'finance_administrator'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));

CREATE POLICY "Users can view contributions based on role and department acces" ON public.contributions
FOR SELECT
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer'::app_role) OR has_role(auth.uid(), 'finance_administrator'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'data_entry_clerk'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR ((department_id IS NOT NULL) AND is_department_treasurer(auth.uid(), department_id))));

-- contributors policies
CREATE POLICY "Authorized users can create contributors" ON public.contributors
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'treasurer'::app_role, 'general_secretary'::app_role, 'pastor'::app_role]))))));

CREATE POLICY "Authorized users can update contributors" ON public.contributors
FOR UPDATE
AS PERMISSIVE
TO public
USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'finance_manager'::app_role, 'finance_elder'::app_role, 'treasurer'::app_role, 'general_secretary'::app_role, 'pastor'::app_role]))))));

CREATE POLICY "Authorized users can view contributors" ON public.contributors
FOR SELECT
AS PERMISSIVE
TO public
USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'finance_manager'::app_role, 'finance_elder'::app_role, 'treasurer'::app_role, 'data_entry_clerk'::app_role, 'general_secretary'::app_role, 'pastor'::app_role]))))));

CREATE POLICY "High-level admins can delete contributors" ON public.contributors
FOR DELETE
AS PERMISSIVE
TO public
USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'general_secretary'::app_role, 'pastor'::app_role]))))));

-- custom_currencies policies
CREATE POLICY "Admins can manage custom currencies" ON public.custom_currencies
FOR ALL
AS PERMISSIVE
TO public
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

-- department_funds policies
CREATE POLICY "Admins can manage department funds" ON public.department_funds
FOR ALL
AS PERMISSIVE
TO public
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

CREATE POLICY "Users can view department funds they have access to" ON public.department_funds
FOR SELECT
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer'::app_role) OR is_department_treasurer(auth.uid(), department_id)));

-- department_personnel policies
CREATE POLICY "Authorized users can assign personnel" ON public.department_personnel
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK ((current_user_has_admin_role() OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['general_secretary'::app_role, 'pastor'::app_role]))))) OR (EXISTS ( SELECT 1
   FROM department_personnel dp
  WHERE ((dp.user_id = auth.uid()) AND (dp.department_id = dp.department_id) AND (dp.role = 'head_of_department'::app_role))))));

CREATE POLICY "Authorized users can remove personnel" ON public.department_personnel
FOR DELETE
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['general_secretary'::app_role, 'pastor'::app_role]))))) OR (EXISTS ( SELECT 1
   FROM department_personnel dp
  WHERE ((dp.user_id = auth.uid()) AND (dp.department_id = dp.department_id) AND (dp.role = 'head_of_department'::app_role))))));

CREATE POLICY "Authorized users can update personnel roles" ON public.department_personnel
FOR UPDATE
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['general_secretary'::app_role, 'pastor'::app_role]))))) OR (EXISTS ( SELECT 1
   FROM department_personnel dp
  WHERE ((dp.user_id = auth.uid()) AND (dp.department_id = dp.department_id) AND (dp.role = 'head_of_department'::app_role))))));

CREATE POLICY "Users can view department personnel" ON public.department_personnel
FOR SELECT
AS PERMISSIVE
TO public
USING (true);

-- department_treasurers policies
CREATE POLICY "Admins can manage department treasurer assignments" ON public.department_treasurers
FOR ALL
AS PERMISSIVE
TO public
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

CREATE POLICY "Users can view department treasurer assignments" ON public.department_treasurers
FOR SELECT
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer'::app_role) OR (user_id = auth.uid())));

-- departments policies
CREATE POLICY "Admins and leadership can create departments" ON public.departments
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK ((current_user_has_admin_role() OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['general_secretary'::app_role, 'pastor'::app_role])))))));

CREATE POLICY "Admins and leadership can delete departments" ON public.departments
FOR DELETE
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['general_secretary'::app_role, 'pastor'::app_role])))))));

CREATE POLICY "Admins and leadership can update departments" ON public.departments
FOR UPDATE
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['general_secretary'::app_role, 'pastor'::app_role])))))));

CREATE POLICY "Users can view departments" ON public.departments
FOR SELECT
AS PERMISSIVE
TO public
USING (true);

-- fund_types policies
CREATE POLICY "Authorized users can create funds" ON public.fund_types
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK (can_create_funds());

CREATE POLICY "Authorized users can update funds" ON public.fund_types
FOR UPDATE
AS PERMISSIVE
TO public
USING (can_manage_funds());

CREATE POLICY "Authorized users can view funds" ON public.fund_types
FOR SELECT
AS PERMISSIVE
TO public
USING (can_access_funds());

CREATE POLICY "High-level admins can delete funds" ON public.fund_types
FOR DELETE
AS PERMISSIVE
TO public
USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'general_secretary'::app_role, 'pastor'::app_role]))))));

-- money_requests policies
CREATE POLICY "Authorized users can update money requests" ON public.money_requests
FOR UPDATE
AS PERMISSIVE
TO public
USING ((has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'head_of_department'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));

CREATE POLICY "Department personnel can update requests" ON public.money_requests
FOR UPDATE
AS PERMISSIVE
TO public
USING (can_access_department(auth.uid(), requesting_department_id));

CREATE POLICY "Users can create money requests" ON public.money_requests
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK ((requester_id = auth.uid()));

CREATE POLICY "Users can create requests for their departments" ON public.money_requests
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK ((can_access_department(auth.uid(), requesting_department_id) AND (auth.uid() = requester_id)));

CREATE POLICY "Users can view accessible money requests" ON public.money_requests
FOR SELECT
AS PERMISSIVE
TO public
USING (((requester_id = auth.uid()) OR has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'head_of_department'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR can_access_department(auth.uid(), requesting_department_id)));

-- organization_settings policies
CREATE POLICY "Admins can manage organization settings" ON public.organization_settings
FOR ALL
AS PERMISSIVE
TO public
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

-- pledge_audit_log policies
CREATE POLICY "Users can view pledge audit logs based on role" ON public.pledge_audit_log
FOR SELECT
AS PERMISSIVE
TO public
USING (can_manage_pledges());

-- pledge_contributions policies
CREATE POLICY "Users can create pledge contributions based on role" ON public.pledge_contributions
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK (can_manage_pledges());

CREATE POLICY "Users can delete pledge contributions based on role" ON public.pledge_contributions
FOR DELETE
AS PERMISSIVE
TO public
USING (can_delete_pledges());

CREATE POLICY "Users can update pledge contributions based on role" ON public.pledge_contributions
FOR UPDATE
AS PERMISSIVE
TO public
USING (can_manage_pledges());

CREATE POLICY "Users can view pledge contributions based on role" ON public.pledge_contributions
FOR SELECT
AS PERMISSIVE
TO public
USING (((auth.uid() IS NOT NULL) AND (can_manage_pledges() OR can_create_pledges())));

-- pledges policies
CREATE POLICY "Users can create pledges based on role" ON public.pledges
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK (can_create_pledges());

CREATE POLICY "Users can delete pledges based on role" ON public.pledges
FOR DELETE
AS PERMISSIVE
TO public
USING (can_delete_pledges());

CREATE POLICY "Users can update pledges based on role" ON public.pledges
FOR UPDATE
AS PERMISSIVE
TO public
USING (can_manage_pledges());

CREATE POLICY "Users can view pledges based on role" ON public.pledges
FOR SELECT
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR has_role(auth.uid(), 'treasurer'::app_role) OR has_role(auth.uid(), 'finance_administrator'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'data_entry_clerk'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR ((department_id IS NOT NULL) AND is_department_treasurer(auth.uid(), department_id))));

-- profiles policies
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL
AS PERMISSIVE
TO public
USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
AS PERMISSIVE
TO public
USING ((auth.uid() = id));

CREATE POLICY "Users can view profiles" ON public.profiles
FOR SELECT
AS PERMISSIVE
TO public
USING (true);

-- qr_codes policies
CREATE POLICY "Admin roles can update QR codes" ON public.qr_codes
FOR UPDATE
AS PERMISSIVE
TO public
USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['administrator'::app_role, 'finance_administrator'::app_role, 'finance_manager'::app_role, 'finance_elder'::app_role]))))));

CREATE POLICY "Authorized users can create QR codes" ON public.qr_codes
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK (can_create_qr_codes());

CREATE POLICY "Authorized users can view QR codes" ON public.qr_codes
FOR SELECT
AS PERMISSIVE
TO public
USING (can_access_qr_management());

CREATE POLICY "High-level admin roles can delete QR codes" ON public.qr_codes
FOR DELETE
AS PERMISSIVE
TO public
USING (can_delete_qr_codes());

-- request_attachments policies
CREATE POLICY "Users can upload attachments for their requests" ON public.request_attachments
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK ((uploaded_by = auth.uid()));

CREATE POLICY "Users can view attachments for accessible requests" ON public.request_attachments
FOR SELECT
AS PERMISSIVE
TO public
USING ((EXISTS ( SELECT 1
   FROM money_requests mr
  WHERE ((mr.id = request_attachments.money_request_id) AND ((mr.requester_id = auth.uid()) OR has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'head_of_department'::app_role) OR has_role(auth.uid(), 'finance_elder'::app_role) OR has_role(auth.uid(), 'general_secretary'::app_role) OR has_role(auth.uid(), 'pastor'::app_role))))));

-- security_audit_log policies
CREATE POLICY "Only admins can view audit logs" ON public.security_audit_log
FOR SELECT
AS PERMISSIVE
TO public
USING (current_user_has_admin_role());

CREATE POLICY "System can create audit logs" ON public.security_audit_log
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK (true);

-- user_roles policies
CREATE POLICY "Admins can assign roles" ON public.user_roles
FOR INSERT
AS PERMISSIVE
TO public
WITH CHECK (current_user_has_admin_role());

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE
AS PERMISSIVE
TO public
USING (current_user_has_admin_role());

CREATE POLICY "Admins can update roles" ON public.user_roles
FOR UPDATE
AS PERMISSIVE
TO public
USING (current_user_has_admin_role());

CREATE POLICY "Users can view roles" ON public.user_roles
FOR SELECT
AS PERMISSIVE
TO public
USING ((current_user_has_admin_role() OR (user_id = auth.uid())));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER trigger_update_fund_balance_on_contribution
  AFTER INSERT OR UPDATE OR DELETE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_fund_balance_on_contribution();

CREATE TRIGGER trigger_money_request_approval_chain
  AFTER INSERT ON public.money_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_money_request();

CREATE TRIGGER trigger_update_fund_balance_on_approval
  AFTER UPDATE ON public.money_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_fund_balance_on_approval();

CREATE TRIGGER trigger_update_pledge_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.pledge_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_pledge_totals();

CREATE TRIGGER trigger_log_pledge_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pledges
  FOR EACH ROW
  EXECUTE FUNCTION log_pledge_changes();

CREATE TRIGGER prevent_last_admin_deletion_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_admin_deletion();

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default fund types
INSERT INTO public.fund_types (name, description) VALUES
('General Fund', 'General church operations and expenses'),
('Building Fund', 'Building maintenance and construction projects'),
('Missions Fund', 'Missionary support and outreach programs'),
('Youth Fund', 'Youth ministry programs and activities')
ON CONFLICT DO NOTHING;

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
('Administration', 'Church administration and management'),
('Worship', 'Worship services and music ministry'),
('Youth Ministry', 'Youth programs and activities'),
('Outreach', 'Community outreach and evangelism')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF SCHEMA DUMP
-- ============================================================================