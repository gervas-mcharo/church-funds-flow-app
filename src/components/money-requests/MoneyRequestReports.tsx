import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { useMoneyRequestReports } from "@/hooks/useMoneyRequestReports";
import { useDepartments } from "@/hooks/useDepartments";
import { useFundTypes } from "@/hooks/useFundTypes";
import { format } from "date-fns";

export function MoneyRequestReports() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    departmentId: "",
    status: "",
    fundTypeId: "",
  });

  const { departments } = useDepartments();
  const { fundTypes } = useFundTypes();
  const { reportData, summary, departmentSummary, isLoading } = useMoneyRequestReports(filters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      departmentId: "",
      status: "",
      fundTypeId: "",
    });
  };

  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) return;

    const headers = [
      "Request ID",
      "Purpose",
      "Amount",
      "Status",
      "Department",
      "Fund Type",
      "Requester",
      "Created Date",
      "Approved Date",
      "Rejected Date",
      "Rejection Reason",
      "Approval Duration (Days)"
    ];

    const csvContent = [
      headers.join(","),
      ...reportData.map(row => [
        row.request_id,
        `"${row.purpose}"`,
        row.amount,
        row.status,
        `"${row.department_name}"`,
        `"${row.fund_name}"`,
        `"${row.requester_name}"`,
        row.created_at,
        row.approved_at || "",
        row.rejected_at || "",
        `"${row.rejection_reason || ""}"`,
        row.approval_duration_days || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `money-requests-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColors = {
    approved: "#22c55e",
    rejected: "#ef4444",
    pending: "#f59e0b",
    draft: "#6b7280",
  };

  const getPieChartData = () => {
    if (!summary) return [];
    
    return [
      { name: "Approved", value: summary.approved_requests, color: statusColors.approved },
      { name: "Rejected", value: summary.rejected_requests, color: statusColors.rejected },
      { name: "Pending", value: summary.pending_requests, color: statusColors.pending },
      { name: "Draft", value: summary.draft_requests, color: statusColors.draft },
    ].filter(item => item.value > 0);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "rejected": return "destructive";
      case "draft": return "secondary";
      default: return "outline";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending_treasurer": return "Pending Treasurer";
      case "pending_hod": return "Pending HOD";
      case "pending_finance_elder": return "Pending Finance Elder";
      case "pending_general_secretary": return "Pending General Secretary";
      case "pending_pastor": return "Pending Pastor";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-64 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Money Request Reports</h2>
        <p className="text-muted-foreground">
          Comprehensive analysis of money requests and approval workflows
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize your report data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select onValueChange={(value) => handleFilterChange("departmentId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending_treasurer">Pending Treasurer</SelectItem>
                  <SelectItem value="pending_hod">Pending HOD</SelectItem>
                  <SelectItem value="pending_finance_elder">Pending Finance Elder</SelectItem>
                  <SelectItem value="pending_general_secretary">Pending General Secretary</SelectItem>
                  <SelectItem value="pending_pastor">Pending Pastor</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fundType">Fund Type</Label>
              <Select onValueChange={(value) => handleFilterChange("fundTypeId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Funds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Funds</SelectItem>
                  {fundTypes?.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id}>
                      {fund.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={exportToCSV} disabled={!reportData || reportData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_requests}</div>
              <p className="text-xs text-muted-foreground">
                ${summary.total_amount_requested.toLocaleString()} total requested
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.approved_requests}</div>
              <p className="text-xs text-muted-foreground">
                ${summary.total_amount_approved.toLocaleString()} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.pending_requests}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Approval Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.average_approval_time_days
                  ? `${Math.round(summary.average_approval_time_days)}d`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Days to approval
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="detailed">Detailed List</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Request Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Amount Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Amount by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Approved", amount: summary?.total_amount_approved || 0 },
                    { name: "Rejected", amount: summary?.total_amount_rejected || 0 },
                    { name: "Pending", amount: (summary?.total_amount_requested || 0) - (summary?.total_amount_approved || 0) - (summary?.total_amount_rejected || 0) }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Summary</CardTitle>
              <CardDescription>Request statistics by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentSummary.map((dept) => (
                  <div key={dept.department_name} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold">{dept.department_name}</h4>
                      <Badge variant="outline">{dept.total_requests} requests</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Requested</p>
                        <p className="font-semibold">${dept.total_amount_requested.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Approved</p>
                        <p className="font-semibold text-green-600">
                          {dept.approved_requests} (${dept.total_amount_approved.toLocaleString()})
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending</p>
                        <p className="font-semibold text-orange-600">{dept.pending_requests}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rejected</p>
                        <p className="font-semibold text-red-600">{dept.rejected_requests}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Approval Rate</span>
                        <span>
                          {dept.total_requests > 0
                            ? Math.round((dept.approved_requests / dept.total_requests) * 100)
                            : 0}%
                        </span>
                      </div>
                      <Progress
                        value={dept.total_requests > 0 ? (dept.approved_requests / dept.total_requests) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Request List</CardTitle>
              <CardDescription>Complete list of money requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.map((request) => (
                  <div key={request.request_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{request.purpose}</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.department_name} • {request.requester_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${request.amount.toLocaleString()}</p>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {formatStatus(request.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                      <div>
                        <p>Fund: {request.fund_name}</p>
                      </div>
                      <div>
                        <p>Created: {format(new Date(request.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        {request.approved_at && (
                          <p>Approved: {format(new Date(request.approved_at), "MMM d, yyyy")}</p>
                        )}
                        {request.rejected_at && (
                          <p>Rejected: {format(new Date(request.rejected_at), "MMM d, yyyy")}</p>
                        )}
                      </div>
                      <div>
                        {request.approval_duration_days && (
                          <p>Duration: {request.approval_duration_days} days</p>
                        )}
                      </div>
                    </div>

                    {request.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <p className="text-red-800">
                          <strong>Rejection Reason:</strong> {request.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}