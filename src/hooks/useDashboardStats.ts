
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get total contributions by fund type
      const { data: contributions, error: contributionsError } = await supabase
        .from('contributions')
        .select(`
          amount,
          fund_types (name)
        `);

      if (contributionsError) throw contributionsError;

      // Calculate totals by fund type
      const fundTotals = contributions.reduce((acc, contribution) => {
        const fundName = contribution.fund_types?.name || 'Unknown';
        acc[fundName] = (acc[fundName] || 0) + Number(contribution.amount);
        return acc;
      }, {} as Record<string, number>);

      // Get recent contributions
      const { data: recentContributions, error: recentError } = await supabase
        .from('contributions')
        .select(`
          *,
          contributors (name),
          fund_types (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Calculate overall stats
      const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
      const contributorCount = await supabase
        .from('contributors')
        .select('id', { count: 'exact' });

      return {
        fundTotals,
        recentContributions,
        totalAmount,
        contributorCount: contributorCount.count || 0,
        contributionCount: contributions.length
      };
    }
  });
};
