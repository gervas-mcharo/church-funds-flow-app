
-- Create security definer functions for pledge permissions
CREATE OR REPLACE FUNCTION public.can_manage_pledges()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'general_secretary', 
        'pastor'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_create_pledges()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'data_entry_clerk',
        'general_secretary', 
        'pastor'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_bulk_import_pledges()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator', 
        'finance_manager', 
        'finance_elder', 
        'general_secretary', 
        'pastor'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_delete_pledges()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'super_administrator', 
        'administrator', 
        'finance_administrator'
      )
  )
$$;

-- Update RLS policies for pledges table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pledges;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.pledges;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.pledges;

-- Create new role-based RLS policies
CREATE POLICY "Users can view pledges based on role" 
  ON public.pledges 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      public.can_manage_pledges() OR
      public.can_create_pledges()
    )
  );

CREATE POLICY "Users can create pledges based on role" 
  ON public.pledges 
  FOR INSERT 
  WITH CHECK (
    public.can_create_pledges()
  );

CREATE POLICY "Users can update pledges based on role" 
  ON public.pledges 
  FOR UPDATE 
  USING (
    public.can_manage_pledges()
  );

CREATE POLICY "Users can delete pledges based on role" 
  ON public.pledges 
  FOR DELETE 
  USING (
    public.can_delete_pledges()
  );

-- Update RLS policies for pledge_contributions table
ALTER TABLE public.pledge_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pledge contributions based on role" 
  ON public.pledge_contributions 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      public.can_manage_pledges() OR
      public.can_create_pledges()
    )
  );

CREATE POLICY "Users can create pledge contributions based on role" 
  ON public.pledge_contributions 
  FOR INSERT 
  WITH CHECK (
    public.can_manage_pledges()
  );

CREATE POLICY "Users can update pledge contributions based on role" 
  ON public.pledge_contributions 
  FOR UPDATE 
  USING (
    public.can_manage_pledges()
  );

CREATE POLICY "Users can delete pledge contributions based on role" 
  ON public.pledge_contributions 
  FOR DELETE 
  USING (
    public.can_delete_pledges()
  );

-- Update RLS policies for pledge_audit_log table
ALTER TABLE public.pledge_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pledge audit logs based on role" 
  ON public.pledge_audit_log 
  FOR SELECT 
  USING (
    public.can_manage_pledges()
  );
