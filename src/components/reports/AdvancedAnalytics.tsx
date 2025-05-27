
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Users, DollarSign } from "lucide-react";

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

interface AdvancedAnalyticsProps {
  analytics: AnalyticsData;
}

export function AdvancedAnalytics({ analytics }: AdvancedAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Contributor Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.contributorInsights.topContributors.slice(0, 5).map((contributor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{contributor.name}</p>
                    <p className="text-sm text-gray-600">
                      {contributor.contributionCount} contributions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(contributor.totalAmount)}</p>
                    <p className="text-sm text-gray-600">
                      Avg: {formatCurrency(contributor.averageContribution)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fund Type Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.fundTypeAnalysis.performance.map((fund, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(fund.trend)}
                    <div>
                      <p className="font-medium">{fund.fundType}</p>
                      <p className="text-sm text-gray-600">
                        {fund.contributionCount} contributions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(fund.totalAmount)}</p>
                    <p className="text-sm text-gray-600">
                      Avg: {formatCurrency(fund.averageAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.trendAnalysis.monthlyTrends.slice(-6).map((month, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{month.month}</h4>
                  <Badge variant={month.growthRate >= 0 ? "default" : "destructive"}>
                    {month.growthRate >= 0 ? '+' : ''}{month.growthRate.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(month.amount)}</p>
                <p className="text-sm text-gray-600">{month.count} contributions</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.trendAnalysis.yearOverYearComparison.slice(-4).map((comparison, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">{comparison.month}</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">This Year</p>
                    <p className="font-semibold">{formatCurrency(comparison.currentYear)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Year</p>
                    <p className="font-semibold">{formatCurrency(comparison.previousYear)}</p>
                  </div>
                  <Badge variant={comparison.growthPercentage >= 0 ? "default" : "destructive"}>
                    {comparison.growthPercentage >= 0 ? '+' : ''}{comparison.growthPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
