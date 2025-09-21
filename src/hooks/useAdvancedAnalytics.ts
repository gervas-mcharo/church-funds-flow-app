
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

      const filteredData = contributions || [];
      const currentDate = new Date();

      // Process monthly trends
      const monthlyData = filteredData.reduce((acc, contribution) => {
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
          const growthRate = prevMonth && prevMonth[1].amount > 0
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
        const currentYearData = filteredData
          .filter(c => {
            const date = parseISO(c.contribution_date);
            return date.getFullYear() === currentYear && format(date, 'MM') === monthKey;
          })
          .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);

        const previousYearData = filteredData
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
      const contributorStats = filteredData.reduce((acc, contribution) => {
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

      // Calculate contributor segmentation
      const threeMonthsAgo = subMonths(currentDate, 3);
      const contributorActivity = new Map<string, {
        firstContribution: Date;
        lastContribution: Date;
        contributionCount: number;
        recentMonths: Set<string>;
      }>();

      filteredData.forEach(contribution => {
        const contributorId = contribution.contributor_id;
        const contributionDate = new Date(contribution.contribution_date);
        const monthKey = format(contributionDate, 'yyyy-MM');
        
        if (!contributorActivity.has(contributorId)) {
          contributorActivity.set(contributorId, {
            firstContribution: contributionDate,
            lastContribution: contributionDate,
            contributionCount: 0,
            recentMonths: new Set()
          });
        }
        
        const activity = contributorActivity.get(contributorId)!;
        activity.contributionCount++;
        activity.recentMonths.add(monthKey);
        
        if (contributionDate < activity.firstContribution) {
          activity.firstContribution = contributionDate;
        }
        if (contributionDate > activity.lastContribution) {
          activity.lastContribution = contributionDate;
        }
      });

      let newContributors = 0;
      let recurringContributors = 0;
      let lapsedContributors = 0;

      contributorActivity.forEach((activity) => {
        // New contributors: first contribution in the selected period
        if (activity.firstContribution >= (filters.startDate || threeMonthsAgo)) {
          newContributors++;
        }
        // Recurring contributors: multiple contributions in different months
        else if (activity.recentMonths.size > 1 && activity.lastContribution >= threeMonthsAgo) {
          recurringContributors++;
        }
        // Lapsed contributors: haven't contributed in the last 3 months
        else if (activity.lastContribution < threeMonthsAgo) {
          lapsedContributors++;
        } else {
          recurringContributors++; // Active single-month contributors
        }
      });

      // Fund type performance
      const fundTypeStats = filteredData.reduce((acc, contribution) => {
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

      // Helper function to calculate trend
      function calculateTrend(currentAmount: number, fundType: string): 'up' | 'down' | 'stable' {
        // Calculate previous period amount (comparing to 6 months ago)
        const sixMonthsAgo = subMonths(currentDate, 6);
        const previousPeriodData = filteredData.filter(d => 
          d.fund_types?.name === fundType && 
          new Date(d.contribution_date) < sixMonthsAgo
        );
        
        const previousAmount = previousPeriodData.reduce((sum, d) => sum + Number(d.amount), 0);
        
        if (previousAmount === 0) return 'stable';
        
        const growthRate = (currentAmount - previousAmount) / previousAmount;
        
        if (growthRate > 0.05) return 'up'; // 5% growth threshold
        if (growthRate < -0.05) return 'down'; // 5% decline threshold
        return 'stable';
      }

      const fundTypePerformance = Object.entries(fundTypeStats).map(([fundType, stats]: [string, any]) => ({
        fundType,
        totalAmount: stats.totalAmount,
        contributionCount: stats.contributionCount,
        averageAmount: stats.totalAmount / stats.contributionCount,
        trend: calculateTrend(stats.totalAmount, fundType)
      }));

      // Calculate diversification index (Herfindahl-Hirschman Index)
      const totalAmount = filteredData.reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);
      const diversificationIndex = Object.values(fundTypeStats).reduce((acc: number, stats: any) => {
        const marketShare = stats.totalAmount / totalAmount;
        return acc + (marketShare * marketShare);
      }, 0);

      // Enhanced predictive insights based on recent trends
      const recentMonths = monthlyTrends.slice(-3); // Last 3 months
      const avgMonthlyTotal = recentMonths.length > 0 ? 
        recentMonths.reduce((sum, m) => sum + m.amount, 0) / recentMonths.length : 0;
      
      // Calculate trend-based projection
      const recentGrowthRates = monthlyTrends.slice(-3).map(m => m.growthRate);
      const avgGrowthRate = recentGrowthRates.length > 0 ?
        recentGrowthRates.reduce((sum, rate) => sum + rate, 0) / recentGrowthRates.length : 0;
      
      const projectedMonthlyTotal = avgMonthlyTotal * (1 + avgGrowthRate / 100);
      const projectedYearlyTotal = projectedMonthlyTotal * 12;
      
      // Calculate confidence based on data consistency
      const variance = recentGrowthRates.length > 1 ?
        recentGrowthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowthRate, 2), 0) / recentGrowthRates.length : 0;
      const confidenceLevel = Math.max(0.3, Math.min(0.95, 1 - (variance / 100))); // Scale confidence based on variance

      return {
        trendAnalysis: {
          monthlyTrends,
          yearOverYearComparison
        },
        contributorInsights: {
          topContributors,
          contributorSegmentation: {
            newContributors,
            recurringContributors,
            lapsedContributors
          }
        },
        fundTypeAnalysis: {
          performance: fundTypePerformance,
          diversificationIndex: 1 - diversificationIndex
        },
        predictiveInsights: {
          projectedMonthlyTotal,
          projectedYearlyTotal,
          confidenceLevel
        }
      };
    },
    enabled: !!(filters.startDate || filters.endDate)
  });
};
