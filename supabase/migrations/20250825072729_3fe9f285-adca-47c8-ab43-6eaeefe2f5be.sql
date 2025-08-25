-- Add foreign key relationship between request_approvals and profiles
ALTER TABLE public.request_approvals 
ADD CONSTRAINT fk_request_approvals_approver_profile 
FOREIGN KEY (approver_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update RLS policy to allow viewing approvals for transparency
DROP POLICY IF EXISTS "Users can view relevant approvals" ON public.request_approvals;

CREATE POLICY "Users can view relevant approvals" ON public.request_approvals
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    -- Assigned approver can view
    (approver_id = auth.uid()) OR
    -- Request owner and department members can view
    (EXISTS (
      SELECT 1 FROM public.money_requests mr
      WHERE mr.id = request_approvals.request_id 
      AND (
        mr.requester_id = auth.uid() OR
        can_access_department(auth.uid(), mr.requesting_department_id) OR
        has_role(auth.uid(), 'administrator') OR
        has_role(auth.uid(), 'finance_administrator') OR
        has_role(auth.uid(), 'finance_manager') OR
        has_role(auth.uid(), 'finance_elder') OR
        has_role(auth.uid(), 'treasurer') OR
        has_role(auth.uid(), 'general_secretary') OR
        has_role(auth.uid(), 'pastor')
      )
    )) OR
    -- Allow transparency for finance and admin roles
    has_role(auth.uid(), 'administrator') OR
    has_role(auth.uid(), 'finance_administrator') OR
    has_role(auth.uid(), 'finance_elder') OR
    has_role(auth.uid(), 'general_secretary') OR
    has_role(auth.uid(), 'pastor')
  )
);