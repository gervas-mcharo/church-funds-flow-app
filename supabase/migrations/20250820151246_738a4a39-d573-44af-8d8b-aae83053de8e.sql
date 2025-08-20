-- Fix ambiguous column reference in advance_approval_chain function
CREATE OR REPLACE FUNCTION public.advance_approval_chain(
  p_request_id uuid, 
  p_approver_id uuid, 
  approval_status text, 
  p_comments text DEFAULT NULL
)
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
  FROM public.request_approvals ra
  WHERE ra.request_id = p_request_id
  AND ra.status = 'pending'
  ORDER BY ra.order_sequence
  LIMIT 1;

  IF current_approval IS NULL THEN
    RAISE EXCEPTION 'No pending approval found for request';
  END IF;

  -- Update current approval
  UPDATE public.request_approvals
  SET 
    approver_id = p_approver_id,
    status = approval_status,
    approved_at = CASE WHEN approval_status = 'approved' THEN now() ELSE NULL END,
    comments = p_comments
  WHERE id = current_approval.id;

  -- If rejected, update request status
  IF approval_status = 'rejected' THEN
    UPDATE public.money_requests
    SET 
      status = 'rejected',
      rejected_at = now(),
      rejection_reason = p_comments
    WHERE id = p_request_id;
    
    -- Create rejection notification
    INSERT INTO public.notification_queue (user_id, request_id, notification_type, message)
    SELECT 
      mr.requester_id,
      mr.id,
      'request_rejected',
      'Your money request for ' || mr.purpose || ' has been rejected.'
    FROM public.money_requests mr
    WHERE mr.id = p_request_id;
    
    RETURN;
  END IF;

  -- If approved, check if there are more approval steps
  SELECT * INTO next_approval
  FROM public.request_approvals ra
  WHERE ra.request_id = p_request_id
  AND ra.status = 'pending'
  AND ra.order_sequence > current_approval.order_sequence
  ORDER BY ra.order_sequence
  LIMIT 1;

  -- If no more approval steps, mark request as fully approved
  IF next_approval IS NULL THEN
    UPDATE public.money_requests
    SET 
      status = 'approved',
      approved_at = now()
    WHERE id = p_request_id;
    
    -- Create approval notification
    INSERT INTO public.notification_queue (user_id, request_id, notification_type, message)
    SELECT 
      mr.requester_id,
      mr.id,
      'request_approved',
      'Your money request for ' || mr.purpose || ' has been fully approved.'
    FROM public.money_requests mr
    WHERE mr.id = p_request_id;
  ELSE
    -- Update to next approval level status
    SELECT * INTO request_record FROM public.money_requests WHERE id = p_request_id;
    
    UPDATE public.money_requests
    SET status = CASE next_approval.approval_level
      WHEN 'department_treasurer' THEN 'pending_treasurer'
      WHEN 'head_of_department' THEN 'pending_head_of_department'
      WHEN 'finance_elder' THEN 'pending_finance_elder'
      WHEN 'general_secretary' THEN 'pending_general_secretary'
      WHEN 'pastor' THEN 'pending_pastor'
      ELSE status
    END
    WHERE id = p_request_id;
    
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
      p_request_id,
      'approval_required',
      'A money request requires your approval: ' || request_record.purpose
    FROM public.money_requests mr
    LEFT JOIN public.department_treasurers dt ON dt.department_id = mr.requesting_department_id AND dt.is_active = true AND next_approval.approval_level = 'department_treasurer'
    LEFT JOIN public.department_personnel dp ON dp.department_id = mr.requesting_department_id AND dp.role = 'head_of_department' AND next_approval.approval_level = 'head_of_department'
    LEFT JOIN public.user_roles ur ON ur.role = next_approval.approval_level::app_role AND next_approval.approval_level IN ('finance_elder', 'general_secretary', 'pastor')
    WHERE mr.id = p_request_id
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