import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";
import { usePledges, usePledgeStats } from "@/hooks/usePledges";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { statusColors } from "@/constants/statusColors";

export function PledgeReports() {
  const [reportType, setReportType] = useState<'fulfillment' | 'aging' | 'fund-summary'>('fulfillment');
  const [selectedFund, setSelectedFund] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  const { data: pledges = [] } = usePledges();
  const { data: stats } = usePledgeStats();
  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();
  const { formatAmount } = useCurrencySettings();
  
  const filteredPledges = pledges.filter(pledge => {
    if (selectedFund && selectedFund !== 'all' && pledge.fund_type_id !== selectedFund) return false;
    if (startDate && new Date(pledge.created_at) < startDate) return false;
    if (endDate && new Date(pledge.created_at) > endDate) return false;
    return true;
  });
  
  const overduePledges = pledges.filter(p => p.status === 'overdue');
  const upcomingPledges = pledges.filter(p => 
    p.next_payment_date && 
    new Date(p.next_payment_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  
  const fundSummary = fundTypes.map(fund => {
    const fundPledges = pledges.filter(p => p.fund_type_id === fund.id);
    const totalPledged = fundPledges.reduce((sum, p) => sum + Number(p.pledge_amount), 0);
    const totalReceived = fundPledges.reduce((sum, p) => sum + Number(p.total_paid), 0);
    const activePledges = fundPledges.filter(p => p.status === 'active' || p.status === 'partially_fulfilled').length;
    
    return {
      fund,
      totalPledged,
      totalReceived,
      activePledges,
      fulfillmentRate: totalPledged > 0 ? (totalReceived / totalPledged) * 100 : 0
    };
  });
  
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pledge Reports</h2>
          <p className="text-gray-600">Comprehensive pledge analysis and reporting</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger>
                <SelectValue placeholder="All Fund Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fund Types</SelectItem>
                {fundTypes.map(fund => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
              placeholder="Start Date"
            />
            
            <DatePicker
              date={endDate}
              onDateChange={setEndDate}
              placeholder="End Date"
            />
            
            <Button variant="outline" onClick={() => {
              setSelectedFund('all');
              setStartDate(undefined);
              setEndDate(undefined);
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fulfillment">Fulfillment Report</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
          <TabsTrigger value="fund-summary">Fund Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fulfillment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pledge Fulfillment Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Fund Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Total Pledged</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPledges.map(pledge => {
                    const progressPercentage = (pledge.total_paid / pledge.pledge_amount) * 100;
                    return (
                      <TableRow key={pledge.id}>
                        <TableCell className="font-medium">
                          {pledge.contributors?.name}
                        </TableCell>
                        <TableCell>{pledge.fund_types?.name}</TableCell>
                        <TableCell>{pledge.purpose || "General"}</TableCell>
                        <TableCell>{formatAmount(pledge.pledge_amount)}</TableCell>
                        <TableCell>{formatAmount(pledge.total_paid)}</TableCell>
                        <TableCell>{formatAmount(pledge.remaining_balance)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={progressPercentage} className="w-16 h-2" />
                            <span className="text-xs">{progressPercentage.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[pledge.status]} text-white`}>
                            {pledge.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="aging" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Calendar className="h-5 w-5" />
                  Overdue Pledges ({overduePledges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overduePledges.slice(0, 5).map(pledge => (
                    <div key={pledge.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                      <div>
                        <p className="font-medium">{pledge.contributors?.name}</p>
                        <p className="text-sm text-gray-600">{pledge.fund_types?.name}</p>
                        <p className="text-xs text-red-600">
                          Due: {pledge.next_payment_date ? new Date(pledge.next_payment_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(pledge.remaining_balance)}</p>
                        <p className="text-xs text-gray-600">remaining</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Calendar className="h-5 w-5" />
                  Upcoming Payments ({upcomingPledges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingPledges.slice(0, 5).map(pledge => (
                    <div key={pledge.id} className="flex justify-between items-center p-3 bg-orange-50 rounded">
                      <div>
                        <p className="font-medium">{pledge.contributors?.name}</p>
                        <p className="text-sm text-gray-600">{pledge.fund_types?.name}</p>
                        <p className="text-xs text-orange-600">
                          Due: {pledge.next_payment_date ? new Date(pledge.next_payment_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(pledge.installment_amount || pledge.remaining_balance)}</p>
                        <p className="text-xs text-gray-600">expected</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="fund-summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Fund-Specific Pledge Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund Type</TableHead>
                    <TableHead>Total Pledged</TableHead>
                    <TableHead>Total Received</TableHead>
                    <TableHead>Active Pledges</TableHead>
                    <TableHead>Fulfillment Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundSummary.map(summary => (
                    <TableRow key={summary.fund.id}>
                      <TableCell className="font-medium">{summary.fund.name}</TableCell>
                      <TableCell>{formatAmount(summary.totalPledged)}</TableCell>
                      <TableCell>{formatAmount(summary.totalReceived)}</TableCell>
                      <TableCell>{summary.activePledges}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={summary.fulfillmentRate} className="w-16 h-2" />
                          <span className="text-xs">{summary.fulfillmentRate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
