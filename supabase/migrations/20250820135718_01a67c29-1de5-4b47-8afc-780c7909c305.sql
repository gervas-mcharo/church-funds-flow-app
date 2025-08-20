-- Add missing foreign key constraints for money_requests table
-- These are needed for the Supabase joins to work correctly

-- Add foreign key constraint from money_requests.requester_id to profiles.id
ALTER TABLE public.money_requests 
ADD CONSTRAINT fk_money_requests_requester 
FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint from money_requests.requesting_department_id to departments.id
ALTER TABLE public.money_requests 
ADD CONSTRAINT fk_money_requests_department 
FOREIGN KEY (requesting_department_id) REFERENCES public.departments(id) ON DELETE CASCADE;

-- Add foreign key constraint from money_requests.fund_type_id to fund_types.id
ALTER TABLE public.money_requests 
ADD CONSTRAINT fk_money_requests_fund_type 
FOREIGN KEY (fund_type_id) REFERENCES public.fund_types(id) ON DELETE CASCADE;