import { CheckCircle, XCircle, Clock, User, AlertCircle } from "lucide-react";
import { useRequestApprovals } from "@/hooks/useRequestApprovals";
import { useApproverDetails } from "@/hooks/useApproverDetails";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ApprovalTimelineProps {
  requestId: string;
}

export function ApprovalTimeline({ requestId }: ApprovalTimelineProps) {
  const { 
    approvals, 
    isLoading, 
    getApprovalStatusIcon,
    getApprovalLevelLabel,
    getApproverName,
    getCurrentApprovalStep 
  } = useRequestApprovals(requestId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-muted animate-pulse rounded"></div>
        <div className="h-16 bg-muted animate-pulse rounded"></div>
        <div className="h-16 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Clock className="h-12 w-12 mx-auto mb-4" />
        <p>No approval steps configured</p>
      </div>
    );
  }

  const currentStep = getCurrentApprovalStep();

  return (
    <div className="space-y-4">
      {approvals.map((approval, index) => {
        const isActive = approval.order_sequence === currentStep;
        const isCompleted = approval.status === "approved";
        const isRejected = approval.status === "rejected";
        
        return (
          <div key={approval.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2
                ${isCompleted 
                  ? 'bg-green-100 border-green-500 text-green-700' 
                  : isRejected
                  ? 'bg-red-100 border-red-500 text-red-700'
                  : isActive
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-gray-100 border-gray-300 text-gray-500'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isRejected ? (
                  <XCircle className="h-4 w-4" />
                ) : isActive ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{approval.order_sequence}</span>
                )}
              </div>
              
              {index < approvals.length - 1 && (
                <div className={`
                  w-0.5 h-12 mt-2
                  ${isCompleted ? 'bg-green-300' : 'bg-gray-300'}
                `} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  {getApprovalLevelLabel(approval.approval_level)}
                </h4>
                <span className={`
                  text-xs px-2 py-1 rounded-full
                  ${isCompleted 
                    ? 'bg-green-100 text-green-700' 
                    : isRejected
                    ? 'bg-red-100 text-red-700'
                    : isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {approval.status === "approved" ? "Approved" : 
                   approval.status === "rejected" ? "Rejected" : 
                   isActive ? "Pending" : "Waiting"}
                </span>
              </div>
              
              <ApproverInfo approval={approval} />
              
              {approval.approved_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isCompleted ? "Approved" : "Rejected"} on {format(new Date(approval.approved_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
              
              {approval.comments && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <p className="font-medium">Comments:</p>
                  <p className="text-muted-foreground">{approval.comments}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApproverInfo({ approval }: { approval: any }) {
  const { data: approverDetails } = useApproverDetails(approval.approver_id);
  
  const getApproverDisplay = () => {
    if (!approval.approver_id) {
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <AlertCircle className="h-3 w-3 text-amber-500" />
          <span>No approver assigned</span>
          <Badge variant="outline" className="text-xs ml-2">
            Needs Assignment
          </Badge>
        </div>
      );
    }
    
    if (!approverDetails) {
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <User className="h-3 w-3" />
          <span>Loading approver...</span>
        </div>
      );
    }
    
    const displayName = approverDetails.first_name && approverDetails.last_name 
      ? `${approverDetails.first_name} ${approverDetails.last_name}`
      : approverDetails.email;
    
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
        <User className="h-3 w-3" />
        <span>{displayName}</span>
        {approverDetails.email && displayName !== approverDetails.email && (
          <span className="text-xs">({approverDetails.email})</span>
        )}
      </div>
    );
  };
  
  return getApproverDisplay();
}