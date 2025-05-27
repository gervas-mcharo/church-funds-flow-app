
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportResults } from "@/components/reports/ReportResults";
import { ReportSearchFilters } from "@/components/reports/ReportSearchFilters";
import { AnalyticsDashboard } from "@/components/reports/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useReportData } from "@/hooks/useReportData";
import { FileText, BarChart3 } from "lucide-react";

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

  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>('reports');

  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();
  const { data: reportData = [] } = useReportData(filters, searchFilters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ReportsHeader />
        
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Standard Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Advanced Analytics
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
