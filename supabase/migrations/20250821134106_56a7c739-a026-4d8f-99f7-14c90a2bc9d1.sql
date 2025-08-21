-- Updated create_approval_chain function to automatically assign approvers
CREATE OR REPLACE FUNCTION public.create_approval_chain(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_record record;
  chain_item record;
  approver_user_id uuid;
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
    -- Reset approver_user_id for each iteration
    approver_user_id := NULL;
    
    -- Assign approver based on approval level
    CASE chain_item.approval_level
      WHEN 'department_treasurer' THEN
        -- Get department treasurer for this specific department
        SELECT user_id INTO approver_user_id
        FROM public.department_treasurers dt
        WHERE dt.department_id = request_record.requesting_department_id 
        AND dt.is_active = true
        LIMIT 1;
        
      WHEN 'head_of_department' THEN
        -- Get head of department for this specific department
        -- If multiple heads exist, get the first one (any can approve logic)
        SELECT user_id INTO approver_user_id
        FROM public.department_personnel dp
        WHERE dp.department_id = request_record.requesting_department_id 
        AND dp.role = 'head_of_department'
        LIMIT 1;
        
      WHEN 'finance_elder' THEN
        -- Get user with finance_elder role
        SELECT user_id INTO approver_user_id
        FROM public.user_roles ur
        WHERE ur.role = 'finance_elder'
        LIMIT 1;
        
      WHEN 'general_secretary' THEN
        -- Get user with general_secretary role
        SELECT user_id INTO approver_user_id
        FROM public.user_roles ur
        WHERE ur.role = 'general_secretary'
        LIMIT 1;
        
      WHEN 'pastor' THEN
        -- Get user with pastor role
        SELECT user_id INTO approver_user_id
        FROM public.user_roles ur
        WHERE ur.role = 'pastor'
        LIMIT 1;
        
      ELSE
        -- For any other approval levels, leave approver_id as NULL
        approver_user_id := NULL;
    END CASE;

    -- Insert the approval record with assigned approver (if found)
    INSERT INTO public.request_approvals (
      request_id, 
      approval_level, 
      order_sequence,
      status,
      approver_id
    ) VALUES (
      request_id,
      chain_item.approval_level,
      chain_item.order_sequence,
      'pending',
      approver_user_id
    );
    
    -- Log a warning if no approver was found (but don't fail the process)
    IF approver_user_id IS NULL THEN
      RAISE NOTICE 'No approver found for approval level: % in department: %', 
        chain_item.approval_level, request_record.requesting_department_id;
    END IF;
  END LOOP;
END;
$function$;

-- Function to handle multiple heads of department approval logic
-- This function checks if ANY head of department can approve (not requiring all)
CREATE OR REPLACE FUNCTION public.can_any_head_approve_request(user_id uuid, request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.request_approvals ra
    JOIN public.money_requests mr ON ra.request_id = mr.id
    JOIN public.department_personnel dp ON dp.department_id = mr.requesting_department_id
    WHERE ra.request_id = can_any_head_approve_request.request_id
    AND ra.approval_level = 'head_of_department'
    AND ra.status = 'pending'
    AND dp.user_id = can_any_head_approve_request.user_id
    AND dp.role = 'head_of_department'
    AND ra.order_sequence = (
      SELECT MIN(order_sequence) 
      FROM public.request_approvals 
      WHERE request_id = can_any_head_approve_request.request_id 
      AND status = 'pending'
    )
  )
$function$;

-- Update can_approve_request function to handle multiple heads of department
CREATE OR REPLACE FUNCTION public.can_approve_request(user_id uuid, request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      -- Check if user is the assigned approver
      ra.approver_id = user_id OR
      -- Check specific role permissions for approval level (fallback for unassigned approvers)
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
$function$;