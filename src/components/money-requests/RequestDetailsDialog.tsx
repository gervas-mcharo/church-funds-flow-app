import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, DollarSign, Building, User, Send, Edit3, Trash2 } from "lucide-react";
import { useMoneyRequests } from "@/hooks/useMoneyRequests";
import { useMoneyRequestPermissions } from "@/hooks/useMoneyRequestPermissions";
import { useRequestApprovals } from "@/hooks/useRequestApprovals";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { format } from "date-fns";

interface RequestDetailsDialogProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDetailsDialog({
  requestId,
  open,
  onOpenChange,
}: RequestDetailsDialogProps) {
  const [showApprovals, setShowApprovals] = useState(false);
  
  const { requests, submitRequest, deleteRequest } = useMoneyRequests();
  const { canEditRequest, canDeleteRequest } = useMoneyRequestPermissions();
  const { approvals } = useRequestApprovals(requestId || undefined);

  const request = requests?.find(r => r.id === requestId);

  if (!request) return null;

  const canEdit = canEditRequest({
    requester_id: request.requester_id,
    requesting_department_id: request.requesting_department_id,
    status: request.status,
  });

  const canDelete = canDeleteRequest;
  const canSubmit = request.status === "draft";

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

  const handleSubmit = async () => {
    if (request.id) {
      await submitRequest.mutateAsync(request.id);
    }
  };

  const handleDelete = async () => {
    if (request.id && window.confirm("Are you sure you want to delete this request?")) {
      await deleteRequest.mutateAsync(request.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl">{request.purpose}</DialogTitle>
              <DialogDescription>
                Request #{request.id.slice(0, 8)}
              </DialogDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(request.status)}>
              {formatStatus(request.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">${request.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{request.departments.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {request.profiles.first_name && request.profiles.last_name
                      ? `${request.profiles.first_name} ${request.profiles.last_name}`
                      : request.profiles.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(request.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Fund Type</h4>
                <p className="text-sm text-muted-foreground">{request.fund_types.name}</p>
              </div>

              {request.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>
              )}

              {request.suggested_vendor && (
                <div>
                  <h4 className="font-semibold mb-2">Suggested Vendor</h4>
                  <p className="text-sm text-muted-foreground">{request.suggested_vendor}</p>
                </div>
              )}

              {request.rejection_reason && (
                <div>
                  <h4 className="font-semibold mb-2 text-destructive">Rejection Reason</h4>
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                    {request.rejection_reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Timeline */}
          {request.status !== "draft" && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalTimeline requestId={request.id} />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {canSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={submitRequest.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            )}
            
            {canEdit && (
              <Button variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Request
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteRequest.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Request
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}