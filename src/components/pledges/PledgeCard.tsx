
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, User, Target, Edit, Eye } from "lucide-react";
import { Pledge } from "@/hooks/usePledges";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";

interface PledgeCardProps {
  pledge: Pledge;
  onView?: (pledge: Pledge) => void;
  onEdit?: (pledge: Pledge) => void;
}

export function PledgeCard({ pledge, onView, onEdit }: PledgeCardProps) {
  const { formatAmount } = useCurrencySettings();
  
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{pledge.purpose || "General Pledge"}</CardTitle>
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-1" />
              {pledge.contributors?.name}
            </div>
          </div>
          <Badge className={`${statusColors[pledge.status]} text-white`}>
            {statusLabels[pledge.status]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-2 text-blue-600" />
            <span>Fund: {pledge.fund_types?.name}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-green-600" />
            <span>Since: {new Date(pledge.start_date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {formatAmount(pledge.total_paid)} / {formatAmount(pledge.pledge_amount)}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progressPercentage.toFixed(1)}% Complete</span>
            <span>Remaining: {formatAmount(pledge.remaining_balance)}</span>
          </div>
        </div>

        {pledge.frequency !== 'one_time' && pledge.installment_amount && (
          <div className="text-sm text-gray-600">
            <DollarSign className="h-4 w-4 inline mr-1" />
            {formatAmount(pledge.installment_amount)} {pledge.frequency}
          </div>
        )}

        {pledge.next_payment_date && pledge.status === 'active' && (
          <div className="text-sm text-orange-600">
            Next payment due: {new Date(pledge.next_payment_date).toLocaleDateString()}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(pledge)} className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(pledge)} className="flex-1">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
