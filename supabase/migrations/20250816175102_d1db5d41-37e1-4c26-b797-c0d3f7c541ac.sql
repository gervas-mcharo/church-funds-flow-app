-- Add unique constraint on approval_chain to prevent duplicates
ALTER TABLE public.approval_chain 
ADD CONSTRAINT unique_money_request_step UNIQUE (money_request_id, step_order);

-- Create function to automatically update money request status based on approval chain
CREATE OR REPLACE FUNCTION public.update_money_request_status_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_step integer;
  next_unapproved_step integer;
  all_approved boolean;
  has_rejection boolean;
BEGIN
  -- Check if there's any rejection in the approval chain
  SELECT EXISTS(
    SELECT 1 FROM public.approval_chain 
    WHERE money_request_id = COALESCE(NEW.money_request_id, OLD.money_request_id) 
    AND is_approved = false
  ) INTO has_rejection;
  
  -- If there's a rejection, mark as rejected
  IF has_rejection THEN
    UPDATE public.money_requests 
    SET status = 'rejected', updated_at = now()
    WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Find the next unapproved step
  SELECT MIN(step_order) INTO next_unapproved_step
  FROM public.approval_chain 
  WHERE money_request_id = COALESCE(NEW.money_request_id, OLD.money_request_id)
  AND (is_approved IS NULL OR is_approved = true);
  
  -- Check if all steps are approved
  SELECT NOT EXISTS(
    SELECT 1 FROM public.approval_chain 
    WHERE money_request_id = COALESCE(NEW.money_request_id, OLD.money_request_id)
    AND (is_approved IS NULL OR is_approved = false)
  ) INTO all_approved;
  
  -- Update status based on approval state
  IF all_approved THEN
    UPDATE public.money_requests 
    SET status = 'approved', updated_at = now()
    WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
  ELSE
    -- Determine the correct pending status based on next unapproved step
    CASE next_unapproved_step
      WHEN 1 THEN
        UPDATE public.money_requests 
        SET status = 'pending_treasurer_approval', updated_at = now()
        WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
      WHEN 2 THEN
        UPDATE public.money_requests 
        SET status = 'pending_hod_approval', updated_at = now()
        WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
      WHEN 3 THEN
        UPDATE public.money_requests 
        SET status = 'pending_finance_elder_approval', updated_at = now()
        WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
      WHEN 4 THEN
        UPDATE public.money_requests 
        SET status = 'pending_general_secretary_approval', updated_at = now()
        WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
      WHEN 5 THEN
        UPDATE public.money_requests 
        SET status = 'pending_pastor_approval', updated_at = now()
        WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
      ELSE
        UPDATE public.money_requests 
        SET status = 'submitted', updated_at = now()
        WHERE id = COALESCE(NEW.money_request_id, OLD.money_request_id);
    END CASE;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for approval chain updates
DROP TRIGGER IF EXISTS trigger_update_money_request_status ON public.approval_chain;
CREATE TRIGGER trigger_update_money_request_status
  AFTER INSERT OR UPDATE OR DELETE ON public.approval_chain
  FOR EACH ROW
  EXECUTE FUNCTION public.update_money_request_status_on_approval();

-- Backfill: Fix existing inconsistencies by recalculating all money request statuses
DO $$
DECLARE
  req_record RECORD;
  next_step integer;
  all_approved boolean;
  has_rejection boolean;
  new_status money_request_status;
BEGIN
  FOR req_record IN 
    SELECT id FROM public.money_requests 
    WHERE status NOT IN ('approved', 'rejected')
  LOOP
    -- Check for rejections
    SELECT EXISTS(
      SELECT 1 FROM public.approval_chain 
      WHERE money_request_id = req_record.id 
      AND is_approved = false
    ) INTO has_rejection;
    
    IF has_rejection THEN
      new_status := 'rejected';
    ELSE
      -- Check if all approved
      SELECT NOT EXISTS(
        SELECT 1 FROM public.approval_chain 
        WHERE money_request_id = req_record.id
        AND (is_approved IS NULL OR is_approved = false)
      ) INTO all_approved;
      
      IF all_approved THEN
        new_status := 'approved';
      ELSE
        -- Find next unapproved step
        SELECT MIN(step_order) INTO next_step
        FROM public.approval_chain 
        WHERE money_request_id = req_record.id
        AND (is_approved IS NULL OR is_approved = true);
        
        new_status := CASE next_step
          WHEN 1 THEN 'pending_treasurer_approval'::money_request_status
          WHEN 2 THEN 'pending_hod_approval'::money_request_status
          WHEN 3 THEN 'pending_finance_elder_approval'::money_request_status
          WHEN 4 THEN 'pending_general_secretary_approval'::money_request_status
          WHEN 5 THEN 'pending_pastor_approval'::money_request_status
          ELSE 'submitted'::money_request_status
        END;
      END IF;
    END IF;
    
    -- Update the status
    UPDATE public.money_requests 
    SET status = new_status, updated_at = now()
    WHERE id = req_record.id;
  END LOOP;
END $$;