import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useFundTransactions, FundTransaction } from "@/hooks/useFundTransactions";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { format } from "date-fns";
import { CalendarIcon, Download, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TransactionDetailDialog } from "./TransactionDetailDialog";

export const FundTransactionLedger = () => {
  const [selectedFund, setSelectedFund] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [transactionType, setTransactionType] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<FundTransaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: fundTypes = [] } = useFundTypes();
  const { data: transactions = [], isLoading } = useFundTransactions(
    selectedFund,
    startDate,
    endDate,
    transactionType
  );
  const { currencySymbol } = useCurrencySettings();

  const currency = currencySymbol;

  const selectedFundData = fundTypes.find(f => f.id === selectedFund);

  const totalCredits = transactions.reduce((sum, t) => 
    t.debit_credit === 'credit' ? sum + Number(t.amount) : sum, 0
  );

  const totalDebits = transactions.reduce((sum, t) => 
    t.debit_credit === 'debit' ? sum + Number(t.amount) : sum, 0
  );

  const openingBalance = transactions.length > 0 
    ? Number(transactions[transactions.length - 1]?.balance_before || 0)
    : Number(selectedFundData?.opening_balance || 0);

  const closingBalance = transactions.length > 0 
    ? Number(transactions[0]?.balance_after || 0)
    : openingBalance;

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'];
    const rows = transactions.map(t => [
      format(new Date(t.transaction_date), 'yyyy-MM-dd HH:mm:ss'),
      t.transaction_type,
      t.reference_id || 'N/A',
      t.description,
      t.debit_credit === 'debit' ? t.amount.toString() : '',
      t.debit_credit === 'credit' ? t.amount.toString() : '',
      t.balance_after.toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFundData?.name || 'fund'}_ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'contribution': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'approved_request': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'opening_balance': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'manual_adjustment': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-muted';
    }
  };

  const handleTransactionClick = (transaction: FundTransaction) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Fund Transaction Ledger</CardTitle>
          <CardDescription>View complete transaction history for each fund</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger>
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                {fundTypes.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(!startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(!endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
              </PopoverContent>
            </Popover>

            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="contribution">Contributions</SelectItem>
                <SelectItem value="approved_request">Approved Requests</SelectItem>
                <SelectItem value="opening_balance">Opening Balance</SelectItem>
                <SelectItem value="manual_adjustment">Manual Adjustments</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleExportCSV} 
              disabled={!selectedFund || transactions.length === 0}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {selectedFund && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Opening Balance</CardDescription>
              <CardTitle className="text-2xl">{currency}{openingBalance.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Credits</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                <ArrowUpCircle className="h-5 w-5 inline mr-1" />
                {currency}{totalCredits.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Debits</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                <ArrowDownCircle className="h-5 w-5 inline mr-1" />
                {currency}{totalDebits.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Closing Balance</CardDescription>
              <CardTitle className="text-2xl">{currency}{closingBalance.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {selectedFund 
              ? `Showing ${transactions.length} transaction(s) for ${selectedFundData?.name}`
              : "Select a fund to view transactions"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFund ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a fund to view its transaction ledger
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for the selected criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(transaction.transaction_date), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTransactionTypeColor(transaction.transaction_type)}>
                          {transaction.transaction_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        {transaction.debit_credit === 'debit' 
                          ? `${currency}${Number(transaction.amount).toLocaleString()}` 
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {transaction.debit_credit === 'credit' 
                          ? `${currency}${Number(transaction.amount).toLocaleString()}` 
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {currency}{Number(transaction.balance_after).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
