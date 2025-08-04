-- Complete schema rebuild to remove super_administrator role
-- Drop ALL policies that reference app_role enum columns

-- Drop ALL policies from all tables that use role columns
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

DROP POLICY IF EXISTS "Authorized users can create contributors" ON public.contributors;
DROP POLICY IF EXISTS "Authorized users can update contributors" ON public.contributors;
DROP POLICY IF EXISTS "Authorized users can view contributors" ON public.contributors;
DROP POLICY IF EXISTS "High-level admins can delete contributors" ON public.contributors;

DROP POLICY IF EXISTS "High-level admins can delete funds" ON public.fund_types;

DROP POLICY IF EXISTS "Admin roles can update QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "High-level admin roles can delete QR codes" ON public.qr_codes;

-- Drop department policies that reference roles
DROP POLICY IF EXISTS "Admins and leadership can create departments" ON public.departments;
DROP POLICY IF EXISTS "Admins and leadership can update departments" ON public.departments;
DROP POLICY IF EXISTS "Admins and leadership can delete departments" ON public.departments;

-- Drop department_personnel policies
DROP POLICY IF EXISTS "Authorized users can assign personnel" ON public.department_personnel;
DROP POLICY IF EXISTS "Authorized users can update personnel roles" ON public.department_personnel;
DROP POLICY IF EXISTS "Authorized users can remove personnel" ON public.department_personnel;

-- Drop approval_chain policies
DROP POLICY IF EXISTS "Approvers can update their approval decisions" ON public.approval_chain;
DROP POLICY IF EXISTS "Users can approve for their department role" ON public.approval_chain;

-- Drop money_requests policies
DROP POLICY IF EXISTS "Authorized users can update money requests" ON public.money_requests;

-- Drop all other policies that might reference roles
DROP POLICY IF EXISTS "Users can view accessible approval chains" ON public.approval_chain;
DROP POLICY IF EXISTS "Users can view accessible money requests" ON public.money_requests;
DROP POLICY IF EXISTS "Department personnel can update requests" ON public.money_requests;

-- Create new enum without super_administrator
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

-- Update tables to use new enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE app_role_new 
USING role::text::app_role_new;

ALTER TABLE public.department_personnel 
ALTER COLUMN role TYPE app_role_new 
USING role::text::app_role_new;

ALTER TABLE public.approval_chain 
ALTER COLUMN approver_role TYPE app_role_new 
USING approver_role::text::app_role_new;

-- Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Recreate ALL policies without super_administrator references

-- User roles policies
CREATE POLICY "Admins can assign roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (current_user_has_admin_role());

CREATE POLICY "Admins can delete roles" 
ON public.user_roles FOR DELETE 
USING (current_user_has_admin_role());

CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE 
USING (current_user_has_admin_role());

CREATE POLICY "Users can view roles" 
ON public.user_roles FOR SELECT 
USING (current_user_has_admin_role() OR user_id = auth.uid());

-- Department policies
CREATE POLICY "Admins and leadership can create departments" 
ON public.departments FOR INSERT 
WITH CHECK (
    current_user_has_admin_role() OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('general_secretary', 'pastor'))
);

CREATE POLICY "Admins and leadership can update departments" 
ON public.departments FOR UPDATE 
USING (
    current_user_has_admin_role() OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('general_secretary', 'pastor'))
);

CREATE POLICY "Admins and leadership can delete departments" 
ON public.departments FOR DELETE 
USING (
    current_user_has_admin_role() OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('general_secretary', 'pastor'))
);

-- Department personnel policies
CREATE POLICY "Authorized users can assign personnel" 
ON public.department_personnel FOR INSERT 
WITH CHECK (
    current_user_has_admin_role() OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('general_secretary', 'pastor')) OR
    EXISTS (SELECT 1 FROM public.department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department')
);

CREATE POLICY "Authorized users can update personnel roles" 
ON public.department_personnel FOR UPDATE 
USING (
    current_user_has_admin_role() OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('general_secretary', 'pastor')) OR
    EXISTS (SELECT 1 FROM public.department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department')
);

CREATE POLICY "Authorized users can remove personnel" 
ON public.department_personnel FOR DELETE 
USING (
    current_user_has_admin_role() OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('general_secretary', 'pastor')) OR
    EXISTS (SELECT 1 FROM public.department_personnel dp WHERE dp.user_id = auth.uid() AND dp.department_id = department_id AND dp.role = 'head_of_department')
);

-- Approval chain policies
CREATE POLICY "Approvers can update their approval decisions" 
ON public.approval_chain FOR UPDATE 
USING (approver_id = auth.uid() OR has_role(auth.uid(), 'administrator'));

CREATE POLICY "Users can approve for their department role" 
ON public.approval_chain FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.money_requests mr 
        WHERE mr.id = money_request_id 
        AND has_department_role(auth.uid(), mr.requesting_department_id, approver_role)
    )
);

CREATE POLICY "Users can view accessible approval chains" 
ON public.approval_chain FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.money_requests mr 
        WHERE mr.id = money_request_id 
        AND (
            mr.requester_id = auth.uid() OR
            has_role(auth.uid(), 'administrator') OR
            has_role(auth.uid(), 'head_of_department') OR
            has_role(auth.uid(), 'finance_elder') OR
            has_role(auth.uid(), 'general_secretary') OR
            has_role(auth.uid(), 'pastor') OR
            can_access_department(auth.uid(), mr.requesting_department_id)
        )
    )
);

-- Money requests policies
CREATE POLICY "Authorized users can update money requests" 
ON public.money_requests FOR UPDATE 
USING (
    has_role(auth.uid(), 'administrator') OR
    has_role(auth.uid(), 'head_of_department') OR
    has_role(auth.uid(), 'finance_elder') OR
    has_role(auth.uid(), 'general_secretary') OR
    has_role(auth.uid(), 'pastor')
);

CREATE POLICY "Department personnel can update requests" 
ON public.money_requests FOR UPDATE 
USING (can_access_department(auth.uid(), requesting_department_id));

CREATE POLICY "Users can view accessible money requests" 
ON public.money_requests FOR SELECT 
USING (
    requester_id = auth.uid() OR
    has_role(auth.uid(), 'administrator') OR
    has_role(auth.uid(), 'head_of_department') OR
    has_role(auth.uid(), 'finance_elder') OR
    has_role(auth.uid(), 'general_secretary') OR
    has_role(auth.uid(), 'pastor') OR
    can_access_department(auth.uid(), requesting_department_id)
);

-- Contributors policies
CREATE POLICY "Authorized users can create contributors" 
ON public.contributors FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'treasurer', 'general_secretary', 'pastor')
    )
);

CREATE POLICY "Authorized users can update contributors" 
ON public.contributors FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'general_secretary', 'pastor')
    )
);

CREATE POLICY "Authorized users can view contributors" 
ON public.contributors FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'data_entry_clerk', 'general_secretary', 'pastor')
    )
);

CREATE POLICY "High-level admins can delete contributors" 
ON public.contributors FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'general_secretary', 'pastor')
    )
);

-- Fund types policies
CREATE POLICY "High-level admins can delete funds" 
ON public.fund_types FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'general_secretary', 'pastor')
    )
);

-- QR codes policies
CREATE POLICY "Admin roles can update QR codes" 
ON public.qr_codes FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'finance_administrator', 'finance_manager', 'finance_elder')
    )
);

CREATE POLICY "High-level admin roles can delete QR codes" 
ON public.qr_codes FOR DELETE 
USING (can_delete_qr_codes());

RAISE NOTICE 'Schema rebuild completed - super_administrator role successfully removed';