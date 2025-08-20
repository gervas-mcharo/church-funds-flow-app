-- Remove all money request related database components

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_handle_new_money_request ON public.money_requests;
DROP TRIGGER IF EXISTS trigger_update_money_request_status_on_approval ON public.approval_chain;
DROP TRIGGER IF EXISTS trigger_handle_approval_chain_update ON public.approval_chain;
DROP TRIGGER IF EXISTS trigger_update_fund_balance_on_approval ON public.money_requests;

-- Drop functions
DROP FUNCTION IF EXISTS public.create_dynamic_approval_chain(uuid, uuid, numeric);
DROP FUNCTION IF EXISTS public.update_money_request_status_on_approval();
DROP FUNCTION IF EXISTS public.create_approval_notification(uuid, app_role, text);
DROP FUNCTION IF EXISTS public.handle_new_money_request();
DROP FUNCTION IF EXISTS public.handle_approval_chain_update();
DROP FUNCTION IF EXISTS public.create_approval_chain(uuid);
DROP FUNCTION IF EXISTS public.update_fund_balance_on_approval();

-- Drop tables (in order of dependencies)
DROP TABLE IF EXISTS public.money_request_comments CASCADE;
DROP TABLE IF EXISTS public.money_request_status_history CASCADE;
DROP TABLE IF EXISTS public.request_attachments CASCADE;
DROP TABLE IF EXISTS public.approval_chain CASCADE;
DROP TABLE IF EXISTS public.notification_queue CASCADE;
DROP TABLE IF EXISTS public.user_notification_preferences CASCADE;
DROP TABLE IF EXISTS public.approval_templates CASCADE;
DROP TABLE IF EXISTS public.money_requests CASCADE;

-- Drop custom types related to money requests
DROP TYPE IF EXISTS public.money_request_status CASCADE;