-- Drop the existing function first
DROP FUNCTION IF EXISTS public.create_dynamic_approval_chain(uuid,uuid,numeric);

-- Recreate with fixed parameter name to avoid ambiguity
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