-- Update existing approval records to assign correct approvers
-- This will fix any existing money requests that were created before the update

DO $$
DECLARE
  approval_rec record;
  request_rec record;
  approver_user_id uuid;
BEGIN
  -- Loop through all pending approvals that don't have an approver assigned
  FOR approval_rec IN 
    SELECT ra.*, mr.requesting_department_id
    FROM request_approvals ra
    JOIN money_requests mr ON ra.request_id = mr.id
    WHERE ra.approver_id IS NULL
    AND ra.status = 'pending'
  LOOP
    -- Reset approver_user_id for each iteration
    approver_user_id := NULL;
    
    -- Assign approver based on approval level
    CASE approval_rec.approval_level
      WHEN 'department_treasurer' THEN
        -- Get department treasurer for this specific department
        SELECT user_id INTO approver_user_id
        FROM public.department_treasurers dt
        WHERE dt.department_id = approval_rec.requesting_department_id 
        AND dt.is_active = true
        LIMIT 1;
        
      WHEN 'head_of_department' THEN
        -- Get head of department for this specific department
        SELECT user_id INTO approver_user_id
        FROM public.department_personnel dp
        WHERE dp.department_id = approval_rec.requesting_department_id 
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
    END CASE;

    -- Update the approval record with the assigned approver
    IF approver_user_id IS NOT NULL THEN
      UPDATE public.request_approvals
      SET approver_id = approver_user_id
      WHERE id = approval_rec.id;
      
      RAISE NOTICE 'Assigned approver % to approval level % for request %', 
        approver_user_id, approval_rec.approval_level, approval_rec.request_id;
    ELSE
      RAISE NOTICE 'No approver found for approval level % in department %', 
        approval_rec.approval_level, approval_rec.requesting_department_id;
    END IF;
  END LOOP;
END $$;