import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useUpdateApprovalDecision } from "@/hooks/useEnhancedMoneyRequests";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ApprovalStep {
  id: string;
  approver_role: string;
  step_order: number;
  is_approved?: boolean;
  approval_date?: string;
  comments?: string;
  due_date?: string;
  approver?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ApprovalChainViewerProps {
  approvalChain: ApprovalStep[];
  requestId: string;
  canApprove?: boolean;
}

export function ApprovalChainViewer({ approvalChain, requestId, canApprove }: ApprovalChainViewerProps) {
  const [selectedStep, setSelectedStep] = useState<ApprovalStep | null>(null);
  const [comments, setComments] = useState("");
  const updateApproval = useUpdateApprovalDecision();
  const { userRole } = useUserRole();

  const getStepStatus = (step: ApprovalStep) => {
    if (step.is_approved === true) return "approved";
    if (step.is_approved === false) return "rejected";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const canUserApproveStep = (step: ApprovalStep) => {
    if (!canApprove || step.is_approved !== null) return false;
    
    // Check if user has the required role for this step
    const hasRole = userRole === step.approver_role || 
                   userRole === 'administrator' ||
                   userRole === 'general_secretary' ||
                   userRole === 'pastor';
    
    // Check if this is the current step (no previous unapproved steps)
    const previousSteps = approvalChain.filter(s => s.step_order < step.step_order);
    const allPreviousApproved = previousSteps.every(s => s.is_approved === true);
    
    return hasRole && allPreviousApproved;
  };

  const handleApproval = async (stepId: string, isApproved: boolean) => {
    await updateApproval.mutateAsync({
      approvalId: stepId,
      isApproved,
      comments: comments || undefined
    });
    setSelectedStep(null);
    setComments("");
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Approval Chain
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {approvalChain
            .sort((a, b) => a.step_order - b.step_order)
            .map((step, index) => {
              const status = getStepStatus(step);
              const canApproveThisStep = canUserApproveStep(step);
              const overdue = isOverdue(step.due_date);
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </span>
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatRole(step.approver_role)}</span>
                        <Badge className={getStatusColor(status)} variant="outline">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                        {overdue && status === 'pending' && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      
                      {step.approver && (
                        <p className="text-sm text-muted-foreground">
                          {step.approver.first_name} {step.approver.last_name}
                        </p>
                      )}
                      
                      {step.approval_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(step.approval_date).toLocaleDateString()}
                        </div>
                      )}
                      
                      {step.due_date && status === 'pending' && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Due: {new Date(step.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {step.comments && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Comments</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              From: {step.approver?.first_name} {step.approver?.last_name}
                            </p>
                            <p>{step.comments}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {canApproveThisStep && (
                      <Dialog open={selectedStep?.id === step.id} onOpenChange={(open) => {
                        if (!open) {
                          setSelectedStep(null);
                          setComments("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedStep(step)}
                          >
                            Take Action
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approval Decision</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="comments">Comments (Optional)</Label>
                              <Textarea
                                id="comments"
                                placeholder="Add your comments here..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApproval(step.id, true)}
                                disabled={updateApproval.isPending}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleApproval(step.id, false)}
                                disabled={updateApproval.isPending}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}