-- Database Functions and Triggers
-- Creates all custom functions and triggers for the application

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Function to check if current user has admin role
CREATE OR REPLACE FUNCTION public.current_user_has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'administrator'
  )
$function$;

-- Function to check if user has department role
CREATE OR REPLACE FUNCTION public.has_department_role(user_id uuid, dept_id uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_personnel dp
    WHERE dp.user_id = user_id
      AND dp.department_id = dept_id
      AND dp.role = required_role
  );
$function$;

-- Function to check if user can access department
CREATE OR REPLACE FUNCTION public.can_access_department(user_id uuid, dept_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_personnel dp
    WHERE dp.user_id = user_id
      AND dp.department_id = dept_id
  );
$function$;

-- Function to get user departments
CREATE OR REPLACE FUNCTION public.get_user_departments(user_id uuid)
RETURNS TABLE(department_id uuid, role app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT dp.department_id, dp.role
  FROM public.department_personnel dp
  WHERE dp.user_id = user_id;
$function$;

-- Function to check if user is department treasurer
CREATE OR REPLACE FUNCTION public.is_department_treasurer(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_treasurers dt
    WHERE dt.user_id = _user_id
      AND dt.department_id = _department_id
      AND dt.is_active = true
  )
$function$;

-- Function to get user treasurer departments
CREATE OR REPLACE FUNCTION public.get_user_treasurer_departments(_user_id uuid)
RETURNS TABLE(department_id uuid, department_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT dt.department_id, d.name
  FROM public.department_treasurers dt
  JOIN public.departments d ON dt.department_id = d.id
  WHERE dt.user_id = _user_id
    AND dt.is_active = true
    AND d.is_active = true
$function$;

-- Function to check if user can access department finances
CREATE OR REPLACE FUNCTION public.can_access_department_finances(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT 
    -- Church treasurers can access all department finances
    public.has_role(_user_id, 'treasurer') OR
    -- Department treasurers can access their own department's finances
    public.is_department_treasurer(_user_id, _department_id) OR
    -- Other administrative roles with church-wide access
    public.has_role(_user_id, 'super_administrator') OR
    public.has_role(_user_id, 'administrator') OR
    public.has_role(_user_id, 'finance_administrator') OR
    public.has_role(_user_id, 'finance_manager') OR
    public.has_role(_user_id, 'finance_elder') OR
    public.has_role(_user_id, 'general_secretary') OR
    public.has_role(_user_id, 'pastor')
$function$;

-- Function to check if system is initialized
CREATE OR REPLACE FUNCTION public.is_system_initialized()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'administrator'
  )
$function$;

-- Function to initialize system with admin
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

-- Function to log security events
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

-- Permission functions for pledges
CREATE OR REPLACE FUNCTION public.can_bulk_import_pledges()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_create_pledges()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
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

CREATE OR REPLACE FUNCTION public.can_manage_pledges()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_delete_pledges()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator'
      )
  )
$function$;

-- Permission functions for funds
CREATE OR REPLACE FUNCTION public.can_create_funds()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'treasurer',
        'general_secretary', 
        'pastor'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_access_funds()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
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

CREATE OR REPLACE FUNCTION public.can_manage_funds()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
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

-- Permission functions for QR codes
CREATE OR REPLACE FUNCTION public.can_create_qr_codes()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
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

CREATE OR REPLACE FUNCTION public.can_delete_qr_codes()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator'
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_access_qr_management()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
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

-- Function to create approval chain
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

-- Function to update pledge status
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

-- Function to handle new user registration
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

-- Function to handle new money request
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

-- Function to prevent last admin deletion
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

-- Function to update fund balance on contribution
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

-- Function to update fund balance on approval
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

-- Function to update pledge totals
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

-- Function to log pledge changes
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

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER trigger_money_request_approval_chain
  AFTER INSERT ON public.money_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_money_request();

CREATE TRIGGER prevent_last_admin_deletion_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_last_admin_deletion();

CREATE TRIGGER update_fund_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contributions
  FOR EACH ROW EXECUTE PROCEDURE public.update_fund_balance_on_contribution();

CREATE TRIGGER update_fund_balance_on_approval_trigger
  AFTER UPDATE ON public.money_requests
  FOR EACH ROW EXECUTE PROCEDURE public.update_fund_balance_on_approval();

CREATE TRIGGER update_pledge_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pledge_contributions
  FOR EACH ROW EXECUTE PROCEDURE public.update_pledge_totals();

CREATE TRIGGER log_pledge_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pledges
  FOR EACH ROW EXECUTE PROCEDURE public.log_pledge_changes();