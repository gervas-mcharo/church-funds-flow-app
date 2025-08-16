-- Update create_approval_chain function to be idempotent
-- This prevents duplicate key errors when approval chain already exists
CREATE OR REPLACE FUNCTION public.create_approval_chain(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only create approval chain if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM public.approval_chain WHERE money_request_id = request_id
  ) THEN
    -- Insert approval steps in order with Treasurer as the first step
    INSERT INTO public.approval_chain (money_request_id, approver_role, step_order)
    VALUES 
      (request_id, 'treasurer', 1),
      (request_id, 'head_of_department', 2),
      (request_id, 'finance_elder', 3),
      (request_id, 'general_secretary', 4),
      (request_id, 'pastor', 5);
  END IF;
END;
$function$;