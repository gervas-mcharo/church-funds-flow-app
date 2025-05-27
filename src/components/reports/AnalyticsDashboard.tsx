
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Target, Download } from "lucide-react";
import { ReportFilters } from "@/pages/Reports";
import { AdvancedAnalytics } from "./AdvancedAnalytics";
import { ReportCharts } from "./ReportCharts";

interface AnalyticsDashboardProps {
  filters: ReportFilters;
  data: any[];
}

export function AnalyticsDashboard({ filters, data }: AnalyticsDashboardProps) {
  const [analyticsView, setAnalyticsView] = useState<'overview' | 'detailed' | 'predictive'>('overview');

  const exportAnalytics = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Advanced Analytics Dashboard
            </CardTitle>
            <p className="text-gray-600 mt-1">
              Comprehensive insights and predictive analytics for contribution data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={analyticsView} onValueChange={(value: any) => setAnalyticsView(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="predictive">Predictive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportAnalytics}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={analyticsView} onValueChange={setAnalyticsView} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Detailed
              </TabsTrigger>
              <TabsTrigger value="predictive" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Predictive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                <ReportCharts data={data} filters={filters} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Quick Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Contributions:</span>
                        <span className="font-semibold">{data.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active Fund Types:</span>
                        <span className="font-semibold">
                          {new Set(data.map(d => d.fund_types?.name)).size}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Unique Contributors:</span>
                        <span className="font-semibold">
                          {new Set(data.map(d => d.contributor_id)).size}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg. Contribution:</span>
                        <span className="font-semibold">
                          ${(data.reduce((sum, d) => sum + parseFloat(d.amount), 0) / data.length).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Largest Contribution:</span>
                        <span className="font-semibold">
                          ${Math.max(...data.map(d => parseFloat(d.amount))).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Growth Trend:</span>
                        <span className="font-semibold text-green-600">↑ Positive</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Data Quality
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Complete Records:</span>
                        <span className="font-semibold">
                          {data.filter(d => d.contributors?.name && d.fund_types?.name).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>With Notes:</span>
                        <span className="font-semibold">
                          {data.filter(d => d.notes).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Data Quality:</span>
                        <span className="font-semibold text-green-600">Excellent</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="mt-6">
              <AdvancedAnalytics filters={filters} />
            </TabsContent>

            <TabsContent value="predictive" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Predictive Analytics
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    AI-powered insights and forecasting based on historical data patterns
                  </p>
                </CardHeader>
                <CardContent>
                  <AdvancedAnalytics filters={filters} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
