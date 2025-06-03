
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, User, Target, Clock, FileText } from "lucide-react";
import { Pledge, usePledgeContributions } from "@/hooks/usePledges";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { PledgeManagementActions } from "./PledgeManagementActions";

interface PledgeDetailsDialogProps {
  pledge: Pledge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PledgeDetailsDialog({ pledge, open, onOpenChange }: PledgeDetailsDialogProps) {
  const { formatAmount } = useCurrencySettings();
  const { data: contributions = [] } = usePledgeContributions(pledge?.id || '');
  
  if (!pledge) return null;
  
  const progressPercentage = (pledge.total_paid / pledge.pledge_amount) * 100;
  
  const statusColors = {
    active: "bg-blue-500",
    upcoming: "bg-gray-500", 
    partially_fulfilled: "bg-yellow-500",
    fulfilled: "bg-green-500",
    overdue: "bg-red-500",
    cancelled: "bg-gray-400"
  };

  const statusLabels = {
    active: "Active",
    upcoming: "Upcoming",
    partially_fulfilled: "Partially Fulfilled", 
    fulfilled: "Fulfilled",
    overdue: "Overdue",
    cancelled: "Cancelled"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {pledge.purpose || "General Pledge"}
            </DialogTitle>
            <Badge className={`${statusColors[pledge.status]} text-white`}>
              {statusLabels[pledge.status]}
            </Badge>
          </div>
          
          {/* Management Actions */}
          <div className="pt-4">
            <PledgeManagementActions pledge={pledge} />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pledge Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pledge Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Contributor</p>
                    <p className="font-medium">{pledge.contributors?.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-2 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Fund Type</p>
                    <p className="font-medium">{pledge.fund_types?.name}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Pledge Amount</p>
                  <p className="text-lg font-bold text-blue-600">{formatAmount(pledge.pledge_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="font-medium capitalize">{pledge.frequency.replace('_', ' ')}</p>
                </div>
              </div>

              {pledge.installment_amount && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Installment Amount</p>
                    <p className="font-medium">{formatAmount(pledge.installment_amount)}</p>
                  </div>
                  {pledge.number_of_installments && (
                    <div>
                      <p className="text-sm text-gray-600">Number of Installments</p>
                      <p className="font-medium">{pledge.number_of_installments}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">{new Date(pledge.start_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {pledge.end_date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-medium">{new Date(pledge.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {pledge.next_payment_date && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Next Payment Due</p>
                    <p className="font-medium">{new Date(pledge.next_payment_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {pledge.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{pledge.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress & Contributions */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{formatAmount(pledge.pledge_amount)}</p>
                    <p className="text-sm text-gray-600">Total Pledged</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(pledge.total_paid)}</p>
                    <p className="text-sm text-gray-600">Total Paid</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{formatAmount(pledge.remaining_balance)}</p>
                    <p className="text-sm text-gray-600">Remaining</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Completion</span>
                    <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Contribution History */}
            <Card>
              <CardHeader>
                <CardTitle>Contribution History</CardTitle>
              </CardHeader>
              <CardContent>
                {contributions.length > 0 ? (
                  <div className="space-y-3">
                    {contributions.map((contrib) => (
                      <div key={contrib.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{formatAmount(contrib.amount_applied)}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(contrib.applied_at).toLocaleDateString()}
                          </p>
                          {contrib.notes && (
                            <p className="text-xs text-gray-500">{contrib.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Original: {formatAmount(contrib.contributions?.amount || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No contributions applied yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
