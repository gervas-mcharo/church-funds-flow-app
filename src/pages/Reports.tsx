
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportResults } from "@/components/reports/ReportResults";
import { ReportSearchFilters } from "@/components/reports/ReportSearchFilters";
import { useState } from "react";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";

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

  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ReportsHeader />
        <ReportFilters filters={filters} onFiltersChange={setFilters} />
        <ReportSearchFilters 
          onFiltersChange={setSearchFilters}
          fundTypes={fundTypes}
          contributors={contributors}
        />
        <ReportResults filters={filters} searchFilters={searchFilters} />
      </div>
    </DashboardLayout>
  );
};

export default Reports;
