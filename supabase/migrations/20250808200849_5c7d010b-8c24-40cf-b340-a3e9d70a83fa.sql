-- Create missing database triggers (excluding those that already exist)

-- Trigger for automatic approval chain creation for money requests
CREATE TRIGGER trigger_money_request_approval_chain
  AFTER INSERT ON public.money_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_money_request();

-- Trigger to update fund balances when contributions are modified
CREATE TRIGGER update_fund_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contributions
  FOR EACH ROW EXECUTE PROCEDURE public.update_fund_balance_on_contribution();

-- Trigger to update fund balances when money requests are approved
CREATE TRIGGER update_fund_balance_on_approval_trigger
  AFTER UPDATE ON public.money_requests
  FOR EACH ROW EXECUTE PROCEDURE public.update_fund_balance_on_approval();

-- Trigger to update pledge totals when pledge contributions change
CREATE TRIGGER update_pledge_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pledge_contributions
  FOR EACH ROW EXECUTE PROCEDURE public.update_pledge_totals();

-- Trigger to log all pledge changes for audit purposes
CREATE TRIGGER log_pledge_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pledges
  FOR EACH ROW EXECUTE PROCEDURE public.log_pledge_changes();