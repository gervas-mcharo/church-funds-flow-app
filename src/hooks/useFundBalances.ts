
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFundBalances = () => {
  return useQuery({
    queryKey: ['fund-balances'],
    queryFn: async () => {
      // Get fund types with their current balances
      const { data: fundTypes, error: fundError } = await supabase
        .from('fund_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fundError) throw fundError;

      // Get total contributions by fund type
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('fund_type_id, amount');

      if (contribError) throw contribError;

      // Get total approved money requests by fund type
      const { data: approvedRequests, error: requestsError } = await supabase
        .from('money_requests')
        .select('fund_type_id, amount')
        .eq('status', 'approved');

      if (requestsError) throw requestsError;

      // Calculate totals for each fund type
      const fundBalances = fundTypes.map(fund => {
        const totalContributions = contributions
          .filter(c => c.fund_type_id === fund.id)
          .reduce((sum, c) => sum + Number(c.amount), 0);

        const totalRequests = (approvedRequests || [])
          .filter(r => r.fund_type_id === fund.id)
          .reduce((sum, r) => sum + Number(r.amount), 0);

        return {
          ...fund,
          totalContributions,
          totalRequests,
          calculatedBalance: Number(fund.opening_balance || 0) + totalContributions - totalRequests,
          currentBalance: Number(fund.current_balance || 0)
        };
      });

      return fundBalances;
    }
  });
};
