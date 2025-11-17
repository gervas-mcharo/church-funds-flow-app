
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportResults } from "@/components/reports/ReportResults";
import { ReportSearchFilters } from "@/components/reports/ReportSearchFilters";
import { AnalyticsDashboard } from "@/components/reports/AnalyticsDashboard";
import { FundBalanceSummary } from "@/components/reports/FundBalanceSummary";
import { MoneyRequestReports } from "@/components/money-requests/MoneyRequestReports";
import { FundBalanceTrends } from "@/components/reports/FundBalanceTrends";
import { FundTransactionLedger } from "@/components/reports/FundTransactionLedger";
import { FundLedgerReconciliation } from "@/components/reports/FundLedgerReconciliation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useReportData } from "@/hooks/useReportData";
import { FileText, BarChart3, Wallet, TrendingUp, BookOpen, CheckCircle2 } from "lucide-react";

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

  const [activeTab, setActiveTab] = useState<'reports' | 'analytics' | 'balances' | 'trends' | 'money-requests' | 'ledger' | 'reconciliation'>('reports');

  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();
  const { data: reportData = [] } = useReportData(filters, searchFilters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ReportsHeader />
        
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-7 overflow-x-auto">
            <TabsTrigger value="reports" className="flex items-center gap-1 px-2">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Contribution Reports</span>
              <span className="sm:hidden text-xs">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 px-2">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Advanced Analytics</span>
              <span className="sm:hidden text-xs">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center gap-1 px-2">
              <Wallet className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Fund Balances</span>
              <span className="sm:hidden text-xs">Balances</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-1 px-2">
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Balance Trends</span>
              <span className="sm:hidden text-xs">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="money-requests" className="flex items-center gap-1 px-2">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Money Requests</span>
              <span className="sm:hidden text-xs">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="ledger" className="flex items-center gap-1 px-2">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Fund Ledger</span>
              <span className="sm:hidden text-xs">Ledger</span>
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="flex items-center gap-1 px-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Reconciliation</span>
              <span className="sm:hidden text-xs">Recon</span>
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

          <TabsContent value="ledger" className="space-y-6">
            <FundTransactionLedger />
          </TabsContent>

          <TabsContent value="reconciliation" className="space-y-6">
            <FundLedgerReconciliation />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
