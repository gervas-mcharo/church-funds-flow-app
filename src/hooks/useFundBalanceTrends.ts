
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const useFundBalanceTrends = () => {
  return useQuery({
    queryKey: ['fund-balance-trends'],
    queryFn: async () => {
      const months = [];
      const currentDate = new Date();
      
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        months.push(subMonths(currentDate, i));
      }

      const trends = await Promise.all(
        months.map(async (month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);

          // Get contributions for this month
          const { data: contributions } = await supabase
            .from('contributions')
            .select(`
              amount,
              fund_types (name)
            `)
            .gte('contribution_date', monthStart.toISOString())
            .lte('contribution_date', monthEnd.toISOString());

          // Get approved money requests for this month
          const { data: moneyRequests } = await supabase
            .from('money_requests')
            .select('amount')
            .eq('status', 'approved')
            .gte('approved_at', monthStart.toISOString())
            .lte('approved_at', monthEnd.toISOString());

          const monthlyData = {
            month: format(month, 'MMM yyyy'),
            totalContributions: contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0,
            totalRequests: moneyRequests?.reduce((sum, r) => sum + Number(r.amount), 0) || 0,
            netChange: 0
          };

          monthlyData.netChange = monthlyData.totalContributions - monthlyData.totalRequests;

          return monthlyData;
        })
      );

      return trends;
    }
  });
};
