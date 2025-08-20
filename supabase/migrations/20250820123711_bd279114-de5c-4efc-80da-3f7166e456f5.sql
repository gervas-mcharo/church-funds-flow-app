-- Fix ambiguous column reference in create_dynamic_approval_chain function
CREATE OR REPLACE FUNCTION public.create_dynamic_approval_chain(request_id uuid, dept_id uuid, amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  template_record RECORD;
  step_record JSONB;
  step_info JSONB;
BEGIN
  -- Find the appropriate approval template
  SELECT * INTO template_record
  FROM public.approval_templates 
  WHERE is_active = true 
    AND (approval_templates.department_id IS NULL OR approval_templates.department_id = dept_id)
    AND (min_amount IS NULL OR amount >= min_amount)
    AND (max_amount IS NULL OR amount <= max_amount)
  ORDER BY 
    CASE WHEN approval_templates.department_id = dept_id THEN 1 ELSE 2 END,
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
    jsonb_build_object('template_id', template_record.id, 'department_id', dept_id, 'amount', amount)
  );
END;
$function$;

-- Fix ambiguous column reference in create_approval_notification function
CREATE OR REPLACE FUNCTION public.create_approval_notification(request_id uuid, approver_role app_role, notification_type text DEFAULT 'approval_required'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;