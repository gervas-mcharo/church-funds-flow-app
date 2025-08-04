-- Complete schema rebuild to remove super_administrator role
-- Phase 1: Drop all RLS policies that reference super_administrator

-- Drop policies on user_roles table
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

-- Drop policies on contributors table
DROP POLICY IF EXISTS "Authorized users can create contributors" ON public.contributors;
DROP POLICY IF EXISTS "Authorized users can update contributors" ON public.contributors;
DROP POLICY IF EXISTS "Authorized users can view contributors" ON public.contributors;
DROP POLICY IF EXISTS "High-level admins can delete contributors" ON public.contributors;

-- Drop policies on fund_types table
DROP POLICY IF EXISTS "High-level admins can delete funds" ON public.fund_types;

-- Drop policies on qr_codes table
DROP POLICY IF EXISTS "Admin roles can update QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "High-level admin roles can delete QR codes" ON public.qr_codes;

-- Phase 2: Create new enum without super_administrator
CREATE TYPE public.app_role_new AS ENUM (
    'administrator',
    'finance_administrator',
    'finance_manager',
    'finance_elder',
    'treasurer',
    'department_treasurer',
    'data_entry_clerk',
    'general_secretary',
    'pastor',
    'head_of_department',
    'department_member',
    'secretary'
);

-- Phase 3: Update tables to use new enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE app_role_new 
USING role::text::app_role_new;

ALTER TABLE public.department_personnel 
ALTER COLUMN role TYPE app_role_new 
USING role::text::app_role_new;

ALTER TABLE public.approval_chain 
ALTER COLUMN approver_role TYPE app_role_new 
USING approver_role::text::app_role_new;

-- Phase 4: Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Phase 5: Recreate all RLS policies without super_administrator

-- Recreate user_roles policies
CREATE POLICY "Admins can assign roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (current_user_has_admin_role());

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (current_user_has_admin_role());

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (current_user_has_admin_role());

CREATE POLICY "Users can view roles" 
ON public.user_roles 
FOR SELECT 
USING (current_user_has_admin_role() OR user_id = auth.uid());

-- Recreate contributors policies
CREATE POLICY "Authorized users can create contributors" 
ON public.contributors 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'treasurer', 'general_secretary', 'pastor')
    )
);

CREATE POLICY "Authorized users can update contributors" 
ON public.contributors 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'general_secretary', 'pastor')
    )
);

CREATE POLICY "Authorized users can view contributors" 
ON public.contributors 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'data_entry_clerk', 'general_secretary', 'pastor')
    )
);

CREATE POLICY "High-level admins can delete contributors" 
ON public.contributors 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'general_secretary', 'pastor')
    )
);

-- Recreate fund_types policies
CREATE POLICY "High-level admins can delete funds" 
ON public.fund_types 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'general_secretary', 'pastor')
    )
);

-- Recreate qr_codes policies
CREATE POLICY "Admin roles can update QR codes" 
ON public.qr_codes 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'finance_manager', 'finance_elder')
    )
);

CREATE POLICY "High-level admin roles can delete QR codes" 
ON public.qr_codes 
FOR DELETE 
USING (can_delete_qr_codes());

-- Verification: Check that no references to super_administrator remain
DO $$
BEGIN
    -- This will fail if any super_administrator references still exist
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE check_clause LIKE '%super_administrator%'
    ) THEN
        RAISE EXCEPTION 'super_administrator references still exist in check constraints';
    END IF;
    
    RAISE NOTICE 'Schema rebuild completed successfully - super_administrator role removed';
END $$;