
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

      // Calculate totals for each fund type
      const fundBalances = fundTypes.map(fund => {
        const totalContributions = contributions
          .filter(c => c.fund_type_id === fund.id)
          .reduce((sum, c) => sum + Number(c.amount), 0);

        const totalRequests = 0; // No more money requests

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
