import { useState } from "react";
import { Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMoneyRequests } from "@/hooks/useMoneyRequests";
import { useMoneyRequestPermissions } from "@/hooks/useMoneyRequestPermissions";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { CreateMoneyRequestDialog } from "@/components/money-requests/CreateMoneyRequestDialog";
import { RequestDetailsDialog } from "@/components/money-requests/RequestDetailsDialog";
import { ApprovalQueue } from "@/components/money-requests/ApprovalQueue";
import { format } from "date-fns";

export default function MoneyRequests() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  const { requests, isLoading } = useMoneyRequests();
  const { canCreateRequestsForAnyDepartment, canApproveRequests, canViewAllRequests } = useMoneyRequestPermissions();
  const { pendingCount } = usePendingApprovals();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "draft":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "draft":
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending_treasurer":
        return "Pending Treasurer";
      case "pending_hod":
        return "Pending HOD";
      case "pending_finance_elder":
        return "Pending Finance Elder";
      case "pending_general_secretary":
        return "Pending General Secretary";
      case "pending_pastor":
        return "Pending Pastor";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const myRequests = requests?.filter(r => r.requester_id) || [];
  const allRequests = canViewAllRequests ? requests || [] : myRequests;

  if (isLoading) {
    return (
      <DashboardLayout 
        title="Money Requests"
        description="Manage departmental funding requests and approvals"
      >
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-32 bg-muted animate-pulse rounded"></div>
          <div className="h-32 bg-muted animate-pulse rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  const headerContent = canCreateRequestsForAnyDepartment ? (
    <Button onClick={() => setCreateDialogOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      New Request
    </Button>
  ) : null;

  return (
    <DashboardLayout 
      title="Money Requests"
      description="Manage departmental funding requests and approvals"
      headerContent={headerContent}
    >

      <Tabs defaultValue="my-requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          {canViewAllRequests && (
            <TabsTrigger value="all-requests">All Requests</TabsTrigger>
          )}
          {canApproveRequests && (
            <TabsTrigger value="approvals" className="relative">
              Pending Approvals
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-requests" className="space-y-4">
          {myRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first money request to get started
                </p>
                {canCreateRequestsForAnyDepartment && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Request
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{request.purpose}</CardTitle>
                        <CardDescription>
                          {request.departments.name} • ${request.amount.toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {formatStatus(request.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Fund: {request.fund_types.name}
                      </p>
                      {request.description && (
                        <p className="text-sm">{request.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {canViewAllRequests && (
          <TabsContent value="all-requests" className="space-y-4">
            <div className="grid gap-4">
              {allRequests.map((request) => (
                <Card 
                  key={request.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{request.purpose}</CardTitle>
                        <CardDescription>
                          {request.departments.name} • ${request.amount.toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {formatStatus(request.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Requester: {request.profiles.first_name && request.profiles.last_name 
                            ? `${request.profiles.first_name} ${request.profiles.last_name}`
                            : request.profiles.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fund: {request.fund_types.name}
                        </p>
                      </div>
                      {request.description && (
                        <p className="text-sm">{request.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {canApproveRequests && (
          <TabsContent value="approvals">
            <ApprovalQueue />
          </TabsContent>
        )}
      </Tabs>

      <CreateMoneyRequestDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <RequestDetailsDialog
        requestId={selectedRequestId}
        open={!!selectedRequestId}
        onOpenChange={(open) => !open && setSelectedRequestId(null)}
      />
    </DashboardLayout>
  );
}