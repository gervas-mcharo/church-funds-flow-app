
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const useContributionTrends = () => {
  return useQuery({
    queryKey: ['contribution-trends'],
    queryFn: async () => {
      // Get fund types for dynamic rendering
      const { data: fundTypes = [] } = await supabase
        .from('fund_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
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

          // Get contributions for this month grouped by fund type
          const { data: contributions } = await supabase
            .from('contributions')
            .select(`
              amount,
              fund_types (name)
            `)
            .gte('contribution_date', monthStart.toISOString())
            .lte('contribution_date', monthEnd.toISOString());

          const monthData: any = {
            month: format(month, 'MMM')
          };

          // Group contributions by fund type dynamically
          const fundTotals: Record<string, number> = {};
          contributions?.forEach(contribution => {
            const fundName = contribution.fund_types?.name || 'Other';
            const key = fundName.toLowerCase().replace(/[^a-z0-9]/g, '');
            fundTotals[key] = (fundTotals[key] || 0) + Number(contribution.amount);
          });

          // Add all fund types dynamically
          fundTypes.forEach(fundType => {
            const key = fundType.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            monthData[key] = fundTotals[key] || 0;
          });

          return monthData;
        })
      );

      return trends;
    }
  });
};
