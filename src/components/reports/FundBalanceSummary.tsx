
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useFundBalances } from "@/hooks/useFundBalances";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";

export function FundBalanceSummary() {
  const { data: fundBalances, isLoading } = useFundBalances();
  const { formatAmount } = useCurrencySettings();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading fund balances...</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (balance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const totalBalance = fundBalances?.reduce((sum, fund) => sum + fund.currentBalance, 0) || 0;
  const totalContributions = fundBalances?.reduce((sum, fund) => sum + fund.totalContributions, 0) || 0;
  const totalRequests = fundBalances?.reduce((sum, fund) => sum + fund.totalRequests, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fund Balance</CardTitle>
            {getTrendIcon(totalBalance)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(totalBalance)}`}>
              {formatAmount(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all active funds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(totalContributions)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved Requests</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(totalRequests)}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved expenditures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Fund Balance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fund Balance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fund Type</TableHead>
                <TableHead className="text-right">Opening Balance</TableHead>
                <TableHead className="text-right">Total Contributions</TableHead>
                <TableHead className="text-right">Approved Requests</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundBalances?.map((fund) => (
                <TableRow key={fund.id}>
                  <TableCell className="font-medium">{fund.name}</TableCell>
                  <TableCell className="text-right">
                    {formatAmount(Number(fund.opening_balance || 0))}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    +{formatAmount(fund.totalContributions)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatAmount(fund.totalRequests)}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${getBalanceColor(fund.currentBalance)}`}>
                    {formatAmount(fund.currentBalance)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={fund.currentBalance >= 0 ? "default" : "destructive"}>
                      {fund.currentBalance >= 0 ? "Positive" : "Deficit"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
