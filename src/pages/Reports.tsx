
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportResults } from "@/components/reports/ReportResults";
import { useState } from "react";

export interface ReportFilters {
  reportType: 'individual' | 'fund-type' | 'summary';
  contributorId?: string;
  fundTypeId?: string;
  startDate?: Date;
  endDate?: Date;
  dateRange: 'custom' | 'week' | 'month' | 'quarter' | 'year';
}

const Reports = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'summary',
    dateRange: 'month'
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ReportsHeader />
        <ReportFilters filters={filters} onFiltersChange={setFilters} />
        <ReportResults filters={filters} />
      </div>
    </DashboardLayout>
  );
};

export default Reports;
