-- Phase 2: Advanced Backend Logic and Functions

-- Enhanced dynamic approval chain creation function
CREATE OR REPLACE FUNCTION public.create_dynamic_approval_chain(
  request_id UUID,
  department_id UUID,
  amount NUMERIC
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  template_record RECORD;
  step_record JSONB;
  step_info JSONB;
BEGIN
  -- Find the appropriate approval template
  SELECT * INTO template_record
  FROM public.approval_templates 
  WHERE is_active = true 
    AND (department_id IS NULL OR approval_templates.department_id = create_dynamic_approval_chain.department_id)
    AND (min_amount IS NULL OR create_dynamic_approval_chain.amount >= min_amount)
    AND (max_amount IS NULL OR create_dynamic_approval_chain.amount <= max_amount)
  ORDER BY 
    CASE WHEN approval_templates.department_id = create_dynamic_approval_chain.department_id THEN 1 ELSE 2 END,
    min_amount DESC
  LIMIT 1;

  -- If no template found, use default
  IF template_record IS NULL THEN
    SELECT * INTO template_record
    FROM public.approval_templates 
    WHERE is_default = true AND is_active = true
    LIMIT 1;
  END IF;

  -- Delete existing approval chain if it exists
  DELETE FROM public.approval_chain WHERE money_request_id = request_id;

  -- Create approval steps based on template
  FOR step_record IN SELECT * FROM jsonb_array_elements(template_record.approval_steps)
  LOOP
    step_info := step_record;
    
    INSERT INTO public.approval_chain (
      money_request_id, 
      approver_role, 
      step_order,
      due_date,
      assigned_at
    )
    VALUES (
      request_id,
      (step_info->>'role')::app_role,
      (step_info->>'step_order')::INTEGER,
      now() + INTERVAL '1 hour' * (step_info->>'timeout_hours')::INTEGER,
      now()
    );
  END LOOP;

  -- Log the creation
  PERFORM public.log_security_event(
    'approval_chain_created',
    'approval_chain',
    request_id,
    NULL,
    jsonb_build_object('template_id', template_record.id, 'department_id', department_id, 'amount', amount)
  );
END;
$$;

-- Enhanced money request status update function
CREATE OR REPLACE FUNCTION public.update_money_request_status_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_step INTEGER;
  next_unapproved_step INTEGER;
  all_approved BOOLEAN;
  has_rejection BOOLEAN;
  old_status TEXT;
  new_status TEXT;
BEGIN
  -- Get the old status for audit trail
  SELECT status INTO old_status FROM public.money_requests 
  WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);

  -- Check if there's any rejection in the approval chain
  SELECT EXISTS(
    SELECT 1 FROM public.approval_chain 
    WHERE money_request_id = COALESCE(NEW.money_request_id, OLD.money_request_id) 
    AND is_approved = false
  ) INTO has_rejection;
  
  -- If there's a rejection, mark as rejected
  IF has_rejection THEN
    new_status := 'rejected';
    UPDATE public.money_requests 
    SET status = new_status, updated_at = now()
    WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
    
    -- Create status history entry
    INSERT INTO public.money_request_status_history (money_request_id, old_status, new_status, changed_by, reason)
    VALUES (COALESCE(NEW.money_request_id, OLD.money_request_id), old_status, new_status, auth.uid(), 'Request rejected in approval chain');
    
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Find the next unapproved step
  SELECT MIN(step_order) INTO next_unapproved_step
  FROM public.approval_chain 
  WHERE money_request_id = COALESCE(NEW.money_request_id, OLD.money_request_id)
  AND (is_approved IS NULL);
  
  -- Check if all steps are approved
  SELECT NOT EXISTS(
    SELECT 1 FROM public.approval_chain 
    WHERE money_request_id = COALESCE(NEW.money_request_id, OLD.money_request_id)
    AND (is_approved IS NULL OR is_approved = false)
  ) INTO all_approved;
  
  -- Update status based on approval state
  IF all_approved THEN
    new_status := 'approved';
    UPDATE public.money_requests 
    SET status = new_status, updated_at = now()
    WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
  ELSE
    -- Determine the correct pending status based on next unapproved step
    CASE next_unapproved_step
      WHEN 1 THEN new_status := 'pending_treasurer_approval';
      WHEN 2 THEN new_status := 'pending_hod_approval';
      WHEN 3 THEN new_status := 'pending_finance_elder_approval';
      WHEN 4 THEN new_status := 'pending_general_secretary_approval';
      WHEN 5 THEN new_status := 'pending_pastor_approval';
      ELSE new_status := 'submitted';
    END CASE;
    
    UPDATE public.money_requests 
    SET status = new_status, updated_at = now()
    WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
  END IF;
  
  -- Create status history entry if status changed
  IF old_status != new_status THEN
    INSERT INTO public.money_request_status_history (money_request_id, old_status, new_status, changed_by)
    VALUES (COALESCE(NEW.money_request_id, OLD.money_request_id), old_status, new_status, auth.uid());
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to handle notification creation
CREATE OR REPLACE FUNCTION public.create_approval_notification(
  request_id UUID,
  approver_role app_role,
  notification_type TEXT DEFAULT 'approval_required'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_info RECORD;
  approver_record RECORD;
  notification_subject TEXT;
  notification_message TEXT;
BEGIN
  -- Get request information
  SELECT mr.*, d.name as department_name, p.first_name, p.last_name
  INTO request_info
  FROM public.money_requests mr
  JOIN public.departments d ON mr.requesting_department_id = d.id
  JOIN public.profiles p ON mr.requester_id = p.id
  WHERE mr.id = request_id;

  -- Build notification content
  notification_subject := CASE notification_type
    WHEN 'approval_required' THEN 'Money Request Approval Required'
    WHEN 'request_approved' THEN 'Money Request Approved'
    WHEN 'request_rejected' THEN 'Money Request Rejected'
    ELSE 'Money Request Update'
  END;

  notification_message := CASE notification_type
    WHEN 'approval_required' THEN 
      'A money request of $' || request_info.amount || ' from ' || request_info.department_name || ' requires your approval.'
    WHEN 'request_approved' THEN 
      'Your money request of $' || request_info.amount || ' has been approved.'
    WHEN 'request_rejected' THEN 
      'Your money request of $' || request_info.amount || ' has been rejected.'
    ELSE 
      'Your money request status has been updated.'
  END;

  -- Find users with the required role for this department
  FOR approver_record IN 
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = approver_role
    UNION
    SELECT DISTINCT dp.user_id
    FROM public.department_personnel dp
    WHERE dp.department_id = request_info.requesting_department_id 
    AND dp.role = approver_role
    UNION
    SELECT DISTINCT dt.user_id
    FROM public.department_treasurers dt
    WHERE dt.department_id = request_info.requesting_department_id 
    AND dt.is_active = true
    AND approver_role = 'treasurer'
  LOOP
    -- Create notification entry
    INSERT INTO public.notification_queue (
      recipient_id,
      money_request_id,
      type,
      subject,
      message,
      data
    ) VALUES (
      approver_record.user_id,
      request_id,
      'in_app',
      notification_subject,
      notification_message,
      jsonb_build_object(
        'request_id', request_id,
        'amount', request_info.amount,
        'department', request_info.department_name,
        'requester', request_info.first_name || ' ' || request_info.last_name,
        'action_required', notification_type = 'approval_required'
      )
    );
  END LOOP;
END;
$$;

-- Enhanced money request trigger function
CREATE OR REPLACE FUNCTION public.handle_new_money_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create dynamic approval chain
  PERFORM public.create_dynamic_approval_chain(NEW.id, NEW.requesting_department_id, NEW.amount);
  
  -- Create initial status history entry
  INSERT INTO public.money_request_status_history (money_request_id, old_status, new_status, changed_by, reason)
  VALUES (NEW.id, NULL, NEW.status, NEW.requester_id, 'Initial request submission');
  
  -- Create notification for first approver (treasurer)
  PERFORM public.create_approval_notification(NEW.id, 'treasurer', 'approval_required');
  
  RETURN NEW;
END;
$$;

-- Function to handle approval notifications
CREATE OR REPLACE FUNCTION public.handle_approval_chain_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_approver_role app_role;
BEGIN
  -- If this approval was just granted
  IF NEW.is_approved = true AND OLD.is_approved IS DISTINCT FROM true THEN
    -- Calculate approval duration
    NEW.approval_duration_minutes := EXTRACT(EPOCH FROM (now() - NEW.assigned_at)) / 60;
    
    -- Find next approver in chain
    SELECT approver_role INTO next_approver_role
    FROM public.approval_chain
    WHERE money_request_id = NEW.money_request_id
    AND step_order > NEW.step_order
    AND is_approved IS NULL
    ORDER BY step_order
    LIMIT 1;
    
    -- If there's a next approver, notify them
    IF next_approver_role IS NOT NULL THEN
      PERFORM public.create_approval_notification(NEW.money_request_id, next_approver_role, 'approval_required');
    END IF;
    
    -- If this was the final approval, notify the requester
    IF next_approver_role IS NULL THEN
      INSERT INTO public.notification_queue (
        recipient_id,
        money_request_id,
        type,
        subject,
        message,
        data
      )
      SELECT 
        mr.requester_id,
        NEW.money_request_id,
        'in_app',
        'Money Request Approved',
        'Your money request of $' || mr.amount || ' has been fully approved.',
        jsonb_build_object('request_id', NEW.money_request_id, 'final_approval', true)
      FROM public.money_requests mr
      WHERE mr.id = NEW.money_request_id;
    END IF;
    
  -- If this approval was rejected
  ELSIF NEW.is_approved = false AND OLD.is_approved IS DISTINCT FROM false THEN
    -- Notify the requester of rejection
    INSERT INTO public.notification_queue (
      recipient_id,
      money_request_id,
      type,
      subject,
      message,
      data
    )
    SELECT 
      mr.requester_id,
      NEW.money_request_id,
      'in_app',
      'Money Request Rejected',
      'Your money request of $' || mr.amount || ' has been rejected at the ' || NEW.approver_role || ' level.',
      jsonb_build_object('request_id', NEW.money_request_id, 'rejected_by', NEW.approver_role)
    FROM public.money_requests mr
    WHERE mr.id = NEW.money_request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_money_request_approval_chain ON public.money_requests;
DROP TRIGGER IF EXISTS trigger_money_request_status_update ON public.approval_chain;

-- Create updated triggers
CREATE TRIGGER trigger_money_request_approval_chain
AFTER INSERT ON public.money_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_new_money_request();

CREATE TRIGGER trigger_money_request_status_update
AFTER UPDATE ON public.approval_chain
FOR EACH ROW EXECUTE FUNCTION public.update_money_request_status_on_approval();

CREATE TRIGGER trigger_approval_chain_notifications
AFTER UPDATE ON public.approval_chain
FOR EACH ROW EXECUTE FUNCTION public.handle_approval_chain_update();