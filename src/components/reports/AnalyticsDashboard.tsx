
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedAnalytics } from "./AdvancedAnalytics";
import { AdvancedCharts } from "./AdvancedCharts";
import { useAdvancedAnalytics } from "@/hooks/useAdvancedAnalytics";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { ReportFilters } from "@/pages/Reports";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { useState } from "react";

interface AnalyticsDashboardProps {
  filters: ReportFilters;
  data: any[];
}

type AnalyticsView = "overview" | "detailed" | "predictive";

export function AnalyticsDashboard({ filters, data }: AnalyticsDashboardProps) {
  const [activeView, setActiveView] = useState<AnalyticsView>("overview");
  const { data: analytics, isLoading, error } = useAdvancedAnalytics(filters);
  const { formatAmount } = useCurrencySettings();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading analytics: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;


  return (
    <div className="space-y-6">
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as AnalyticsView)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projected Monthly</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(analytics.predictiveInsights.projectedMonthlyTotal)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(analytics.predictiveInsights.confidenceLevel * 100).toFixed(0)}% confidence
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
                <p className="text-xs text-muted-foreground">
                  Active contributors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fund Diversity</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analytics.fundTypeAnalysis.diversificationIndex * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Diversification index
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fund Types</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.fundTypeAnalysis.performance.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active fund types
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Overview Charts */}
          <AdvancedCharts analytics={analytics} />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <AdvancedAnalytics analytics={analytics} />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Monthly Projection</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(analytics.predictiveInsights.projectedMonthlyTotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Based on recent trends
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Yearly Projection</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatAmount(analytics.predictiveInsights.projectedYearlyTotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Confidence: {(analytics.predictiveInsights.confidenceLevel * 100).toFixed(0)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900">Focus on Top Performers</h5>
                    <p className="text-sm text-blue-700">
                      Target outreach to your top {Math.min(5, analytics.contributorInsights.topContributors.length)} contributors
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900">Diversify Fund Types</h5>
                    <p className="text-sm text-green-700">
                      Current diversification: {(analytics.fundTypeAnalysis.diversificationIndex * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h5 className="font-medium text-purple-900">Seasonal Planning</h5>
                    <p className="text-sm text-purple-700">
                      Plan campaigns based on historical trends
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
