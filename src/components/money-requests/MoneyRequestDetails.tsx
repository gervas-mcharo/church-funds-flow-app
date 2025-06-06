import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { useMoneyRequests, useApprovalChain, useUpdateApproval } from "@/hooks/useMoneyRequests";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

interface MoneyRequestDetailsProps {
  requestId: string;
  onClose: () => void;
}

export function MoneyRequestDetails({ requestId, onClose }: MoneyRequestDetailsProps) {
  const [comments, setComments] = useState("");
  const { data: requests } = useMoneyRequests();
  const { data: fundTypes } = useFundTypes();
  const { data: approvalChain } = useApprovalChain(requestId);
  const updateApprovalMutation = useUpdateApproval();
  const { formatAmount } = useCurrencySettings();

  const request = requests?.find(r => r.id === requestId);
  const fundType = fundTypes?.find(ft => ft.id === request?.fund_type_id);

  const { data: attachments } = useQuery({
    queryKey: ['request-attachments', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('request_attachments')
        .select('*')
        .eq('money_request_id', requestId);

      if (error) throw error;
      return data;
    },
    enabled: !!requestId
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      return { ...user, roles: userRoles?.map(r => r.role) || [] };
    }
  });

  if (!request) return null;

  const canApprove = (stepOrder: number, approverRole: string) => {
    if (!currentUser?.roles) return false;
    
    // Check if user has the required role for this step
    const hasRole = currentUser.roles.includes(approverRole as any);
    
    // Check if this is the current step in the approval chain
    const previousSteps = approvalChain?.filter(step => step.step_order < stepOrder) || [];
    const allPreviousApproved = previousSteps.every(step => step.is_approved === true);
    
    // Check if current step is not already decided
    const currentStep = approvalChain?.find(step => step.step_order === stepOrder);
    const isStepPending = currentStep?.is_approved === null;

    return hasRole && allPreviousApproved && isStepPending;
  };

  const handleApproval = async (approvalId: string, isApproved: boolean) => {
    await updateApprovalMutation.mutateAsync({
      approvalId,
      isApproved,
      comments: comments || undefined
    });
    setComments("");
  };

  const statusColors = {
    submitted: "bg-blue-100 text-blue-800",
    pending_hod_approval: "bg-yellow-100 text-yellow-800",
    pending_finance_elder_approval: "bg-orange-100 text-orange-800",
    pending_general_secretary_approval: "bg-purple-100 text-purple-800",
    pending_pastor_approval: "bg-pink-100 text-pink-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    paid: "bg-gray-100 text-gray-800"
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Money Request Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Department</Label>
                  <p>{request.requesting_department?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="font-medium">Requester</Label>
                  <p>
                    {request.requester 
                      ? `${request.requester.first_name || ""} ${request.requester.last_name || ""}`.trim()
                      : "Unknown"
                    }
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Date</Label>
                  <p>{new Date(request.request_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="font-medium">Amount</Label>
                  <p className="text-lg font-semibold">{formatAmount(parseFloat(request.amount.toString()))}</p>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Purpose</Label>
                <p className="mt-1">{request.purpose}</p>
              </div>

              {request.suggested_vendor && (
                <div>
                  <Label className="font-medium">Suggested Vendor</Label>
                  <p>{request.suggested_vendor}</p>
                </div>
              )}

              {request.associated_project && (
                <div>
                  <Label className="font-medium">Associated Project</Label>
                  <p>{request.associated_project}</p>
                </div>
              )}

              {fundType && (
                <div>
                  <Label className="font-medium">Fund Type</Label>
                  <p>{fundType.name}</p>
                </div>
              )}

              <div>
                <Label className="font-medium">Current Status</Label>
                <div className="mt-1">
                  <Badge className={statusColors[request.status]}>
                    {request.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Chain */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approval Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalChain?.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {step.is_approved === true ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : step.is_approved === false ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Step {step.step_order}: {step.approver_role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          {step.approver && (
                            <p className="text-sm text-gray-600">
                              {step.approver.first_name} {step.approver.last_name}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          {step.is_approved === true && (
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          )}
                          {step.is_approved === false && (
                            <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                          )}
                          {step.is_approved === null && (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                        </div>
                      </div>
                      
                      {step.approval_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(step.approval_date).toLocaleString()}
                        </p>
                      )}
                      
                      {step.comments && (
                        <p className="text-sm mt-2 p-2 bg-gray-50 rounded">{step.comments}</p>
                      )}
                      
                      {/* Approval Actions */}
                      {canApprove(step.step_order, step.approver_role) && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <Label htmlFor="comments">Comments (Optional)</Label>
                            <Textarea
                              id="comments"
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="Add your comments..."
                              rows={2}
                            />
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproval(step.id, true)}
                              disabled={updateApprovalMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleApproval(step.id, false)}
                              disabled={updateApprovalMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center space-x-2 p-2 border rounded">
                      <FileText className="h-4 w-4" />
                      <span className="flex-grow">{attachment.file_name}</span>
                      <span className="text-sm text-gray-500">
                        {attachment.file_size ? `${Math.round(attachment.file_size / 1024)} KB` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
