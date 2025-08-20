-- Create enums for money request system
CREATE TYPE public.request_status AS ENUM (
  'draft',
  'submitted', 
  'pending_treasurer',
  'pending_hod',
  'pending_finance_elder', 
  'pending_general_secretary',
  'pending_pastor',
  'approved',
  'rejected',
  'paid'
);

CREATE TYPE public.approval_level AS ENUM (
  'department_treasurer',
  'head_of_department', 
  'finance_elder',
  'general_secretary',
  'pastor'
);

-- Create money_requests table
CREATE TABLE public.money_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requesting_department_id UUID NOT NULL REFERENCES public.departments(id),
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  purpose TEXT NOT NULL,
  description TEXT,
  suggested_vendor TEXT,
  fund_type_id UUID NOT NULL REFERENCES public.fund_types(id),
  status public.request_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Create approval_chain table
CREATE TABLE public.approval_chain (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  approval_level public.approval_level NOT NULL,
  order_sequence INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id, approval_level)
);

-- Create request_approvals table  
CREATE TABLE public.request_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.money_requests(id) ON DELETE CASCADE,
  approval_level public.approval_level NOT NULL,
  approver_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  order_sequence INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request_attachments table
CREATE TABLE public.request_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.money_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_queue table
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  request_id UUID NOT NULL REFERENCES public.money_requests(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for money_requests
CREATE POLICY "Department members can view their department requests"
ON public.money_requests FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Request creator can always see their request
    requester_id = auth.uid() OR
    -- Department personnel can see department requests
    can_access_department(auth.uid(), requesting_department_id) OR
    -- Finance roles can see all requests
    has_role(auth.uid(), 'administrator') OR
    has_role(auth.uid(), 'finance_administrator') OR
    has_role(auth.uid(), 'finance_manager') OR
    has_role(auth.uid(), 'finance_elder') OR
    has_role(auth.uid(), 'treasurer') OR
    has_role(auth.uid(), 'general_secretary') OR
    has_role(auth.uid(), 'pastor')
  )
);

CREATE POLICY "Users can create requests based on role"
ON public.money_requests FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Department members can only create for their department
    (can_access_department(auth.uid(), requesting_department_id) AND requester_id = auth.uid()) OR
    -- Finance roles and leadership can create for any department
    has_role(auth.uid(), 'administrator') OR
    has_role(auth.uid(), 'finance_administrator') OR
    has_role(auth.uid(), 'finance_manager') OR
    has_role(auth.uid(), 'finance_elder') OR
    has_role(auth.uid(), 'treasurer') OR
    has_role(auth.uid(), 'general_secretary') OR
    has_role(auth.uid(), 'pastor')
  )
);

CREATE POLICY "Users can update requests based on role and status"
ON public.money_requests FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    -- Request creator can edit their own draft requests
    (requester_id = auth.uid() AND status = 'draft') OR
    -- Finance roles and leadership can edit any request
    has_role(auth.uid(), 'administrator') OR
    has_role(auth.uid(), 'finance_administrator') OR
    has_role(auth.uid(), 'general_secretary') OR
    has_role(auth.uid(), 'pastor')
  )
);

CREATE POLICY "High-level admins can delete requests"
ON public.money_requests FOR DELETE
USING (
  has_role(auth.uid(), 'administrator') OR
  has_role(auth.uid(), 'finance_administrator') OR
  has_role(auth.uid(), 'general_secretary') OR
  has_role(auth.uid(), 'pastor')
);

-- RLS Policies for approval_chain
CREATE POLICY "Users can view approval chains"
ON public.approval_chain FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage approval chains"
ON public.approval_chain FOR ALL
USING (
  has_role(auth.uid(), 'administrator') OR
  has_role(auth.uid(), 'finance_administrator') OR
  has_role(auth.uid(), 'general_secretary') OR
  has_role(auth.uid(), 'pastor')
)
WITH CHECK (
  has_role(auth.uid(), 'administrator') OR
  has_role(auth.uid(), 'finance_administrator') OR
  has_role(auth.uid(), 'general_secretary') OR
  has_role(auth.uid(), 'pastor')
);

-- RLS Policies for request_approvals
CREATE POLICY "Users can view relevant approvals"
ON public.request_approvals FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Approver can see their approval tasks
    approver_id = auth.uid() OR
    -- Can see if they can view the related request
    EXISTS (
      SELECT 1 FROM public.money_requests mr 
      WHERE mr.id = request_id AND (
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
    )
  )
);

CREATE POLICY "System can create approvals"
ON public.request_approvals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Approvers can update their approvals"
ON public.request_approvals FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    approver_id = auth.uid() OR
    has_role(auth.uid(), 'administrator') OR
    has_role(auth.uid(), 'finance_administrator')
  )
);

-- RLS Policies for request_attachments
CREATE POLICY "Users can view attachments for accessible requests"
ON public.request_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.money_requests mr 
    WHERE mr.id = request_id AND (
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
  )
);

CREATE POLICY "Users can upload attachments to accessible requests"
ON public.request_attachments FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.money_requests mr 
    WHERE mr.id = request_id AND (
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
  )
);

-- RLS Policies for notification_queue
CREATE POLICY "Users can view their own notifications"
ON public.notification_queue FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notification_queue FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notification_queue FOR UPDATE
USING (user_id = auth.uid());

-- Create storage bucket for request attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('request-attachments', 'request-attachments', false);

-- Storage policies for request attachments
CREATE POLICY "Users can view attachments for accessible requests"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'request-attachments' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.request_attachments ra
    JOIN public.money_requests mr ON ra.request_id = mr.id
    WHERE ra.file_path = name AND (
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
  )
);

CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'request-attachments' AND
  auth.uid() IS NOT NULL
);

-- Insert default approval chains for existing departments
INSERT INTO public.approval_chain (department_id, approval_level, order_sequence) 
SELECT 
  d.id,
  'department_treasurer',
  1
FROM public.departments d
WHERE d.is_active = true;

INSERT INTO public.approval_chain (department_id, approval_level, order_sequence) 
SELECT 
  d.id,
  'head_of_department',
  2
FROM public.departments d
WHERE d.is_active = true;

INSERT INTO public.approval_chain (department_id, approval_level, order_sequence) 
SELECT 
  d.id,
  'finance_elder',
  3
FROM public.departments d
WHERE d.is_active = true;

INSERT INTO public.approval_chain (department_id, approval_level, order_sequence) 
SELECT 
  d.id,
  'general_secretary',
  4
FROM public.departments d
WHERE d.is_active = true;

INSERT INTO public.approval_chain (department_id, approval_level, order_sequence) 
SELECT 
  d.id,
  'pastor',
  5
FROM public.departments d
WHERE d.is_active = true;