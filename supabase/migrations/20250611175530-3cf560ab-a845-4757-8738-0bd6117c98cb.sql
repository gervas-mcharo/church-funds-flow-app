
-- Remove the problematic public policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on departments" ON public.departments;

-- Create proper RLS policies for departments table
CREATE POLICY "Anyone can view departments" 
  ON public.departments 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admins and leadership can create departments" 
  ON public.departments 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    public.current_user_has_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('general_secretary', 'pastor')
    )
  );

CREATE POLICY "Admins and leadership can update departments" 
  ON public.departments 
  FOR UPDATE 
  TO authenticated
  USING (
    public.current_user_has_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('general_secretary', 'pastor')
    )
  );

CREATE POLICY "Admins and leadership can delete departments" 
  ON public.departments 
  FOR DELETE 
  TO authenticated
  USING (
    public.current_user_has_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('general_secretary', 'pastor')
    )
  );

-- Create RLS policies for department_personnel table
ALTER TABLE public.department_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view department personnel" 
  ON public.department_personnel 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can assign personnel" 
  ON public.department_personnel 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    public.current_user_has_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('general_secretary', 'pastor')
    ) OR
    EXISTS (
      SELECT 1 FROM public.department_personnel dp
      WHERE dp.user_id = auth.uid() 
      AND dp.department_id = department_id
      AND dp.role = 'head_of_department'
    )
  );

CREATE POLICY "Authorized users can remove personnel" 
  ON public.department_personnel 
  FOR DELETE 
  TO authenticated
  USING (
    public.current_user_has_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('general_secretary', 'pastor')
    ) OR
    EXISTS (
      SELECT 1 FROM public.department_personnel dp
      WHERE dp.user_id = auth.uid() 
      AND dp.department_id = department_id
      AND dp.role = 'head_of_department'
    )
  );

CREATE POLICY "Authorized users can update personnel roles" 
  ON public.department_personnel 
  FOR UPDATE 
  TO authenticated
  USING (
    public.current_user_has_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('general_secretary', 'pastor')
    ) OR
    EXISTS (
      SELECT 1 FROM public.department_personnel dp
      WHERE dp.user_id = auth.uid() 
      AND dp.department_id = department_id
      AND dp.role = 'head_of_department'
    )
  );
