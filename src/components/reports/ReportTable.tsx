
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportFilters } from "@/pages/Reports";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ReportTableProps {
  data: any[];
  filters: ReportFilters;
}

export function ReportTable({ data, filters }: ReportTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (filters.reportType === 'summary') {
    // Group data by fund type for summary
    const summaryData = data.reduce((acc, contribution) => {
      const fundTypeName = contribution.fund_types?.name || 'Unknown';
      if (!acc[fundTypeName]) {
        acc[fundTypeName] = {
          fundType: fundTypeName,
          totalAmount: 0,
          contributionCount: 0
        };
      }
      acc[fundTypeName].totalAmount += parseFloat(contribution.amount);
      acc[fundTypeName].contributionCount += 1;
      return acc;
    }, {});

    const summaryArray = Object.values(summaryData) as any[];
    const grandTotal = summaryArray.reduce((sum, item) => sum + item.totalAmount, 0);

    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fund Type</TableHead>
              <TableHead>Contributions</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryArray.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.fundType}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.contributionCount}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.totalAmount)}
                </TableCell>
                <TableCell className="text-right">
                  {((item.totalAmount / grandTotal) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold bg-gray-50">
              <TableCell>Total</TableCell>
              <TableCell>
                <Badge>{data.length}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(grandTotal)}</TableCell>
              <TableCell className="text-right">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Contributor</TableHead>
          <TableHead>Fund Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((contribution) => (
          <TableRow key={contribution.id}>
            <TableCell>
              {format(new Date(contribution.contribution_date), 'MMM dd, yyyy')}
            </TableCell>
            <TableCell className="font-medium">
              {contribution.contributors?.name || 'Unknown'}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{contribution.fund_types?.name || 'Unknown'}</Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(parseFloat(contribution.amount))}
            </TableCell>
            <TableCell className="text-gray-600 max-w-xs truncate">
              {contribution.notes || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
