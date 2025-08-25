import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ApprovalQueue() {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const { pendingApprovals, approveRequest, rejectRequest, isLoading } = usePendingApprovals();
  const { formatAmount } = useCurrencySettings();

  const handleApprovalAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      if (action === "approve") {
        await approveRequest.mutateAsync({ requestId, comments: comments || undefined });
      } else {
        if (!comments.trim()) {
          alert("Please provide a reason for rejection");
          return;
        }
        await rejectRequest.mutateAsync({ requestId, comments });
      }
      
      setComments("");
      setDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error processing approval:", error);
    }
  };

  const openApprovalDialog = (requestId: string, action: "approve" | "reject") => {
    setSelectedRequest(requestId);
    setActionType(action);
    setComments("");
    setDialogOpen(true);
  };

  const getApprovalLevelLabel = (level: string) => {
    switch (level) {
      case "department_treasurer":
        return "Department Treasurer";
      case "head_of_department":
        return "Head of Department";
      case "finance_elder":
        return "Finance Elder";
      case "general_secretary":
        return "General Secretary";
      case "pastor":
        return "Pastor";
      default:
        return level;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded"></div>
        <div className="h-32 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (!pendingApprovals || pendingApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending approvals</h3>
          <p className="text-muted-foreground">
            All requests requiring your approval have been processed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold">
          {pendingApprovals.length} request{pendingApprovals.length !== 1 ? 's' : ''} requiring your approval
        </h3>
      </div>

      {pendingApprovals.map((approval) => (
        <Card key={approval.request_id} className="border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{approval.purpose}</CardTitle>
                <CardDescription>
                  {approval.department_name} • {formatAmount(approval.amount)}
                </CardDescription>
              </div>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {getApprovalLevelLabel(approval.approval_level)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Requested by</p>
                  <p className="text-sm text-muted-foreground">{approval.requester_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(approval.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => openApprovalDialog(approval.request_id, "reject")}
                  disabled={approveRequest.isPending || rejectRequest.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => openApprovalDialog(approval.request_id, "approve")}
                  disabled={approveRequest.isPending || rejectRequest.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Add optional comments for this approval"
                : "Please provide a reason for rejecting this request"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comments {actionType === "reject" && <span className="text-destructive">*</span>}
              </label>
              <Textarea
                placeholder={
                  actionType === "approve"
                    ? "Optional comments..."
                    : "Please explain why this request is being rejected..."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={actionType === "approve" ? "default" : "destructive"}
                onClick={() => selectedRequest && handleApprovalAction(selectedRequest, actionType)}
                disabled={
                  (actionType === "reject" && !comments.trim()) ||
                  approveRequest.isPending ||
                  rejectRequest.isPending
                }
              >
                {actionType === "approve" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}