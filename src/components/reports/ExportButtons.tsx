
import { Button } from "@/components/ui/button";
import { Download, FileText, Table } from "lucide-react";
import { ReportFilters } from "@/pages/Reports";
import { format } from "date-fns";

interface ExportButtonsProps {
  data: any[];
  filters: ReportFilters;
}

export function ExportButtons({ data, filters }: ExportButtonsProps) {
  const exportToCSV = () => {
    const headers = ['Date', 'Contributor', 'Fund Type', 'Amount', 'Notes'];
    const csvData = data.map(contribution => [
      format(new Date(contribution.contribution_date), 'yyyy-MM-dd'),
      contribution.contributors?.name || 'Unknown',
      contribution.fund_types?.name || 'Unknown',
      contribution.amount,
      contribution.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contributions-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToJSON = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contributions-report-${format(new Date(), 'yyyy-MM-dd')}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportToCSV}>
        <Table className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportToJSON}>
        <Download className="h-4 w-4 mr-2" />
        Export JSON
      </Button>
      <Button variant="outline" size="sm" onClick={printReport}>
        <FileText className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  );
}
