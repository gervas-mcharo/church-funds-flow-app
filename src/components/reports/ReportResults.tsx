
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart3 } from "lucide-react";
import { ReportFilters } from "@/pages/Reports";
import { useReportData } from "@/hooks/useReportData";
import { ReportTable } from "./ReportTable";
import { ReportCharts } from "./ReportCharts";
import { ExportButtons } from "./ExportButtons";

interface SearchFilters {
  searchTerm: string;
  amountMin?: number;
  amountMax?: number;
  fundTypeFilter?: string;
  contributorFilter?: string;
}

interface ReportResultsProps {
  filters: ReportFilters;
  searchFilters?: SearchFilters;
}

export function ReportResults({ filters, searchFilters }: ReportResultsProps) {
  const { data: reportData, isLoading, error } = useReportData(filters, searchFilters);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Generating report...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Error generating report: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!reportData || reportData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
          <p className="text-gray-600">
            {searchFilters?.searchTerm ? 
              `No contributions found matching "${searchFilters.searchTerm}" for the selected criteria.` :
              "No contributions found for the selected criteria."
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  const resultCount = reportData.length;
  const hasSearchFilters = searchFilters && (
    searchFilters.searchTerm || 
    searchFilters.amountMin !== undefined || 
    searchFilters.amountMax !== undefined || 
    searchFilters.fundTypeFilter || 
    searchFilters.contributorFilter
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Report Results</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {hasSearchFilters ? `${resultCount} results found` : `Showing ${resultCount} contributions`}
            </p>
          </div>
          <ExportButtons data={reportData} filters={filters} />
        </CardHeader>
        <CardContent>
          <ReportTable data={reportData} filters={filters} />
        </CardContent>
      </Card>

      <ReportCharts data={reportData} filters={filters} />
    </div>
  );
}
