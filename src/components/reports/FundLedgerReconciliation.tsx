import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFundLedgerReconciliation } from "@/hooks/useFundLedgerReconciliation";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { CheckCircle2, AlertCircle } from "lucide-react";

export const FundLedgerReconciliation = () => {
  const { data: reconciliation = [], isLoading } = useFundLedgerReconciliation();
  const { currencySymbol } = useCurrencySettings();

  const currency = currencySymbol;

  const reconciledCount = reconciliation.filter(r => r.is_reconciled).length;
  const varianceCount = reconciliation.filter(r => !r.is_reconciled).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Reconciled Funds</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              <CheckCircle2 className="h-5 w-5 inline mr-1" />
              {reconciledCount} / {reconciliation.length}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Funds with Variance</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              <AlertCircle className="h-5 w-5 inline mr-1" />
              {varianceCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fund Reconciliation Status</CardTitle>
          <CardDescription>
            Comparing fund balances with transaction ledger balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading reconciliation data...
            </div>
          ) : reconciliation.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No funds available for reconciliation
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund Name</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead className="text-right">Ledger Balance</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliation.map((item) => (
                    <TableRow key={item.fund_id}>
                      <TableCell className="font-medium">{item.fund_name}</TableCell>
                      <TableCell className="text-right">
                        {currency}{item.current_balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {currency}{item.ledger_balance.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        item.variance !== 0 ? 'text-red-600' : 'text-muted-foreground'
                      }`}>
                        {item.variance !== 0 
                          ? `${currency}${Math.abs(item.variance).toLocaleString()}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        {item.is_reconciled ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Reconciled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Variance Found
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
