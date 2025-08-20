-- Phase 1: Enhanced Database Schema for Money Request Rebuild

-- Add missing fields to money_requests table
ALTER TABLE public.money_requests 
ADD COLUMN IF NOT EXISTS fund_code TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS estimated_completion_date DATE,
ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount_with_tax NUMERIC;

-- Add missing fields to approval_chain table
ALTER TABLE public.approval_chain 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delegation_to UUID,
ADD COLUMN IF NOT EXISTS approval_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- Create approval_templates table for flexible workflow configuration
CREATE TABLE IF NOT EXISTS public.approval_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID, -- NULL means applies to all departments
  name TEXT NOT NULL,
  description TEXT,
  min_amount NUMERIC DEFAULT 0,
  max_amount NUMERIC, -- NULL means no upper limit
  approval_steps JSONB NOT NULL, -- Array of {role, required, step_order, timeout_hours}
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Create notification_queue table for managing notifications
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  money_request_id UUID,
  type TEXT NOT NULL CHECK (type IN ('email', 'in_app', 'sms')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  approval_requests BOOLEAN DEFAULT true,
  status_updates BOOLEAN DEFAULT true,
  deadline_reminders BOOLEAN DEFAULT true,
  daily_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create money_request_comments table for approval discussions
CREATE TABLE IF NOT EXISTS public.money_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  money_request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal comments not visible to requester
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create money_request_status_history table for audit trail
CREATE TABLE IF NOT EXISTS public.money_request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  money_request_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.approval_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_request_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval_templates
CREATE POLICY "Admins can manage approval templates" 
ON public.approval_templates FOR ALL 
USING (current_user_has_admin_role());

CREATE POLICY "Finance roles can view approval templates" 
ON public.approval_templates FOR SELECT 
USING (
  has_role(auth.uid(), 'administrator') OR
  has_role(auth.uid(), 'finance_administrator') OR
  has_role(auth.uid(), 'finance_elder') OR
  has_role(auth.uid(), 'general_secretary') OR
  has_role(auth.uid(), 'pastor')
);

-- RLS Policies for notification_queue
CREATE POLICY "Users can view their own notifications" 
ON public.notification_queue FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY "System can manage notifications" 
ON public.notification_queue FOR ALL 
USING (true);

-- RLS Policies for user_notification_preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.user_notification_preferences FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for money_request_comments
CREATE POLICY "Users can view accessible request comments" 
ON public.money_request_comments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.money_requests mr 
    WHERE mr.id = money_request_comments.money_request_id 
    AND (
      mr.requester_id = auth.uid() OR
      has_role(auth.uid(), 'administrator') OR
      has_role(auth.uid(), 'finance_elder') OR
      has_role(auth.uid(), 'general_secretary') OR
      has_role(auth.uid(), 'pastor') OR
      can_access_department(auth.uid(), mr.requesting_department_id)
    )
  )
);

CREATE POLICY "Users can create comments on accessible requests" 
ON public.money_request_comments FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.money_requests mr 
    WHERE mr.id = money_request_comments.money_request_id 
    AND (
      mr.requester_id = auth.uid() OR
      has_role(auth.uid(), 'administrator') OR
      has_role(auth.uid(), 'finance_elder') OR
      has_role(auth.uid(), 'general_secretary') OR
      has_role(auth.uid(), 'pastor') OR
      can_access_department(auth.uid(), mr.requesting_department_id)
    )
  )
);

-- RLS Policies for money_request_status_history
CREATE POLICY "Users can view status history for accessible requests" 
ON public.money_request_status_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.money_requests mr 
    WHERE mr.id = money_request_status_history.money_request_id 
    AND (
      mr.requester_id = auth.uid() OR
      has_role(auth.uid(), 'administrator') OR
      has_role(auth.uid(), 'finance_elder') OR
      has_role(auth.uid(), 'general_secretary') OR
      has_role(auth.uid(), 'pastor') OR
      can_access_department(auth.uid(), mr.requesting_department_id)
    )
  )
);

CREATE POLICY "System can create status history" 
ON public.money_request_status_history FOR INSERT 
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_templates_department_amount ON public.approval_templates(department_id, min_amount, max_amount);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient_status ON public.notification_queue(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON public.notification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_money_request_comments_request ON public.money_request_comments(money_request_id);
CREATE INDEX IF NOT EXISTS idx_money_request_status_history_request ON public.money_request_status_history(money_request_id);

-- Create a default approval template
INSERT INTO public.approval_templates (name, description, approval_steps, is_default) 
VALUES (
  'Standard Approval Chain',
  'Default approval chain for all money requests',
  '[
    {"role": "treasurer", "required": true, "step_order": 1, "timeout_hours": 72},
    {"role": "head_of_department", "required": true, "step_order": 2, "timeout_hours": 72},
    {"role": "finance_elder", "required": true, "step_order": 3, "timeout_hours": 72},
    {"role": "general_secretary", "required": true, "step_order": 4, "timeout_hours": 72},
    {"role": "pastor", "required": true, "step_order": 5, "timeout_hours": 72}
  ]'::jsonb,
  true
);