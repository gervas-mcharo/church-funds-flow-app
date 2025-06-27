
-- Phase 1: Database Schema Updates

-- Step 1.1: Add department_treasurer to app_role enum
ALTER TYPE app_role ADD VALUE 'department_treasurer';

-- Step 1.2: Create department-fund relationships table
CREATE TABLE public.department_funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  fund_type_id UUID NOT NULL REFERENCES public.fund_types(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(department_id, fund_type_id)
);

-- Step 1.3: Add department_id to financial tables
ALTER TABLE public.contributions 
ADD COLUMN department_id UUID REFERENCES public.departments(id);

ALTER TABLE public.pledges 
ADD COLUMN department_id UUID REFERENCES public.departments(id);

-- Step 1.4: Create department treasurer assignment table
CREATE TABLE public.department_treasurers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, department_id)
);

-- Phase 2: Database Functions

-- Function to check if user is department treasurer for specific department
CREATE OR REPLACE FUNCTION public.is_department_treasurer(_user_id UUID, _department_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_treasurers dt
    WHERE dt.user_id = _user_id
      AND dt.department_id = _department_id
      AND dt.is_active = true
  )
$$;

-- Function to check if user can access department finances
CREATE OR REPLACE FUNCTION public.can_access_department_finances(_user_id UUID, _department_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    -- Church treasurers can access all department finances
    public.has_role(_user_id, 'treasurer') OR
    -- Department treasurers can access their own department's finances
    public.is_department_treasurer(_user_id, _department_id) OR
    -- Other administrative roles with church-wide access
    public.has_role(_user_id, 'super_administrator') OR
    public.has_role(_user_id, 'administrator') OR
    public.has_role(_user_id, 'finance_administrator') OR
    public.has_role(_user_id, 'finance_manager') OR
    public.has_role(_user_id, 'finance_elder') OR
    public.has_role(_user_id, 'general_secretary') OR
    public.has_role(_user_id, 'pastor')
$$;

-- Function to get user's assigned departments as treasurer
CREATE OR REPLACE FUNCTION public.get_user_treasurer_departments(_user_id UUID)
RETURNS TABLE(department_id UUID, department_name TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT dt.department_id, d.name
  FROM public.department_treasurers dt
  JOIN public.departments d ON dt.department_id = d.id
  WHERE dt.user_id = _user_id
    AND dt.is_active = true
    AND d.is_active = true
$$;

-- Enable RLS on new tables
ALTER TABLE public.department_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_treasurers ENABLE ROW LEVEL SECURITY;

-- RLS policies for department_funds
CREATE POLICY "Users can view department funds they have access to"
ON public.department_funds
FOR SELECT
TO authenticated
USING (
  public.current_user_has_admin_role() OR
  public.has_role(auth.uid(), 'treasurer') OR
  public.is_department_treasurer(auth.uid(), department_id)
);

CREATE POLICY "Admins can manage department funds"
ON public.department_funds
FOR ALL
TO authenticated
USING (public.current_user_has_admin_role())
WITH CHECK (public.current_user_has_admin_role());

-- RLS policies for department_treasurers
CREATE POLICY "Users can view department treasurer assignments"
ON public.department_treasurers
FOR SELECT
TO authenticated
USING (
  public.current_user_has_admin_role() OR
  public.has_role(auth.uid(), 'treasurer') OR
  user_id = auth.uid()
);

CREATE POLICY "Admins can manage department treasurer assignments"
ON public.department_treasurers
FOR ALL
TO authenticated
USING (public.current_user_has_admin_role())
WITH CHECK (public.current_user_has_admin_role());

-- Update existing RLS policies for contributions to respect department boundaries
DROP POLICY IF EXISTS "Users can view contributions based on role" ON public.contributions;
CREATE POLICY "Users can view contributions based on role"
ON public.contributions
FOR SELECT
TO authenticated
USING (
  public.current_user_has_admin_role() OR
  public.has_role(auth.uid(), 'treasurer') OR
  public.has_role(auth.uid(), 'finance_administrator') OR
  public.has_role(auth.uid(), 'finance_manager') OR
  public.has_role(auth.uid(), 'finance_elder') OR
  public.has_role(auth.uid(), 'data_entry_clerk') OR
  public.has_role(auth.uid(), 'general_secretary') OR
  public.has_role(auth.uid(), 'pastor') OR
  (department_id IS NOT NULL AND public.is_department_treasurer(auth.uid(), department_id))
);

-- Update existing RLS policies for pledges to respect department boundaries
DROP POLICY IF EXISTS "Users can view pledges based on role" ON public.pledges;
CREATE POLICY "Users can view pledges based on role"
ON public.pledges
FOR SELECT
TO authenticated
USING (
  public.current_user_has_admin_role() OR
  public.has_role(auth.uid(), 'treasurer') OR
  public.has_role(auth.uid(), 'finance_administrator') OR
  public.has_role(auth.uid(), 'finance_manager') OR
  public.has_role(auth.uid(), 'finance_elder') OR
  public.has_role(auth.uid(), 'data_entry_clerk') OR
  public.has_role(auth.uid(), 'general_secretary') OR
  public.has_role(auth.uid(), 'pastor') OR
  (department_id IS NOT NULL AND public.is_department_treasurer(auth.uid(), department_id))
);
