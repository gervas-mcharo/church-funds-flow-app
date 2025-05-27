
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters } from '@/pages/Reports';
import { format, subMonths, subYears, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

interface AnalyticsData {
  trendAnalysis: {
    monthlyTrends: Array<{
      month: string;
      amount: number;
      count: number;
      growthRate: number;
    }>;
    yearOverYearComparison: Array<{
      month: string;
      currentYear: number;
      previousYear: number;
      growthPercentage: number;
    }>;
  };
  contributorInsights: {
    topContributors: Array<{
      name: string;
      totalAmount: number;
      contributionCount: number;
      averageContribution: number;
      lastContribution: string;
    }>;
    contributorSegmentation: {
      newContributors: number;
      recurringContributors: number;
      lapsedContributors: number;
    };
  };
  fundTypeAnalysis: {
    performance: Array<{
      fundType: string;
      totalAmount: number;
      contributionCount: number;
      averageAmount: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    diversificationIndex: number;
  };
  predictiveInsights: {
    projectedMonthlyTotal: number;
    projectedYearlyTotal: number;
    confidenceLevel: number;
  };
}

export const useAdvancedAnalytics = (filters: ReportFilters) => {
  return useQuery({
    queryKey: ['advanced-analytics', filters],
    queryFn: async (): Promise<AnalyticsData> => {
      const endDate = filters.endDate || new Date();
      const startDate = filters.startDate || subYears(endDate, 2);

      // Fetch all contributions for analysis
      const { data: contributions, error } = await supabase
        .from('contributions')
        .select(`
          *,
          contributors (id, name),
          fund_types (id, name)
        `)
        .gte('contribution_date', startDate.toISOString())
        .lte('contribution_date', endDate.toISOString())
        .order('contribution_date', { ascending: true });

      if (error) throw error;

      // Process monthly trends
      const monthlyData = contributions.reduce((acc, contribution) => {
        const month = format(parseISO(contribution.contribution_date), 'yyyy-MM');
        if (!acc[month]) {
          acc[month] = { amount: 0, count: 0 };
        }
        acc[month].amount += parseFloat(contribution.amount.toString());
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, data], index, array) => {
          const prevMonth = array[index - 1];
          const growthRate = prevMonth 
            ? ((data.amount - prevMonth[1].amount) / prevMonth[1].amount) * 100
            : 0;
          
          return {
            month: format(new Date(month + '-01'), 'MMM yyyy'),
            amount: data.amount,
            count: data.count,
            growthRate
          };
        });

      // Year-over-year comparison
      const currentYear = new Date().getFullYear();
      const yearOverYearComparison = eachMonthOfInterval({
        start: startOfMonth(subYears(endDate, 1)),
        end: endOfMonth(endDate)
      }).map(month => {
        const monthKey = format(month, 'MM');
        const currentYearData = contributions
          .filter(c => {
            const date = parseISO(c.contribution_date);
            return date.getFullYear() === currentYear && format(date, 'MM') === monthKey;
          })
          .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);

        const previousYearData = contributions
          .filter(c => {
            const date = parseISO(c.contribution_date);
            return date.getFullYear() === currentYear - 1 && format(date, 'MM') === monthKey;
          })
          .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);

        const growthPercentage = previousYearData > 0 
          ? ((currentYearData - previousYearData) / previousYearData) * 100
          : 0;

        return {
          month: format(month, 'MMM'),
          currentYear: currentYearData,
          previousYear: previousYearData,
          growthPercentage
        };
      });

      // Top contributors analysis
      const contributorStats = contributions.reduce((acc, contribution) => {
        const contributorId = contribution.contributor_id;
        if (!acc[contributorId]) {
          acc[contributorId] = {
            name: contribution.contributors?.name || 'Unknown',
            totalAmount: 0,
            contributionCount: 0,
            lastContribution: contribution.contribution_date
          };
        }
        acc[contributorId].totalAmount += parseFloat(contribution.amount.toString());
        acc[contributorId].contributionCount += 1;
        if (new Date(contribution.contribution_date) > new Date(acc[contributorId].lastContribution)) {
          acc[contributorId].lastContribution = contribution.contribution_date;
        }
        return acc;
      }, {} as Record<string, any>);

      const topContributors = Object.values(contributorStats)
        .map((stats: any) => ({
          ...stats,
          averageContribution: stats.totalAmount / stats.contributionCount,
          lastContribution: format(parseISO(stats.lastContribution), 'MMM dd, yyyy')
        }))
        .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      // Fund type performance
      const fundTypeStats = contributions.reduce((acc, contribution) => {
        const fundType = contribution.fund_types?.name || 'Unknown';
        if (!acc[fundType]) {
          acc[fundType] = { totalAmount: 0, contributionCount: 0, amounts: [] };
        }
        const amount = parseFloat(contribution.amount.toString());
        acc[fundType].totalAmount += amount;
        acc[fundType].contributionCount += 1;
        acc[fundType].amounts.push(amount);
        return acc;
      }, {} as Record<string, any>);

      const fundTypePerformance = Object.entries(fundTypeStats).map(([fundType, stats]: [string, any]) => ({
        fundType,
        totalAmount: stats.totalAmount,
        contributionCount: stats.contributionCount,
        averageAmount: stats.totalAmount / stats.contributionCount,
        trend: 'stable' as 'up' | 'down' | 'stable' // Simplified for now
      }));

      // Calculate diversification index (Herfindahl-Hirschman Index)
      const totalAmount = contributions.reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);
      const diversificationIndex = Object.values(fundTypeStats).reduce((acc: number, stats: any) => {
        const marketShare = stats.totalAmount / totalAmount;
        return acc + (marketShare * marketShare);
      }, 0);

      // Simple predictive insights based on recent trends
      const recentMonths = monthlyTrends.slice(-3);
      const avgMonthlyAmount = recentMonths.reduce((sum, month) => sum + month.amount, 0) / recentMonths.length;
      const projectedMonthlyTotal = avgMonthlyAmount;
      const projectedYearlyTotal = projectedMonthlyTotal * 12;

      return {
        trendAnalysis: {
          monthlyTrends,
          yearOverYearComparison
        },
        contributorInsights: {
          topContributors,
          contributorSegmentation: {
            newContributors: 0, // Simplified for now
            recurringContributors: 0,
            lapsedContributors: 0
          }
        },
        fundTypeAnalysis: {
          performance: fundTypePerformance,
          diversificationIndex: 1 - diversificationIndex
        },
        predictiveInsights: {
          projectedMonthlyTotal,
          projectedYearlyTotal,
          confidenceLevel: 0.75
        }
      };
    },
    enabled: !!(filters.startDate || filters.endDate)
  });
};
