
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { usePledges, useApplyContributionToPledge } from "@/hooks/usePledges";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";

interface PledgeContributionSuggestionProps {
  contributorId: string;
  fundTypeId: string;
  contributionAmount: number;
  contributionId?: string;
  onApply?: () => void;
}

export function PledgeContributionSuggestion({
  contributorId,
  fundTypeId,
  contributionAmount,
  contributionId,
  onApply
}: PledgeContributionSuggestionProps) {
  const { formatAmount } = useCurrencySettings();
  const { data: pledges = [] } = usePledges({
    contributor_id: contributorId,
    fund_type_id: fundTypeId,
    status: 'active'
  });
  
  const applyToPledge = useApplyContributionToPledge();
  
  // Find active pledges for this contributor and fund type
  const activePledges = pledges.filter(p => 
    p.status === 'active' || p.status === 'partially_fulfilled'
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  if (activePledges.length === 0) {
    return null;
  }
  
  const handleApplyToPledge = async (pledgeId: string) => {
    if (!contributionId) return;
    
    await applyToPledge.mutateAsync({
      pledgeId,
      contributionId,
      amountApplied: contributionAmount,
      notes: `Automatically applied from contribution`
    });
    
    onApply?.();
  };
  
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Target className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-medium text-blue-900">
            Active pledges found for this contributor and fund type
          </p>
          
          {activePledges.slice(0, 2).map((pledge) => {
            const progressPercentage = (pledge.total_paid / pledge.pledge_amount) * 100;
            
            return (
              <Card key={pledge.id} className="border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {pledge.purpose || "General Pledge"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress:</span>
                    <span>{formatAmount(pledge.total_paid)} / {formatAmount(pledge.pledge_amount)}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Remaining: {formatAmount(pledge.remaining_balance)}</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  
                  {contributionId && (
                    <Button
                      size="sm"
                      onClick={() => handleApplyToPledge(pledge.id)}
                      disabled={applyToPledge.isPending}
                      className="w-full mt-2"
                    >
                      Apply {formatAmount(contributionAmount)} to this pledge
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          
          {activePledges.length > 2 && (
            <p className="text-xs text-blue-700">
              +{activePledges.length - 2} more active pledges available
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
