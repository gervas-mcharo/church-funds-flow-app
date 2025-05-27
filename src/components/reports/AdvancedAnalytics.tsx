
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, Target, Brain, DollarSign } from "lucide-react";
import { useAdvancedAnalytics } from "@/hooks/useAdvancedAnalytics";
import { ReportFilters } from "@/pages/Reports";
import { AdvancedCharts } from "./AdvancedCharts";

interface AdvancedAnalyticsProps {
  filters: ReportFilters;
}

export function AdvancedAnalytics({ filters }: AdvancedAnalyticsProps) {
  const { data: analytics, isLoading, error } = useAdvancedAnalytics(filters);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Generating advanced analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Error loading analytics data</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Monthly</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.predictiveInsights.projectedMonthlyTotal)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <span>Confidence:</span>
              <Progress 
                value={analytics.predictiveInsights.confidenceLevel * 100} 
                className="w-16 h-2"
              />
              <span>{(analytics.predictiveInsights.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Yearly</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.predictiveInsights.projectedYearlyTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on recent trends
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.contributorInsights.topContributors.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active contributors tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fund Diversification</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.fundTypeAnalysis.diversificationIndex * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Portfolio diversification score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Charts */}
      <AdvancedCharts analytics={analytics} />

      {/* Top Contributors Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Contributors Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.contributorInsights.topContributors.slice(0, 5).map((contributor, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{contributor.name}</p>
                    <p className="text-sm text-gray-600">
                      {contributor.contributionCount} contributions • Last: {contributor.lastContribution}
                    </p>
                  </div>
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

      {/* Fund Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fund Type Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.fundTypeAnalysis.performance.map((fund, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">{fund.fundType}</Badge>
                  <div>
                    <p className="text-sm text-gray-600">
                      {fund.contributionCount} contributions
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(fund.totalAmount)}</p>
                    <p className="text-sm text-gray-600">
                      Avg: {formatCurrency(fund.averageAmount)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {fund.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {fund.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {fund.trend === 'stable' && <div className="w-4 h-1 bg-gray-400 rounded"></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
