-- Create functions for money request workflow
CREATE OR REPLACE FUNCTION public.create_approval_chain(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record record;
  chain_item record;
BEGIN
  -- Get the request details
  SELECT * INTO request_record 
  FROM public.money_requests 
  WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Money request not found';
  END IF;

  -- Create approval chain entries based on department's approval chain
  FOR chain_item IN 
    SELECT * FROM public.approval_chain 
    WHERE department_id = request_record.requesting_department_id 
    AND is_required = true
    ORDER BY order_sequence
  LOOP
    INSERT INTO public.request_approvals (
      request_id, 
      approval_level, 
      order_sequence,
      status
    ) VALUES (
      request_id,
      chain_item.approval_level,
      chain_item.order_sequence,
      'pending'
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_approve_request(user_id uuid, request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.request_approvals ra
    JOIN public.money_requests mr ON ra.request_id = mr.id
    WHERE ra.request_id = can_approve_request.request_id
    AND ra.status = 'pending'
    AND ra.order_sequence = (
      SELECT MIN(order_sequence) 
      FROM public.request_approvals 
      WHERE request_id = can_approve_request.request_id 
      AND status = 'pending'
    )
    AND (
      -- Check specific role permissions for approval level
      (ra.approval_level = 'department_treasurer' AND is_department_treasurer(user_id, mr.requesting_department_id)) OR
      (ra.approval_level = 'head_of_department' AND has_department_role(user_id, mr.requesting_department_id, 'head_of_department')) OR
      (ra.approval_level = 'finance_elder' AND has_role(user_id, 'finance_elder')) OR
      (ra.approval_level = 'general_secretary' AND has_role(user_id, 'general_secretary')) OR
      (ra.approval_level = 'pastor' AND has_role(user_id, 'pastor')) OR
      -- Admins can approve at any level
      has_role(user_id, 'administrator') OR
      has_role(user_id, 'finance_administrator')
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.advance_approval_chain(request_id uuid, approver_id uuid, approval_status text, comments text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_approval record;
  next_approval record;
  request_record record;
BEGIN
  -- Get current approval step
  SELECT * INTO current_approval
  FROM public.request_approvals
  WHERE request_id = advance_approval_chain.request_id
  AND status = 'pending'
  ORDER BY order_sequence
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending approval found for this request';
  END IF;

  -- Update current approval
  UPDATE public.request_approvals
  SET 
    approver_id = advance_approval_chain.approver_id,
    status = approval_status,
    approved_at = CASE WHEN approval_status = 'approved' THEN now() ELSE NULL END,
    comments = advance_approval_chain.comments
  WHERE id = current_approval.id;

  -- If rejected, update request status
  IF approval_status = 'rejected' THEN
    UPDATE public.money_requests
    SET 
      status = 'rejected',
      rejected_at = now(),
      rejection_reason = advance_approval_chain.comments
    WHERE id = advance_approval_chain.request_id;
    
    -- Create rejection notification
    INSERT INTO public.notification_queue (user_id, request_id, notification_type, message)
    SELECT 
      mr.requester_id,
      mr.id,
      'request_rejected',
      'Your money request for ' || mr.purpose || ' has been rejected.'
    FROM public.money_requests mr
    WHERE mr.id = advance_approval_chain.request_id;
    
    RETURN;
  END IF;

  -- If approved, check if there are more approval steps
  SELECT * INTO next_approval
  FROM public.request_approvals
  WHERE request_id = advance_approval_chain.request_id
  AND status = 'pending'
  AND order_sequence > current_approval.order_sequence
  ORDER BY order_sequence
  LIMIT 1;

  -- Update request status based on approval progress
  IF next_approval IS NULL THEN
    -- No more approvals needed - fully approved
    UPDATE public.money_requests
    SET 
      status = 'approved',
      approved_at = now()
    WHERE id = advance_approval_chain.request_id;
    
    -- Create approval notification
    INSERT INTO public.notification_queue (user_id, request_id, notification_type, message)
    SELECT 
      mr.requester_id,
      mr.id,
      'request_approved',
      'Your money request for ' || mr.purpose || ' has been fully approved.'
    FROM public.money_requests mr
    WHERE mr.id = advance_approval_chain.request_id;
  ELSE
    -- Update to next approval level status
    SELECT * INTO request_record FROM public.money_requests WHERE id = advance_approval_chain.request_id;
    
    UPDATE public.money_requests
    SET status = CASE next_approval.approval_level
      WHEN 'department_treasurer' THEN 'pending_treasurer'
      WHEN 'head_of_department' THEN 'pending_hod'
      WHEN 'finance_elder' THEN 'pending_finance_elder'
      WHEN 'general_secretary' THEN 'pending_general_secretary'
      WHEN 'pastor' THEN 'pending_pastor'
      ELSE status
    END
    WHERE id = advance_approval_chain.request_id;
    
    -- Create notification for next approver(s)
    INSERT INTO public.notification_queue (user_id, request_id, notification_type, message)
    SELECT 
      CASE next_approval.approval_level
        WHEN 'department_treasurer' THEN dt.user_id
        WHEN 'head_of_department' THEN dp.user_id
        WHEN 'finance_elder' THEN ur.user_id
        WHEN 'general_secretary' THEN ur.user_id
        WHEN 'pastor' THEN ur.user_id
      END,
      advance_approval_chain.request_id,
      'approval_required',
      'A money request requires your approval: ' || request_record.purpose
    FROM public.money_requests mr
    LEFT JOIN public.department_treasurers dt ON dt.department_id = mr.requesting_department_id AND dt.is_active = true AND next_approval.approval_level = 'department_treasurer'
    LEFT JOIN public.department_personnel dp ON dp.department_id = mr.requesting_department_id AND dp.role = 'head_of_department' AND next_approval.approval_level = 'head_of_department'
    LEFT JOIN public.user_roles ur ON ur.role = next_approval.approval_level::app_role AND next_approval.approval_level IN ('finance_elder', 'general_secretary', 'pastor')
    WHERE mr.id = advance_approval_chain.request_id
    AND CASE next_approval.approval_level
      WHEN 'department_treasurer' THEN dt.user_id
      WHEN 'head_of_department' THEN dp.user_id
      WHEN 'finance_elder' THEN ur.user_id
      WHEN 'general_secretary' THEN ur.user_id
      WHEN 'pastor' THEN ur.user_id
    END IS NOT NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_pending_approvals(user_id uuid)
RETURNS TABLE(
  request_id uuid,
  amount decimal,
  purpose text,
  department_name text,
  requester_name text,
  created_at timestamp with time zone,
  approval_level approval_level
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    mr.id,
    mr.amount,
    mr.purpose,
    d.name,
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    mr.created_at,
    ra.approval_level
  FROM public.money_requests mr
  JOIN public.request_approvals ra ON ra.request_id = mr.id
  JOIN public.departments d ON d.id = mr.requesting_department_id
  LEFT JOIN public.profiles p ON p.id = mr.requester_id
  WHERE ra.status = 'pending'
  AND ra.order_sequence = (
    SELECT MIN(order_sequence) 
    FROM public.request_approvals 
    WHERE request_id = mr.id 
    AND status = 'pending'
  )
  AND can_approve_request(get_user_pending_approvals.user_id, mr.id)
  ORDER BY mr.created_at ASC
$$;

CREATE OR REPLACE FUNCTION public.handle_new_money_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create approval chain when status changes to 'submitted'
  IF NEW.status = 'submitted' AND (OLD IS NULL OR OLD.status != 'submitted') THEN
    PERFORM public.create_approval_chain(NEW.id);
    
    -- Update status to first approval level
    UPDATE public.money_requests
    SET status = 'pending_treasurer'
    WHERE id = NEW.id;
    
    -- Create notifications for first approvers
    INSERT INTO public.notification_queue (user_id, request_id, notification_type, message)
    SELECT 
      dt.user_id,
      NEW.id,
      'approval_required',
      'A new money request requires your approval: ' || NEW.purpose
    FROM public.department_treasurers dt
    WHERE dt.department_id = NEW.requesting_department_id 
    AND dt.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_fund_balance_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When request is approved, deduct amount from fund balance
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.fund_types 
    SET current_balance = current_balance - NEW.amount
    WHERE id = NEW.fund_type_id;
    
    -- Log the transaction in security audit
    PERFORM public.log_security_event(
      'fund_balance_deducted',
      'fund_types',
      NEW.fund_type_id,
      jsonb_build_object('previous_balance', (SELECT current_balance FROM public.fund_types WHERE id = NEW.fund_type_id)),
      jsonb_build_object(
        'new_balance', (SELECT current_balance FROM public.fund_types WHERE id = NEW.fund_type_id),
        'deducted_amount', NEW.amount,
        'request_id', NEW.id,
        'purpose', NEW.purpose
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_money_request_submission
  AFTER INSERT OR UPDATE ON public.money_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_money_request();

CREATE TRIGGER trigger_update_fund_balance_on_approval
  AFTER UPDATE ON public.money_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fund_balance_on_approval();