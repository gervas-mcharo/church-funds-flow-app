
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportResults } from "@/components/reports/ReportResults";
import { ReportSearchFilters } from "@/components/reports/ReportSearchFilters";
import { AnalyticsDashboard } from "@/components/reports/AnalyticsDashboard";
import { FundBalanceSummary } from "@/components/reports/FundBalanceSummary";
import { MoneyRequestReports } from "@/components/money-requests/MoneyRequestReports";
import { FundBalanceTrends } from "@/components/reports/FundBalanceTrends";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useReportData } from "@/hooks/useReportData";
import { FileText, BarChart3, Wallet, TrendingUp } from "lucide-react";

export interface ReportFilters {
  reportType: 'individual' | 'fund-type' | 'summary';
  contributorId?: string;
  fundTypeId?: string;
  startDate?: Date;
  endDate?: Date;
  dateRange: 'custom' | 'week' | 'month' | 'quarter' | 'year';
}

interface SearchFilters {
  searchTerm: string;
  amountMin?: number;
  amountMax?: number;
  fundTypeFilter?: string;
  contributorFilter?: string;
}

const Reports = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'summary',
    dateRange: 'month'
  });

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: ""
  });

  const [activeTab, setActiveTab] = useState<'reports' | 'analytics' | 'balances' | 'trends' | 'money-requests'>('reports');

  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();
  const { data: reportData = [] } = useReportData(filters, searchFilters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ReportsHeader />
        
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contribution Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Advanced Analytics
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Fund Balances
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Balance Trends
            </TabsTrigger>
            <TabsTrigger value="money-requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Money Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <ReportFilters filters={filters} onFiltersChange={setFilters} />
            <ReportSearchFilters 
              onFiltersChange={setSearchFilters}
              fundTypes={fundTypes}
              contributors={contributors}
            />
            <ReportResults filters={filters} searchFilters={searchFilters} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ReportFilters filters={filters} onFiltersChange={setFilters} />
            <AnalyticsDashboard filters={filters} data={reportData} />
          </TabsContent>

          <TabsContent value="balances" className="space-y-6">
            <FundBalanceSummary />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <FundBalanceTrends />
          </TabsContent>

          <TabsContent value="money-requests" className="space-y-6">
            <MoneyRequestReports />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
